import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local", override: true, quiet: true });
const url=new URL(process.env.DATABASE_URL!);
if (process.env.LOCAL_DEMO_MODE !== "1" || url.hostname !== "127.0.0.1" || url.port !== "5433") throw new Error("Integration test is restricted to the isolated local demo database");
const {prisma}=await import("../lib/prisma");
const {createRecord,updateRecord,getRecord,listRecords,processNextRun}=await import("../lib/platform-store");
import { GRID_TASK, type PlatformData, type PlatformKind, type PlatformUser } from "../lib/platform-catalog";
import { loadGraphRecordsFromPrisma } from "../lib/network-graph";
const actor=(role:string):PlatformUser=>({id:`local-${role.toLowerCase()}`,email:`${role.toLowerCase()}@demo.humanoidth.local`,role});
const owner=actor("USER"),lab=actor("LAB"),admin=actor("ADMIN"),organizer=actor("ORGANIZER"),judge=actor("JUDGE"),moderator=actor("MODERATOR");
test("public network excludes private Atlas records and submission review notes", async () => {
  const id = randomUUID();
  const submissionId = `privacy-submission-${id}`, inventoryId = `privacy-inventory-${id}`, contributionId = `privacy-contribution-${id}`;
  try {
    await prisma.submittedData.create({ data: { id: submissionId, submissionType: "source_url", title: "Private pending submission", notes: "PRIVATE-INTERNAL-NOTES", reviewNotes: "PRIVATE-REVIEW-NOTES" } });
    await prisma.ownedInventory.create({ data: { id: inventoryId, displayName: "Private inventory", ownershipStatus: "owned", visibility: "private" } });
    await prisma.contribution.create({ data: { id: contributionId, title: "Private contribution", contributionType: "research", visibility: "private" } });
    const privateIds = new Set([submissionId, inventoryId, contributionId]);
    assert.equal((await loadGraphRecordsFromPrisma()).some(record => privateIds.has(record.id)), false);
    await prisma.submittedData.update({ where: { id: submissionId }, data: { status: "APPROVED" } });
    const published = (await loadGraphRecordsFromPrisma()).find(record => record.id === submissionId);
    assert.ok(published);
    assert.equal(published.description, null);
    assert.equal(published.evidence_excerpt, null);
    assert.equal(JSON.stringify(published).includes("PRIVATE-"), false);
  } finally {
    await prisma.submittedData.deleteMany({ where: { id: submissionId } });
    await prisma.ownedInventory.deleteMany({ where: { id: inventoryId } });
    await prisma.contribution.deleteMany({ where: { id: contributionId } });
  }
});
test("persisted workflows enforce ownership and reach reports, rankings, competition results and moderation",async()=>{
  const ids:string[]=[], posts:string[]=[];
  async function create(kind:PlatformKind,data:PlatformData,user=owner,parentId?:string) {
    const record=await createRecord(kind,{requestId:randomUUID(),title:`[integration] ${kind}`,data,parentId},user);ids.push(record.id);return record;
  }
  async function act(id:string,action:string,data:PlatformData={},user=owner) {
    const record=await prisma.platformRecord.findUniqueOrThrow({where:{id}});
    return updateRecord(id,record.revision,action,data,user);
  }
  async function finishRun(id:string) {
    for(let attempt=0;attempt<200;attempt++) {
      const run=await prisma.platformRecord.findUniqueOrThrow({where:{id}});
      if (!["QUEUED","RUNNING"].includes(run.status)) return;
      await processNextRun();await new Promise(resolve=>setTimeout(resolve,20));
    }
    throw new Error("Simulator queue did not finish the test run");
  }
  try {
    const robot=await prisma.robotModel.findFirstOrThrow();
    const evaluation=await create("EVALUATION",{robotId:robot.id,version:"v1",firmwareVersion:"fw1",hardwareSpec:"Pilot hardware",contactEmail:"private@example.test",documents:"https://example.test/private"});
    await assert.rejects(()=>getRecord(evaluation.id,organizer),/not found/);
    await assert.rejects(()=>act(evaluation.id,"PLAN",{},owner));
    await act(evaluation.id,"SUBMIT");await act(evaluation.id,"ASSIGN",{assignedToId:lab.id},admin);
    await act(evaluation.id,"REQUEST_INFO",{reason:"Need hardware detail"},lab);
    await act(evaluation.id,"SAVE",evaluation.data as PlatformData);await act(evaluation.id,"SUBMIT");
    await act(evaluation.id,"PLAN",{costTHB:100,appointment:new Date(Date.now()+86400_000).toISOString(),reason:"Pilot slot"},lab);
    await act(evaluation.id,"CONFIRM");await act(evaluation.id,"RECEIVE",{reason:"Robot received"},lab);await act(evaluation.id,"START_TEST",{},lab);
    await act(evaluation.id,"RECORD_RESULTS",{rounds:Array.from({length:5},()=>({precisionMm:2.4,speedSec:4.6,safetyPassed:true,evidenceUrl:"https://example.test/round"}))},lab);
    await act(evaluation.id,"CERTIFY",{reason:"Checked five pilot rounds"},lab);await act(evaluation.id,"RETURN_ROBOT",{reason:"Returned to owner"},lab);
    assert.equal((await getRecord(evaluation.id,owner)).status,"CERTIFIED");
    await act(evaluation.id,"PUBLISH");
    const publicReport=await getRecord(evaluation.id,null);
    assert.equal("contactEmail" in (publicReport.data as PlatformData),false);assert.equal("documents" in (publicReport.data as PlatformData),false);
    assert.ok((await listRecords("EVALUATION",null)).some(record=>record.id===evaluation.id));

    const program=await create("PROGRAM",{program:GRID_TASK.starter});
    const run=await create("RUN",{programId:program.id,purpose:"EVALUATION"});
    await finishRun(run.id);
    assert.equal((await getRecord(run.id,owner)).status,"SUCCEEDED");await act(run.id,"PUBLISH");
    const cancelled=await create("RUN",{programId:program.id});await act(cancelled.id,"CANCEL");await processNextRun();
    assert.equal((await getRecord(cancelled.id,owner)).status,"CANCELLED");
    const practice=await create("RUN",{programId:program.id,purpose:"PRACTICE"});await finishRun(practice.id);await assert.rejects(()=>act(practice.id,"PUBLISH"));
    const interrupted=await create("RUN",{programId:program.id});
    await prisma.platformRecord.update({where:{id:interrupted.id},data:{status:"RUNNING",revision:5,updatedAt:new Date(Date.now()-180000)}});
    await processNextRun();
    assert.equal((await getRecord(interrupted.id,owner)).status,"FAILED");
    assert.match(String(((await getRecord(interrupted.id,owner)).data as PlatformData).errorReason),/interrupted/);

    const competition=await create("COMPETITION",{format:"ONLINE",rules:"Score descending; ties use earliest application",closesAt:new Date(Date.now()+86400_000).toISOString(),appealsUntil:new Date(Date.now()+172800_000).toISOString(),venue:"Online",qualifyScore:50},organizer);
    await act(competition.id,"ASSIGN",{assignedToId:judge.id},organizer);await act(competition.id,"OPEN",{},organizer);
    const entry=await create("ENTRY",{teamName:"Integration team",members:"One eligible participant"},owner,competition.id);
    await assert.rejects(()=>create("ENTRY",{teamName:"Duplicate",members:"Same owner"},owner,competition.id),/already/);
    await act(entry.id,"ACCEPT",{},organizer);
    const competitionRun=await create("RUN",{programId:program.id,purpose:"EVALUATION"},owner,entry.id);await finishRun(competitionRun.id);
    await assert.rejects(()=>act(entry.id,"SCORE",{runId:run.id,score:999,reason:"Wrong run"},judge),/verified run/);
    const scored=await act(entry.id,"SCORE",{runId:competitionRun.id,verifiedScore:999,reason:"Validated trace"},judge);
    assert.equal((scored.data as PlatformData).score,100);
    await act(entry.id,"APPEAL",{reason:"Please recheck"});await act(entry.id,"RESOLVE_APPEAL",{score:95,reason:"Confirmed adjusted score"},judge);
    await assert.rejects(()=>act(entry.id,"FINALIZE",{},judge),/appeal/);
    // Advance the test fixture's deadline without changing the application's clock/policy.
    const fixtureData={...(competition.data as PlatformData),closesAt:new Date(Date.now()-2000).toISOString(),appealsUntil:new Date(Date.now()-1000).toISOString()};
    await prisma.platformRecord.update({where:{id:competition.id},data:{data:fixtureData as never,assignedToId:judge.id,status:"OPEN",isPublished:true}});
    await act(entry.id,"FINALIZE",{},judge);await act(competition.id,"CLOSE",{},organizer);await act(competition.id,"PUBLISH_RESULTS",{},organizer);
    const announced=await prisma.platformRecord.findUniqueOrThrow({where:{id:competition.id}});
    await act(entry.id,"AMEND_SCORE",{score:96,reason:"Corrected official arithmetic"},judge);
    assert.equal(Number(((await prisma.platformRecord.findUniqueOrThrow({where:{id:competition.id}})).data as PlatformData).resultsVersion),Number((announced.data as PlatformData).resultsVersion)+1);

    const draft=await create("DRAFT",{content:"Integration news",type:"NEWS",sources:"",tags:"robotics"});
    await assert.rejects(()=>act(draft.id,"PUBLISH"),/source/);
    await act(draft.id,"SAVE",{content:"Integration news",type:"NEWS",sources:"https://example.test/source",tags:"robotics"});
    const published=await act(draft.id,"PUBLISH");const postId=String((published.data as PlatformData).postId);posts.push(postId);
    const report=await create("REPORT",{postId,reason:"Please review this post"});
    await assert.rejects(()=>act(report.id,"HIDE",{reason:"Unauthorized"},owner));
    await act(report.id,"HIDE",{reason:"Verified moderation report"},moderator);
    assert.equal((await prisma.communityPost.findUniqueOrThrow({where:{id:postId}})).visibilityStatus,"HIDDEN");
    assert.equal(((await getRecord(draft.id,owner)).data as PlatformData).publicationStatus,"HIDDEN");
    const report2=await create("REPORT",{postId,reason:"Restore after correction"});await act(report2.id,"RESTORE",{reason:"Correction verified"},moderator);
    assert.equal((await prisma.communityPost.findUniqueOrThrow({where:{id:postId}})).visibilityStatus,"PUBLISHED");

    const before=await prisma.platformRecord.count({where:{kind:"PROGRAM",ownerId:owner.id}});
    const body={requestId:randomUUID(),title:"[integration] Idempotent",data:{program:"F"}};
    const first=await createRecord("PROGRAM",body,owner);ids.push(first.id);const second=await createRecord("PROGRAM",body,owner);assert.equal(first.id,second.id);
    assert.equal(await prisma.platformRecord.count({where:{kind:"PROGRAM",ownerId:owner.id}}),before+1);
    await assert.rejects(()=>updateRecord(first.id,99,"SAVE",{program:"F F"},owner),/changed/);
    const competing=await Promise.allSettled([updateRecord(first.id,0,"SAVE",{program:"F F"},owner),updateRecord(first.id,0,"SAVE",{program:"R F"},owner)]);
    assert.equal(competing.filter(result=>result.status==="fulfilled").length,1);
    assert.equal(competing.filter(result=>result.status==="rejected").length,1);
    const events=await prisma.platformEvent.findMany({where:{recordId:evaluation.id},orderBy:{revision:"asc"}});assert.ok(events.length>=10);
  } finally {
    await prisma.platformEvent.deleteMany({where:{recordId:{in:ids}}});
    await prisma.platformRecord.deleteMany({where:{id:{in:ids}}});
    await prisma.communityPost.deleteMany({where:{id:{in:posts}}});
    await prisma.$disconnect();
  }
});
