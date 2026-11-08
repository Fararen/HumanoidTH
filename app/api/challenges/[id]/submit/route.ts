import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { challengeEntrySchema, challengeEntryWindow, entryMatchesRequest } from "@/lib/challenge-entry-policy";
import { MOCK_CHALLENGES } from "@/app/challenges/mockData";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const receiptSelect = { id: true, solutionTitle: true, teamName: true, status: true, submittedAt: true } as const;
const privateHeaders = { "Cache-Control": "private, no-store" };

function failure(code: string, status: number) {
  return NextResponse.json({ success: false, code }, { status, headers: privateHeaders });
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    if (!MOCK_CHALLENGES.some(challenge => challenge.id === id)) return failure("NOT_FOUND", 404);
    const user = await getSessionUser();
    if (!user) return failure("SIGN_IN", 401);
    if (user.id.startsWith("demo:")) return failure("REAL_ACCOUNT_REQUIRED", 403);
    const entries = await prisma.challengeSubmission.findMany({
      where: { challengeId: id, submittedById: user.id },
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }], take: 50, select: receiptSelect
    });
    return NextResponse.json({ success: true, entries }, { headers: privateHeaders });
  } catch (error) {
    console.error("Could not load challenge entries:", error);
    return failure("UNAVAILABLE", 503);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const challenge = MOCK_CHALLENGES.find(item => item.id === id);
    if (!challenge) return failure("NOT_FOUND", 404);
    const user = await getSessionUser();
    if (!user) return failure("SIGN_IN", 401);
    if (user.id.startsWith("demo:")) return failure("REAL_ACCOUNT_REQUIRED", 403);
    let body: unknown;
    try { body = await request.json(); } catch { return failure("INVALID", 400); }
    const parsed = challengeEntrySchema.safeParse(body);
    if (!parsed.success) return failure("INVALID", 400);
    const input = parsed.data;
    const requestKey = `${user.id}:${input.requestId}`;
    // A lost response can be retried with the same key, even after the deadline.
    const existing = await prisma.challengeSubmission.findUnique({ where: { requestKey } });
    if (existing) {
      if (!entryMatchesRequest(existing, user.id, id, input)) return failure("REQUEST_CONFLICT", 409);
      const { id: entryId, solutionTitle, teamName, status, submittedAt } = existing;
      return NextResponse.json({ success: true, entry: { id: entryId, solutionTitle, teamName, status, submittedAt } }, { headers: privateHeaders });
    }
    if (!challengeEntryWindow(challenge)) return failure("CLOSED", 409);
    const entry = await prisma.challengeSubmission.upsert({
      where: { requestKey },
      update: {},
      create: {
        challengeId: id, submittedById: user.id, requestKey,
        contactEmail: user.email,
        teamName: input.teamName, solutionTitle: input.solutionTitle, description: input.description,
        repoUrl: input.repoUrl || null, videoUrl: input.videoUrl || null,
        status: "SUBMITTED"
      }
    });
    if (!entryMatchesRequest(entry, user.id, id, input)) return failure("REQUEST_CONFLICT", 409);
    const { id: entryId, solutionTitle, teamName, status, submittedAt } = entry;
    return NextResponse.json({ success: true, entry: { id: entryId, solutionTitle, teamName, status, submittedAt } }, { status: 201, headers: privateHeaders });
  } catch (error) {
    console.error("Could not save challenge entry:", error);
    return failure("UNAVAILABLE", 503);
  }
}
