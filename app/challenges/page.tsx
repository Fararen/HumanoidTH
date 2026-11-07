import type { Metadata } from "next";
import ChallengesClient from "./ChallengesClient";
import { MOCK_CHALLENGES } from "./mockData";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Robotics Challenges & Competitions | HumanoidTH",
  description: "Join robotics competitions, hackathons, and benchmarks. Compete in humanoid locomotion, vision-based grasping, and hardware design challenges.",
  alternates: { canonical: "/challenges" }
};

export default function ChallengesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ChallengesClient initialChallenges={MOCK_CHALLENGES} />
    </div>
  );
}
