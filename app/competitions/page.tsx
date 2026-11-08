import type { Metadata } from "next";
import ChallengesPage from "@/app/challenges/page";

export const metadata: Metadata = {
  title: "Robotics Challenges & Competitions | HumanoidTH",
  description: "Explore robotics challenges, hackathons, and benchmarks across Thailand.",
  alternates: { canonical: "/competitions" },
};

export default function CompetitionsPage() {
  return <ChallengesPage />;
}
