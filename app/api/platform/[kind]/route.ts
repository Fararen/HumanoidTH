import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { createRecord, getRecord, listRecords, updateRecord, validKind } from "@/lib/platform-store";
import { WorkflowError } from "@/lib/platform-policy";
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ kind: string }> };
const createSchema = z.object({ requestId: z.string().uuid(), title: z.string().trim().min(1).max(200), parentId: z.string().max(200).optional(), data: z.record(z.unknown()) });
const actionSchema = z.object({ id: z.string().min(1).max(200), revision: z.number().int().min(0), action: z.string().min(1).max(60), data: z.record(z.unknown()).default({}) });
function failure(error: unknown) {
  if ((error as { code?: string })?.code === "P2002") return NextResponse.json({ success: false, error: "This request or team entry already exists. Open your existing record." }, { status: 409, headers });
  const message = error instanceof WorkflowError ? error.message : error instanceof z.ZodError ? "Check the required fields" : "Service unavailable. Your changes have not been confirmed; retry.";
  return NextResponse.json({ success: false, error: message }, { status: error instanceof WorkflowError ? error.status : error instanceof z.ZodError ? 400 : 503, headers });
}
export async function GET(request: Request, { params }: Context) {
  try {
    const kind = validKind((await params).kind.toUpperCase());
    const query = new URL(request.url).searchParams;
    const user = await getSessionUser();
    const id = query.get("id");
    if (id) {
      const record = await getRecord(id, user);
      if (record.kind !== kind) throw new WorkflowError("Record not found", 404);
      return NextResponse.json({ success: true, record }, { headers });
    }
    const scope = query.get("scope") || "public";
    if (!["public", "mine", "ops"].includes(scope)) throw new WorkflowError("Invalid scope");
    return NextResponse.json({ success: true, records: await listRecords(kind, user, scope, query.get("parentId") || undefined) }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user) throw new WorkflowError("Sign in to continue", 401);
    const kind = validKind((await params).kind.toUpperCase());
    const raw = await request.text();
    if (raw.length > 50000) throw new WorkflowError("Request too large", 413);
    let body; try { body = JSON.parse(raw); } catch { throw new WorkflowError("Invalid JSON"); }
    const record = await createRecord(kind, createSchema.parse(body), user);
    return NextResponse.json({ success: true, record }, { status: 201, headers });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user) throw new WorkflowError("Sign in to continue", 401);
    const kind = validKind((await params).kind.toUpperCase());
    let body; try { body = actionSchema.parse(await request.json()); } catch { throw new WorkflowError("Invalid action fields"); }
    const existing = await getRecord(body.id, user);
    if (existing.kind !== kind) throw new WorkflowError("Record not found", 404);
    const record = await updateRecord(body.id, body.revision, body.action, body.data, user);
    return NextResponse.json({ success: true, record }, { headers });
  } catch (error) { return failure(error); }
}
