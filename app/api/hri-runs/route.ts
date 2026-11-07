import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  try {
    const body = await request.json();
    const {
      runCode,
      robotId,
      robotName,
      sceneVersion = "wellness-reception-v1.0",
      simulationMode = "interactive-hri-living-lab",
      testCaseType,
      terminalStatus,
      testCasePassed = true,
      navigationSucceeded = false,
      durationSec = 0,
      errorReason = null,
      events = []
    } = body;

    if (!runCode || !robotId || !robotName || !testCaseType || !terminalStatus) {
      return NextResponse.json(
        { success: false, error: "Missing required HRI run fields" },
        { status: 400 }
      );
    }

    const saved = await prisma.hriSimulationRun.create({
      data: {
        runCode,
        robotId,
        robotName,
        sceneVersion,
        simulationMode,
        testCaseType,
        terminalStatus,
        testCasePassed: Boolean(testCasePassed),
        navigationSucceeded: Boolean(navigationSucceeded),
        durationSec: Number(durationSec),
        errorReason,
        eventsJson: events
      }
    });

    return NextResponse.json({ success: true, run: saved });
  } catch (error) {
    console.error("POST /api/hri-runs error:", error);
    return NextResponse.json({ success: false, error: "Failed to save HRI run" }, { status: 500 });
  }
}
