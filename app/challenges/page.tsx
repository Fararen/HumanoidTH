import type { Metadata } from "next";
import { cookies } from "next/headers";
import ChallengesClient from "./ChallengesClient";
import { MOCK_CHALLENGES } from "./mockData";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Robotics Challenges & Competitions | HumanoidTH",
  description: "Join robotics competitions, hackathons, and benchmarks. Compete in humanoid locomotion, vision-based grasping, and hardware design challenges.",
  alternates: { canonical: "/challenges" }
};

export default async function ChallengesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "th";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ChallengesClient initialChallenges={MOCK_CHALLENGES} lang={lang} />
    </div>
  );
}
