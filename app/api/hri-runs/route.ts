import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateHriRun } from "@/lib/hri-simulation";
import { isDeepStrictEqual } from "node:util";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const robotId = searchParams.get("robotId");

    const runs = await prisma.hriSimulationRun.findMany({
      where: robotId ? { robotId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json({ success: true, runs });
  } catch (error) {
    console.error("GET /api/hri-runs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch HRI runs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 256_000) return NextResponse.json({ success: false, error: "Run Log too large" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const validated = validateHriRun(body);
  if (!validated.ok) return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
  const { events, ...fields } = validated.data;
  try {
    const robot = await prisma.robotModel.findUnique({ where: { id: fields.robotId }, select: { canonicalName: true } });
    // A real missing-model trace may be recorded, but never a successful run for a nonexistent model.
    if (!robot && (fields.testCaseType !== "LOAD_ERROR" || !events.some(event => event.action === "MODEL_LOAD_FAILED"))) {
      return NextResponse.json({ success: false, error: "Robot model not found" }, { status: 404 });
    }
    const data = { ...fields, robotName: robot?.canonicalName ?? `Unknown Model (${fields.robotId})`, eventsJson: events };
    // The run ID is an idempotency key. Retries must never overwrite a completed run.
    const saved = await prisma.hriSimulationRun.upsert({ where: { runCode: fields.runCode }, create: data, update: {} });
    const sameEvents = isDeepStrictEqual(saved.eventsJson, events);
    const sameRun = saved.robotId === data.robotId && saved.sceneVersion === data.sceneVersion &&
      saved.simulationMode === data.simulationMode && saved.errorReason === data.errorReason && sameEvents;
    if (!sameRun) return NextResponse.json({ success: false, error: "Run ID already belongs to a different log" }, { status: 409 });
    return NextResponse.json({ success: true, run: saved });
  } catch (error) {
    console.error("POST /api/hri-runs error:", error);
    return NextResponse.json({ success: false, error: "Failed to save HRI run" }, { status: 500 });
  }
}
