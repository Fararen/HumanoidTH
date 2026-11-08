import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import ChallengeDetailClient from "./ChallengeDetailClient";
import { MOCK_CHALLENGES, INITIAL_SUBMISSIONS } from "../mockData";
import { challengeEntryWindow } from "@/lib/challenge-entry-policy";

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
  const lang = (await cookies()).get("lang")?.value === "th" ? "th" : "en";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ChallengeDetailClient key={challenge.id} challenge={challenge} initialSubmissions={submissions} canSubmit={challengeEntryWindow(challenge)} lang={lang} />
    </div>
  );
}
