import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import HriLabClient, { type HriAtlasRobot, type HriSavedRun } from "./HriLabClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "M01 · HRI Living Lab (ศูนย์สุขภาวะจำลอง) | HumanoidTH",
  description: "ทดลองปฏิสัมพันธ์ระหว่างคนกับหุ่นยนต์ (HRI) ณ จุดต้อนรับศูนย์สุขภาวะ จากข้อมูลทะเบียนหุ่นยนต์ HumanoidTH พร้อมบันทึกและส่งออก Run Log"
};

export default async function HriLivingLabPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, cookieStore] = await Promise.all([params, cookies()]);
  const lang = cookieStore.get("lang")?.value === "en" ? "en" : "th";

  let robot: HriAtlasRobot | null = null;
  let allRobots: Array<{ id: string; canonicalName: string; robotType: string }> = [];
  let savedRuns: HriSavedRun[] = [];
  let dbLoadError: string | null = null;
  let historyError: string | null = null;

  try {
    const [modelResult, modelsResult, runsResult] = await Promise.allSettled([
      prisma.robotModel.findUnique({
        where: { id },
        include: {
          inventory: {
            where: { visibility: "public" },
            select: { id: true, locationLabel: true, displayName: true }
          },
          contributions: {
            where: { visibility: "public" },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, title: true, contributionType: true, sourceUrl: true }
          }
        }
      }),
      prisma.robotModel.findMany({
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: { id: true, canonicalName: true, robotType: true }
      }),
      prisma.hriSimulationRun.findMany({
        where: { robotId: id },
        orderBy: { createdAt: "desc" },
        take: 20
      })
    ]);

    if (modelResult.status === "rejected") throw modelResult.reason;
    const found = modelResult.value;
    allRobots = modelsResult.status === "fulfilled" ? modelsResult.value : [];
    const dbRuns = runsResult.status === "fulfilled" ? runsResult.value : [];
    if (runsResult.status === "rejected") historyError = "โหลดประวัติ Run Log ไม่สำเร็จ ยังทดลองและส่งออกผลรอบใหม่ได้";

    if (found) {
      const sources = await prisma.sourceRecord.findMany({
        where: {
          OR: [
            { title: { contains: found.canonicalName, mode: "insensitive" } },
            { excerpt: { contains: found.canonicalName, mode: "insensitive" } }
          ]
        },
        orderBy: [{ relevanceConfidence: "desc" }, { updatedAt: "desc" }],
        take: 5,
        select: { id: true, title: true, url: true, platform: true }
      }).catch(() => {
        historyError = [historyError, "โหลดแหล่งอ้างอิงเพิ่มเติมไม่สำเร็จ กรุณาลองโหลดหน้าอีกครั้ง"].filter(Boolean).join(" · ");
        return [];
      });

      const publicLocations = [
        ...new Set(
          found.inventory
            .map((item) => item.locationLabel?.trim())
            .filter((val): val is string => Boolean(val))
        )
      ];

      robot = {
        id: found.id,
        canonicalName: found.canonicalName,
        manufacturer: found.manufacturer,
        developerOrg: found.developerOrg,
        robotType: found.robotType,
        thailandStatus: found.thailandStatus,
        primaryUseCase: found.primaryUseCase,
        officialUrl: found.officialUrl,
        description: found.description,
        publicLocations,
        sources: sources.map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          platform: s.platform || "Atlas Source"
        })),
        contributions: found.contributions.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.contributionType,
          url: c.sourceUrl
        }))
      };
    } else {
      dbLoadError = `ไม่พบรหัสรุ่น "${id}" ในฐานข้อมูลทะเบียน HumanoidTH Atlas (Model ID not found in registry)`;
    }

    savedRuns = dbRuns.map((r) => ({
      id: r.id,
      runCode: r.runCode,
      robotId: r.robotId,
      robotName: r.robotName,
      sceneVersion: r.sceneVersion,
      simulationMode: r.simulationMode,
      testCaseType: r.testCaseType as HriSavedRun["testCaseType"],
      terminalStatus: r.terminalStatus,
      testCasePassed: r.testCasePassed,
      navigationSucceeded: r.navigationSucceeded,
      durationSec: r.durationSec,
      errorReason: r.errorReason,
      events: Array.isArray(r.eventsJson) ? (r.eventsJson as HriSavedRun["events"]) : [],
      createdAt: r.createdAt.toISOString()
    }));
  } catch (err) {
    console.error("HriLivingLabPage query error:", err);
    dbLoadError = "ไม่สามารถเชื่อมต่อฐานข้อมูลทะเบียนหุ่นยนต์ได้ชั่วคราว (Database connection failed)";
  }

  return (
    <HriLabClient
      key={id}
      requestedRobotId={id}
      initialRobot={robot}
      allRobots={allRobots}
      initialRuns={savedRuns}
      initialLoadError={dbLoadError}
      initialHistoryError={historyError}
      lang={lang}
    />
  );
}
