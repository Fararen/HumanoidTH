import React from "react";
import { createRoot } from "react-dom/client";
import HriLabClient, { type HriAtlasRobot, type HriSavedRun } from "../../app/robots/[id]/hri-lab/HriLabClient";

// Test-only Atlas record. This fixture is never bundled into the application.
const robot: HriAtlasRobot = {
  id: "fixture-robot", canonicalName: "HRI Browser Test Robot", manufacturer: "Test fixture",
  developerOrg: null, robotType: "social", thailandStatus: "research", primaryUseCase: "Test",
  officialUrl: null, description: "Explicit browser-test fixture", publicLocations: [], contributions: [],
  sources: [{ id: "fixture-source", title: "Test source", url: "https://example.test/source", platform: "Test" }]
};
const query = new URLSearchParams(window.location.search);
const initialRuns: HriSavedRun[] = JSON.parse(sessionStorage.getItem("hri-test-history") || "[]");
createRoot(document.getElementById("root")!).render(<React.StrictMode>
  <p>Browser test fixture — not live Atlas data</p>
  <HriLabClient requestedRobotId={query.has("missing") ? "missing" : robot.id}
    initialRobot={query.has("missing") ? null : robot} allRobots={[robot]} initialRuns={initialRuns}
    initialLoadError={query.has("missing") ? "ไม่พบรหัสรุ่นในทะเบียน (test fixture)" : null}
    initialHistoryError={query.has("historyError") ? "โหลดประวัติ Run Log ไม่สำเร็จ ยังทดลองและส่งออกผลรอบใหม่ได้" : null}
    lang="th" />
</React.StrictMode>);
