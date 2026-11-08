import { z } from "zod";

const optionalPublicUrl = z.string().trim().max(2048).refine(value => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}, "Use an HTTP or HTTPS URL without embedded credentials.");

export const challengeEntrySchema = z.object({
  requestId: z.string().uuid(),
  teamName: z.string().trim().min(1).max(120),
  solutionTitle: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
  repoUrl: optionalPublicUrl.default(""),
  videoUrl: optionalPublicUrl.default("")
});

export type ChallengeEntryInput = z.infer<typeof challengeEntrySchema>;

export function challengeEntryWindow(challenge: { status: string; schedule: { submissionDeadline: string } }, now = new Date()) {
  const date = challenge.schedule.submissionDeadline;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const midnight = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== date) return false;
  const deadlineExclusive = midnight.getTime() + 17 * 60 * 60 * 1000;
  return challenge.status === "ACTIVE" && now.getTime() < deadlineExclusive;
}

export function entryMatchesRequest(entry: {
  submittedById: string | null; challengeId: string; teamName: string; solutionTitle: string;
  description: string | null; repoUrl: string | null; videoUrl: string | null;
}, userId: string, challengeId: string, input: ChallengeEntryInput) {
  return entry.submittedById === userId && entry.challengeId === challengeId &&
    entry.teamName === input.teamName && entry.solutionTitle === input.solutionTitle &&
    entry.description === input.description && (entry.repoUrl ?? "") === input.repoUrl &&
    (entry.videoUrl ?? "") === input.videoUrl;
}
