import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
const label=`[browser ${randomUUID().slice(0,8)}]`;
async function login(page:Page,role:string) {
  await page.goto("/demo");
  await page.locator("form").filter({has:page.getByRole("heading",{name:role,exact:true})}).getByRole("button").click();
  await expect(page.getByRole("heading",{name:"พื้นที่ของฉัน · My workspace",exact:true})).toBeVisible();
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem("th_atlas_loaded_before","true"));
});
test("legacy endpoints protect private exports, ingestion and image uploads", async ({ page, request }) => {
  const headers = { cookie: "user_role=ADMIN; admin_session=true; user_email=admin@demo.humanoidth.local" };
  for (const table of ["sources", "owned_inventory", "submissions", "pull_jobs"]) {
    expect((await request.get(`/api/export?table=${table}`, { headers })).status()).toBe(403);
  }
  expect((await request.post("/api/ingest/openalex", { headers, data: { query: "robotics" } })).status()).toBe(403);
  expect((await request.post("/api/upload", { headers })).status()).toBe(401);
  await page.goto("/database?table=submissions");
  await expect(page).toHaveURL(/\/sign-in\?/);
  await page.goto("/inventory?mode=operator");
  await expect(page.getByRole("link", { name: "Operator Mode (Private)", exact: true })).toHaveCount(0);
  await login(page, "USER");
  expect((await page.request.get("/api/export?table=submissions")).status()).toBe(403);
  expect((await page.request.post("/api/upload", { multipart: { file: { name: "pretend.png", mimeType: "image/png", buffer: Buffer.from("<html><script>alert(1)</script></html>") } } })).status()).toBe(415);
  await login(page, "ADMIN");
  await page.goto("/database?table=submissions");
  await expect(page).toHaveURL(/\/database\?table=submissions/);
  expect((await page.request.get("/api/export?table=submissions")).status()).toBe(200);
  // An empty query proves authorization succeeds without making an external ingestion request.
  expect((await page.request.post("/api/ingest/openalex", { data: { query: "" } })).status()).toBe(400);
});
test("full site supports saved simulation, lesson progress, account drafts, references and moderation",async({page,request})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await login(page,"USER");
  await page.goto("/simulator/grid-navigation/workspace");
  await page.getByLabel("ชื่อรายการ · Title",{exact:true}).fill(`${label} program`);
  await page.getByRole("button",{name:"บันทึก · Save",exact:true}).click();
  await expect(page).toHaveURL(/programId=/);
  await page.getByLabel("Purpose",{exact:true}).selectOption("EVALUATION");
  await page.getByRole("button",{name:"ส่งเข้าคิว · Queue run",exact:true}).click();
  await expect(page).toHaveURL(/\/me\/runs\//);
  await expect(page.locator("header small")).toContainText("SUCCEEDED",{timeout:30000});
  await page.getByRole("button",{name:"ยินยอมเผยแพร่ผลจำลอง · Publish simulation result",exact:true}).click();
  await page.getByRole("link",{name:"ผลสาธารณะ · Public result",exact:true}).click();
  await expect(page).toHaveURL(/\/results\//);
  const runId=page.url().split("/").at(-1)!;
  const publicRun=await (await request.get(`/api/platform/RUN?id=${runId}`)).json();
  expect(publicRun.record.ownerId).toBe("");expect(publicRun.record.data.score).toBe(100);
  const forgedPreview=await (await request.get(`/api/platform/RUN?id=${runId}`,{headers:{cookie:"user_email=admin@demo.humanoidth.local; user_role=ADMIN; demo_account=ADMIN"}})).json();
  expect(forgedPreview.record.ownerId).toBe("");expect(forgedPreview.record.requestHash).toBeUndefined();
  await page.goto("/learn/navigation");await page.getByRole("button",{name:"บันทึกว่าเรียนแล้ว · Mark completed",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.goto("/learn");await expect(page.getByRole("link").filter({hasText:"2 · เขียนคำสั่งนำทางในกริด"})).toContainText("Completed");
  await page.goto("/community/drafts/new");
  await page.getByLabel("ชื่อรายการ · Title",{exact:true}).fill(`${label} robotics news`);
  await page.getByLabel("เนื้อหา · Content",{exact:true}).fill("Browser-tested source-backed robotics news draft.");
  await page.getByLabel("ประเภท · Type",{exact:true}).selectOption("NEWS");
  await page.getByRole("button",{name:"บันทึก · Save",exact:true}).click();
  await expect(page).toHaveURL(/\/community\/drafts\//);
  await page.getByRole("button",{name:"เผยแพร่โพสต์ · Publish post",exact:true}).click();
  await expect(page.getByRole("alert").filter({hasText:"source references"})).toBeVisible();
  await page.getByLabel("แหล่งอ้างอิง · Source URLs (one per line)",{exact:true}).fill("https://example.test/robotics-source");
  await page.getByRole("button",{name:"บันทึกร่างในบัญชี · Save account draft",exact:true}).click();
  await expect(page.locator("header small")).toContainText("Revision 1");
  await expect(page.getByLabel("แหล่งอ้างอิง · Source URLs (one per line)",{exact:true})).toHaveValue("https://example.test/robotics-source");
  await page.getByRole("button",{name:"เผยแพร่โพสต์ · Publish post",exact:true}).click();
  await page.getByRole("link",{name:"เปิดโพสต์ที่เผยแพร่ · View published post",exact:true}).click();
  const postId=page.url().split("/").at(-1)!;
  await expect(page.getByRole("link",{name:"แหล่งอ้างอิง · Source 1",exact:true})).toHaveAttribute("href","https://example.test/robotics-source");
  await page.getByRole("link",{name:"รายงานเนื้อหา · Report post",exact:true}).click();
  await page.getByLabel("ชื่อรายการ · Title",{exact:true}).fill(`${label} report`);
  await page.getByLabel("เหตุผล · Reason",{exact:true}).fill("Please verify source context");
  await page.getByRole("button",{name:"บันทึก · Save",exact:true}).click();
  await expect(page).toHaveURL(/\/me\/work\//);const reportId=page.url().split("/").at(-1)!;
  await login(page,"MODERATOR");await page.goto(`/me/work/${reportId}`);
  const hide=page.locator("form").filter({has:page.getByRole("heading",{name:"ซ่อนเนื้อหา · Hide post",exact:true})});
  await hide.getByLabel("เหตุผลและข้อสังเกต · Notes / reason",{exact:true}).fill("Source context reviewed, hide during correction");
  await hide.getByRole("button",{name:"ซ่อนเนื้อหา · Hide post",exact:true}).click();
  await expect(page.locator("header small")).toContainText("RESOLVED");
  expect((await request.get(`/api/community/posts/${postId}`)).status()).toBe(404);
  expect(errors).toEqual([]);
});

test("company API enforces private fields, reviewer assignment, publishing and immutable versions",async({page,request})=>{
  await login(page,"COMPANY");const api=page.context().request;
  const response=await api.post("/api/company-models",{data:{companyName:"ignored-client-name",contactName:"Private demo contact",contactEmail:"private-contact@example.test",modelName:`${label} company robot`,version:"v1",hardwareSpec:"Confidential hardware",firmwareVersion:"fw1",taskEvaluated:"Pilot task",workflowStatus:"DRAFT"}});
  expect(response.status()).toBe(200);const model=(await response.json()).model;const endpoint=`/api/company-models/${model.id}`;
  expect((await api.patch(endpoint,{data:{action:"SAVE_DOCUMENTS",documents:"javascript:alert(1)"}})).status()).toBe(400);
  expect((await api.patch(endpoint,{data:{action:"SAVE_DOCUMENTS",documents:"https://example.test/private-specification"}})).status()).toBe(200);
  expect((await request.get(endpoint)).status()).toBe(404);
  const forged=await request.patch(endpoint,{headers:{cookie:"user_email=admin@demo.humanoidth.local; user_role=ADMIN"},data:{action:"EVALUATOR_DECISION"}});expect(forged.status()).toBe(401);
  expect((await api.patch(endpoint,{data:{action:"SUBMIT_FOR_REVIEW"}})).status()).toBe(200);
  await login(page,"REVIEWER");expect((await api.get(endpoint)).status()).toBe(404);
  await login(page,"ADMIN");expect((await api.patch(endpoint,{data:{action:"ASSIGN_REVIEWER",reviewerId:"local-reviewer"}})).status()).toBe(200);
  await login(page,"REVIEWER");
  expect((await api.patch(endpoint,{data:{action:"EVALUATOR_DECISION",decision:"PASSED",safetyStatus:"PASSED",precisionMm:2.6,speedSec:4.8,evaluatorNotes:"Verified the labeled demo report and exact version"}})).status()).toBe(200);
  await login(page,"COMPANY");
  expect((await api.patch(endpoint,{data:{action:"SAVE_DRAFT",hardwareSpec:"Changed after approval"}})).status()).toBe(409);
  const consent={action:"CONFIRM_PUBLISH",allowContact:false,publishedFields:{showHardwareSpec:false,showFirmwareVersion:false,showTestConditions:false,showEvidenceLinks:false,showContactButton:false}};
  expect((await api.patch(endpoint,{data:consent})).status()).toBe(200);expect((await api.patch(endpoint,{data:consent})).status()).toBe(200);
  const visible=(await (await request.get(endpoint)).json()).model;
  expect(visible.contactEmail).toBe("");expect(visible.hardwareSpec).toBe("");expect(visible.evaluatorNotes).toBeNull();
  expect(visible.evidenceLinks).toHaveLength(0);
  const list=(await (await request.get("/api/company-models")).json()).models;
  expect(list.filter((item:{id:string})=>item.id===model.id)).toHaveLength(1);
  const next=(await (await api.patch(endpoint,{data:{action:"NEW_VERSION",version:"v2"}})).json()).model;
  expect(next.id).not.toBe(model.id);expect(next.workflowStatus).toBe("DRAFT");expect((await request.get(`/api/company-models/${next.id}`)).status()).toBe(404);
});

test("full-site navigation and new workspaces fit a mobile viewport",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await login(page,"USER");
  for(const path of ["/","/learn","/simulator/grid-navigation","/evaluate","/leaderboards","/competitions","/me"]) {
    await page.goto(path);await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
  await mkdir("docs/evidence/platform",{recursive:true});
  await page.screenshot({path:"docs/evidence/platform/my-workspace-mobile.png",fullPage:true});
});

test("live Atlas models support all four HRI outcomes and database-backed replay",async({page,request})=>{
  await page.goto("/robots");
  await page.getByRole("link",{name:"ทดลอง HRI",exact:true}).first().click();
  await expect(page).toHaveURL(/\/robots\/[^/]+\/hri-lab/);
  const robotId=page.url().split("/").at(-2)!;
  const saved=()=>expect(page.getByRole("status",{name:"สถานะการบันทึก",exact:true})).toHaveText("บันทึก Run Log ในฐานข้อมูลแล้ว",{timeout:20000});
  const reset=()=>page.getByRole("button",{name:"เริ่มรอบการทดลองใหม่",exact:true}).click();
  await page.getByRole("button",{name:/ให้หุ่นช่วยนำทางไปห้องกิจกรรม/}).click();await saved();
  await reset();await page.getByRole("button",{name:/ขอเจ้าหน้าที่มารับช่วงต่อ/}).click();await saved();
  await reset();await page.getByRole("button",{name:/ให้หุ่นช่วยนำทางไปห้องกิจกรรม/}).click();await page.getByRole("button",{name:/ยกเลิกคำขอและให้หุ่นหยุดทำงาน/}).click();await saved();
  await reset();await page.getByRole("button",{name:/จำลองกรณีโหลดไม่สำเร็จ/}).click();await saved();
  await page.getByRole("tab",{name:/ตารางทวนสอบ/}).click();
  await expect(page.getByRole("cell",{name:"ยังไม่ได้ทดสอบ (Not run)",exact:true})).toHaveCount(0);
  const result=await (await request.get(`/api/hri-runs?robotId=${robotId}`)).json();
  expect(new Set(result.runs.map((run:{testCaseType:string})=>run.testCaseType)).size).toBe(4);
  await mkdir("docs/evidence/platform",{recursive:true});
  await page.screenshot({path:"docs/evidence/platform/hri-live-atlas.png",fullPage:true});
  await page.reload();await page.getByRole("button",{name:/ARRIVED_AT_DESTINATION/}).first().click();
  await expect(page.getByRole("status",{name:"สถานะการจำลอง",exact:true})).toContainText("ARRIVED_AT_DESTINATION");
});

test("lab UI certifies five pilot rounds and a company can link and publish the exact report version",async({page,request})=>{
  await login(page,"COMPANY");const api=page.context().request;
  const model=(await (await api.post("/api/company-models",{data:{companyName:"ignored",contactName:"Demo contact",contactEmail:"company@example.test",modelName:`${label} report-linked robot`,version:"v1",hardwareSpec:"Exact test hardware",firmwareVersion:"fw1",workflowStatus:"DRAFT"}})).json()).model;
  await page.goto("/robots");const href=await page.getByRole("link",{name:"ทดลอง HRI",exact:true}).first().getAttribute("href");const robotId=href!.split("/")[2];
  const created=await api.post("/api/platform/EVALUATION",{data:{requestId:randomUUID(),title:`${label} lab request`,data:{robotId,companyModelId:model.id,version:"v1",firmwareVersion:"fw1",hardwareSpec:"Exact test hardware",contactEmail:"company@example.test"}}});
  expect(created.status()).toBe(201);let record=(await created.json()).record;
  async function act(action:string,data:Record<string,unknown>={}) {
    const response=await api.get(`/api/platform/EVALUATION?id=${record.id}`);record=(await response.json()).record;
    const changed=await api.patch("/api/platform/EVALUATION",{data:{id:record.id,revision:record.revision,action,data}});expect(changed.status()).toBe(200);record=(await changed.json()).record;
  }
  await act("SUBMIT");await login(page,"ADMIN");await act("ASSIGN",{assignedToId:"local-lab"});
  await login(page,"LAB");await page.goto(`/me/evaluations/${record.id}`);
  const plan=page.locator("form").filter({has:page.getByRole("heading",{name:"เสนอแผนและนัดหมาย · Propose plan",exact:true})});
  await plan.getByLabel("ค่าใช้จ่ายที่ตกลง (THB)",{exact:true}).fill("100");
  await plan.getByLabel("วันนัด (ISO datetime with timezone)",{exact:true}).fill(new Date(Date.now()+86400_000).toISOString());
  await plan.getByLabel("เหตุผลและข้อสังเกต · Notes / reason",{exact:true}).fill("Pilot lab appointment");
  await plan.getByRole("button").click();await expect(page.locator("header small")).toContainText("PLANNED");
  await login(page,"COMPANY");await act("CONFIRM");
  await login(page,"LAB");await act("RECEIVE",{reason:"Robot intake complete"});await act("START_TEST");
  await page.goto(`/me/evaluations/${record.id}`);
  const rounds=page.locator("form").filter({has:page.getByRole("heading",{name:"บันทึกผล 5 รอบ · Record rounds",exact:true})});
  for(let index=0;index<5;index++) {
    await rounds.getByRole("spinbutton",{name:"Precision (mm)",exact:true}).nth(index).fill("2.3");
    await rounds.getByRole("spinbutton",{name:"Speed (seconds)",exact:true}).nth(index).fill("4.4");
    await rounds.getByLabel("Evidence URL",{exact:true}).nth(index).fill(`https://example.test/round-${index+1}`);
    await rounds.getByRole("checkbox").nth(index).check();
  }
  await rounds.getByRole("button").click();await expect(page.locator("header small")).toContainText("REVIEW");
  const certify=page.locator("form").filter({has:page.getByRole("heading",{name:"รับรองรายงานเดโม · Certify pilot report",exact:true})});
  await certify.getByLabel("เหตุผลและข้อสังเกต · Notes / reason",{exact:true}).fill("Verified all five pilot evidence records");
  await certify.getByRole("button").click();await expect(page.locator("header small")).toContainText("CERTIFIED");
  await login(page,"COMPANY");const endpoint=`/api/company-models/${model.id}`;
  expect((await api.patch(endpoint,{data:{action:"LINK_REPORT",physicalReportId:record.id}})).status()).toBe(200);
  expect((await api.patch(endpoint,{data:{action:"SUBMIT_FOR_REVIEW"}})).status()).toBe(200);
  await login(page,"ADMIN");expect((await api.patch(endpoint,{data:{action:"ASSIGN_REVIEWER",reviewerId:"local-reviewer"}})).status()).toBe(200);
  await login(page,"REVIEWER");const approved=await api.patch(endpoint,{data:{action:"EVALUATOR_DECISION",decision:"PASSED",safetyStatus:"PASSED",precisionMm:99,speedSec:999,evaluatorNotes:"Approve the measurements from the certified linked report"}});
  expect(approved.status()).toBe(200);const measured=(await approved.json()).model;expect(measured.precisionMm).toBeCloseTo(2.3);expect(measured.speedSec).toBeCloseTo(4.4);
  await login(page,"COMPANY");expect((await api.patch(endpoint,{data:{action:"CONFIRM_PUBLISH",allowContact:false,publishedFields:{showHardwareSpec:false,showFirmwareVersion:false,showTestConditions:true,showEvidenceLinks:false,showContactButton:false}}})).status()).toBe(200);
  const publicModel=(await (await request.get(endpoint)).json()).model;expect(publicModel.groupId).toBe("physical-pick-place-pilot-v1");expect(publicModel.precisionMm).toBeCloseTo(2.3);
});

test("registration requires a password and signed login returns to the selected lesson",async({page,context})=>{
  const email=`browser-${randomUUID()}@example.test`,password="A-valid-local-password-123";
  await page.goto("/register");
  await page.getByLabel("Email address",{exact:true}).fill(email);
  await page.getByLabel("Password (at least 10 characters)",{exact:true}).fill(password);
  await page.getByLabel("Your name (optional)",{exact:true}).fill("Browser registration test");
  await page.getByRole("button",{name:"Create individual account",exact:true}).click();
  await expect(page).toHaveURL(/\/me$/);
  await context.clearCookies();
  await page.goto("/sign-in?from=/learn/navigation");
  await page.getByLabel("Email",{exact:true}).fill(email);await page.getByLabel("Password",{exact:true}).fill(password);
  await page.getByRole("button",{name:"เข้าสู่ระบบ · Sign in",exact:true}).click();
  await expect(page).toHaveURL(/\/learn\/navigation$/);
  await expect(page.getByRole("heading",{name:"2 · เขียนคำสั่งนำทางในกริด",exact:true})).toBeVisible();
});
