import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ChallengeDetailClient from "./ChallengeDetailClient";
import { MOCK_CHALLENGES, INITIAL_SUBMISSIONS } from "../mockData";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const challenge = MOCK_CHALLENGES.find((c) => c.id === id);
  if (!challenge) return { title: "Challenge Not Found | HumanoidTH" };

  return {
    title: `${challenge.title} | HumanoidTH`,
    description: challenge.shortDescription
  };
}

export default async function ChallengeDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = MOCK_CHALLENGES.find((c) => c.id === id);

  if (!challenge) {
    notFound();
  }

  const submissions = INITIAL_SUBMISSIONS[challenge.id] || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ChallengeDetailClient challenge={challenge} initialSubmissions={submissions} />
    </div>
  );
}
