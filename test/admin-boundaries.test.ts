import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";

// Exercise the actual exported server actions and routes with controlled sessions.
// Any database or ingestion access before authorization fails the test immediately.
async function load(entry: string) {
  const result = await build({
    stdin: { contents: `export * from "./${entry}"; export { state } from "security-test-state";`, resolveDir: process.cwd() },
    bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
    plugins: [{ name: "security-boundaries", setup(builder) {
      builder.onResolve({ filter: /^(security-test-state|@\/lib\/(session|prisma|ingest\/adapters)|next\/(cache|headers|navigation))$/ }, args => ({ path: args.path, namespace: "test" }));
      builder.onLoad({ filter: /.*/, namespace: "test" }, args => {
        const contents: Record<string, string> = {
          "security-test-state": "export const state = { user: null, writes: 0 };",
          "@/lib/session": 'import { state } from "security-test-state"; export async function getSessionUser() { return state.user; } export async function setSessionUser() { state.writes++; }',
          "@/lib/prisma": 'export const prisma = new Proxy({}, { get() { throw new Error("Unexpected database access"); } });',
          "@/lib/ingest/adapters": 'export async function runAdapter() { throw new Error("Unexpected ingestion access"); }',
          "next/cache": 'export function revalidatePath() {}',
          "next/headers": 'export async function cookies() { throw new Error("Unexpected cookie write"); }',
          "next/navigation": 'export function redirect(path) { throw new Error(`REDIRECT:${path}`); }'
        };
        return { contents: contents[args.path], loader: "js" };
      });
    } }]
  });
  const module = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  return module.exports;
}

test("CMS and map mutations reject anonymous and non-admin callers before side effects", async () => {
  for (const [file, names] of [
    ["app/actions.ts", ["runDataPull", "upsertSourceRecordAction", "upsertRobotModelAction", "upsertContributionAction", "upsertSubmittedDataAction"]],
    ["app/map/actions.ts", ["analyzeClustersWithGemini", "reanalyzeClustersWithGemini"]]
  ] as const) {
    const actions = await load(file);
    for (const user of [null, { id: "user", email: "user@example.test", role: "USER" }]) {
      actions.state.user = user;
      for (const name of names) await assert.rejects(actions[name](new FormData()), /Administrator access is required/, name);
    }
  }
});

test("private exports, ingestion and uploads reject forged or absent sessions", async () => {
  const exports = await load("app/api/export/route.ts");
  const ingestion = await load("app/api/ingest/[adapter]/route.ts");
  const upload = await load("app/api/upload/route.ts");
  const headers = { cookie: "user_role=ADMIN; admin_session=true; user_email=admin@example.test" };
  for (const table of ["submissions", "pull_jobs"]) {
    assert.equal((await exports.GET(new Request(`http://localhost/api/export?table=${table}`, { headers }))).status, 403);
  }
  assert.equal((await exports.GET(new Request("http://localhost/api/export?table=unknown"))).status, 400);
  assert.equal((await ingestion.POST(new Request("http://localhost/api/ingest/openalex", { method: "POST", headers }), { params: Promise.resolve({ adapter: "openalex" }) })).status, 403);
  assert.equal((await upload.POST(new Request("http://localhost/api/upload", { method: "POST", headers }))).status, 401);
  upload.state.user = { id: "signed-user", role: "USER" };
  const data = new FormData(); data.set("file", new File(["<html><script>alert(1)</script></html>"], "pretend.png", { type: "image/png" }));
  assert.equal((await upload.POST(new Request("http://localhost/api/upload", { method: "POST", body: data }))).status, 415);
});

test("admin login fails closed when explicit credentials are missing", async () => {
  const actions = await load("app/actions.ts");
  const prior = { user: process.env.ADMIN_BASIC_USER, password: process.env.ADMIN_BASIC_PASSWORD };
  try {
    delete process.env.ADMIN_BASIC_USER; delete process.env.ADMIN_BASIC_PASSWORD;
    const form = new FormData(); form.set("email", "admin@example.test"); form.set("password", "unconfigured-password");
    await assert.rejects(actions.adminLoginAction(form), /REDIRECT:\/admin-login\?error=invalid_credentials/);
    assert.equal(actions.state.writes, 0);
  } finally {
    if (prior.user === undefined) delete process.env.ADMIN_BASIC_USER; else process.env.ADMIN_BASIC_USER = prior.user;
    if (prior.password === undefined) delete process.env.ADMIN_BASIC_PASSWORD; else process.env.ADMIN_BASIC_PASSWORD = prior.password;
  }
});

test("admin APIs accept signed administrators or configured Basic credentials, including colon passwords", async () => {
  const access = await load("lib/admin-api-access.ts");
  const prior = { user: process.env.ADMIN_BASIC_USER, password: process.env.ADMIN_BASIC_PASSWORD };
  const basic = (password: string) => new Request("http://localhost/api/ingest/openalex", { headers: { authorization: `Basic ${Buffer.from(`admin@example.test:${password}`).toString("base64")}` } });
  try {
    delete process.env.ADMIN_BASIC_USER; delete process.env.ADMIN_BASIC_PASSWORD;
    assert.equal(await access.hasAdminApiAccess(basic("unconfigured")), false);
    process.env.ADMIN_BASIC_USER = "admin@example.test"; process.env.ADMIN_BASIC_PASSWORD = "test:password:with:colons";
    assert.equal(await access.hasAdminApiAccess(basic("test:password:with:colons")), true);
    assert.equal(await access.hasAdminApiAccess(basic("wrong")), false);
    access.state.user = { id: "signed-admin", role: "ADMIN" };
    assert.equal(await access.hasAdminApiAccess(new Request("http://localhost/api/export")), true);
  } finally {
    if (prior.user === undefined) delete process.env.ADMIN_BASIC_USER; else process.env.ADMIN_BASIC_USER = prior.user;
    if (prior.password === undefined) delete process.env.ADMIN_BASIC_PASSWORD; else process.env.ADMIN_BASIC_PASSWORD = prior.password;
  }
});
