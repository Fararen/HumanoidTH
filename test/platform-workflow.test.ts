import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { runGridProgram } from "../lib/grid-simulator";
import { initialData, transition, type WorkRecord } from "../lib/platform-policy";
import { GRID_TASK, type PlatformUser } from "../lib/platform-catalog";
import { publicCompanyModel, approvalSnapshot, approvalMatches } from "../lib/company-policy";
import type { CompanyModelRecord } from "../lib/company-leaderboard";
const user: PlatformUser={id:"owner",role:"USER",email:"user@example.test"};
const lab: PlatformUser={id:"lab",role:"LAB",email:"lab@example.test"};
const judge: PlatformUser={id:"judge",role:"JUDGE",email:"judge@example.test"};
const organizer: PlatformUser={id:"organizer",role:"ORGANIZER",email:"organizer@example.test"};
const record=(kind:string,status:string,data:Record<string,unknown>={}): WorkRecord=>({id:randomUUID(),kind,ownerId:user.id,assignedToId:lab.id,parentId:null,title:"Test",status,revision:0,isPublished:false,data});

test("grid simulator reaches the goal reproducibly, reports collisions and rejects arbitrary code",()=>{
  const result=runGridProgram(GRID_TASK.starter);
  assert.equal(result.succeeded,true);assert.equal(result.score,100);assert.equal(result.steps,9);
  assert.deepEqual(result,runGridProgram(GRID_TASK.starter));
  assert.equal(runGridProgram("L F").succeeded,false);
  assert.equal(runGridProgram("F R F").reason,"Collision with wall or obstacle");
  for(const input of ["", "eval(x)","F;fetch(url)","F ".repeat(101)]) assert.throws(()=>runGridProgram(input));
});
test("physical workflow gates lab access, requires five evidence-backed rounds and separates report certification from safety",()=>{
  const request=record("EVALUATION","SUBMITTED",{version:"v1"});
  assert.throws(()=>transition(request,"PLAN",{},user));
  const plan={costTHB:100,appointment:"2026-12-01T09:00:00+07:00",reason:"Pilot visit"};
  const planned=transition(request,"PLAN",plan,lab);assert.equal(planned.status,"PLANNED");
  assert.throws(()=>transition({...request,...planned},"CONFIRM",{},lab));
  const confirmed=transition({...request,...planned},"CONFIRM",{},user);assert.equal(confirmed.status,"CONFIRMED");
  const testing=record("EVALUATION","TESTING");
  assert.throws(()=>transition(testing,"RECORD_RESULTS",{rounds:[]},lab));
  const rounds=Array.from({length:5},()=>({precisionMm:2,speedSec:4,safetyPassed:true,evidenceUrl:"https://example.test/evidence"}));
  rounds[2].safetyPassed=false;
  const review=transition(testing,"RECORD_RESULTS",{rounds},lab);assert.equal(review.data.precisionMm,2);assert.equal(review.data.safetyPassed,false);
  const certified=transition({...testing,...review},"CERTIFY",{reason:"Verified all pilot logs"},lab);assert.equal(certified.status,"CERTIFIED");
  assert.throws(()=>transition({...testing,...certified},"PUBLISH",{},user));
});
test("program and run actions cannot forge evaluated results or publish practice runs",()=>{
  const program=record("PROGRAM","DRAFT");
  assert.throws(()=>transition(program,"SAVE",{program:"F"},{...user,id:"outsider"}));
  const run=record("RUN","SUCCEEDED",{purpose:"PRACTICE",verified:true});
  assert.throws(()=>transition(run,"PUBLISH",{},user));
  const queue=record("RUN","QUEUED");assert.equal(transition(queue,"CANCEL",{},user).status,"CANCELLED");
  assert.throws(()=>transition({...queue,status:"CANCELLED"},"PUBLISH",{},user));
});
test("competition score changes and appeals respect judge assignment and time boundaries",()=>{
  const competition={...record("COMPETITION","OPEN",{format:"ONLINE",appealsUntil:"2026-12-01T00:00:00Z"}),ownerId:organizer.id,assignedToId:judge.id};
  const entry={...record("ENTRY","ELIGIBLE",{round:"ONLINE"}),parentId:competition.id};
  assert.throws(()=>transition(entry,"SCORE",{score:100,reason:"Forged"},user,competition));
  assert.throws(()=>transition(entry,"SCORE",{score:100,reason:"No verified run"},judge,competition));
  const scored=transition(entry,"SCORE",{verifiedScore:94,verifiedRunId:"run",reason:"Checked trace"},judge,competition);
  assert.equal(scored.data.score,94);assert.equal(scored.status,"PROVISIONAL");
  const provisional={...entry,...scored};
  assert.throws(()=>transition(provisional,"FINALIZE",{},judge,competition,Date.parse("2026-11-30T00:00:00Z")));
  const appealed=transition(provisional,"APPEAL",{reason:"Review checkpoint"},user,competition,Date.parse("2026-11-30T00:00:00Z"));
  assert.equal(appealed.status,"APPEALED");
  assert.throws(()=>transition({...entry,...appealed},"FINALIZE",{},judge,competition,Date.parse("2026-12-02T00:00:00Z")));
  assert.equal(transition(provisional,"FINALIZE",{},judge,competition,Date.parse("2026-12-02T00:00:00Z")).status,"FINAL");
});
test("hybrid qualification preserves online score and sends only eligible teams to on-site check-in",()=>{
  const competition={...record("COMPETITION","OPEN",{format:"HYBRID",onlineAppealsUntil:"2026-11-15T00:00:00Z",appealsUntil:"2026-12-01T00:00:00Z",qualifyScore:60}),ownerId:organizer.id,assignedToId:judge.id};
  const entry=record("ENTRY","PROVISIONAL",{round:"ONLINE",score:90});
  const qualified=transition(entry,"FINALIZE",{},judge,competition,Date.parse("2026-11-16T00:00:00Z"));
  assert.equal(qualified.status,"QUALIFIED");assert.equal(qualified.data.onlineScore,90);assert.equal(qualified.data.round,"ONSITE");
  const onSite={...entry,...qualified};
  assert.throws(()=>transition(onSite,"SCORE",{score:98,reason:"score"},judge,competition));
  const checked=transition(onSite,"CHECK_IN",{reason:"Team present"},organizer,competition);
  assert.equal(transition({...onSite,...checked},"SCORE",{score:98,evidenceUrl:"https://example.test/log",reason:"Observed round"},judge,competition).status,"PROVISIONAL");
  const failed=transition({...entry,data:{round:"ONLINE",score:40}},"FINALIZE",{},judge,competition,Date.parse("2026-11-16T00:00:00Z"));assert.equal(failed.status,"FINAL");
});
test("news drafts require references and only moderators can resolve content reports",()=>{
  const draft=record("DRAFT","DRAFT",{type:"NEWS",content:"Test",sources:[]});
  assert.throws(()=>transition(draft,"PUBLISH",{},user));
  assert.equal(transition({...draft,data:{type:"NEWS",content:"Test",sources:["https://example.test/source"]}},"PUBLISH",{},user).status,"PUBLISHED");
  const report=record("REPORT","OPEN",{postId:"test"});
  assert.throws(()=>transition(report,"HIDE",{reason:"Test moderation"},user));
  assert.equal(transition(report,"HIDE",{reason:"Test moderation"},{...user,role:"MODERATOR"}).status,"RESOLVED");
});
test("initial records reject fabricated protocol fields, unsafe URLs and invalid lessons",()=>{
  const input={robotId:"atlas",version:"v1",firmwareVersion:"v1",hardwareSpec:"test",contactEmail:"test@example.test",isDemoData:false,protocol:{code:"fake"}};
  const initial=initialData("EVALUATION",input,user);
  assert.equal(initial.data.isDemoData,true);assert.equal((initial.data.protocol as {code:string}).code,"PILOT-PICK-PLACE-v1");
  assert.throws(()=>initialData("DRAFT",{type:"NEWS",content:"test",sources:"javascript:alert(1)"},user));
  assert.throws(()=>initialData("PROGRESS",{lessonId:"made-up"},user));
  assert.throws(()=>initialData("COMPETITION",{},user));
});
test("company projection removes private content and never returns unapproved versions",()=>{
  const model={id:"test",version:"v1",hardwareSpec:"private hardware",firmwareVersion:"private firmware",taskEvaluated:"task",protocolCode:"protocol",physicalReportId:null,isPublished:true,workflowStatus:"PUBLISHED",safetyStatus:"PASSED",precisionMm:2,speedSec:4,contactName:"private name",contactEmail:"private@example.test",contactPhone:"private phone",allowContact:false,testConditions:"private conditions",evaluatorNotes:"private review",sampleReportSummary:"private report",sampleReportTitle:"private title",evidenceLinks:[{id:"a",url:"https://example.test/private",publicAllowed:false},{id:"b",url:"https://example.test/public",publicAllowed:true}],publishedFields:{showHardwareSpec:false,showFirmwareVersion:false,showTestConditions:false,showEvidenceLinks:true,showContactButton:false}} as unknown as CompanyModelRecord;
  const publicModel=publicCompanyModel(model)!;
  assert.equal(publicModel.contactEmail,"");assert.equal(publicModel.hardwareSpec,"");assert.equal(publicModel.evaluatorNotes,null);assert.equal(publicModel.evidenceLinks.length,1);
  assert.equal(publicCompanyModel({...model,workflowStatus:"PASSED"}),null);
  const snapshot=approvalSnapshot(model);assert.equal(approvalMatches(model,snapshot),true);assert.equal(approvalMatches({...model,firmwareVersion:"v2"},snapshot),false);
});
