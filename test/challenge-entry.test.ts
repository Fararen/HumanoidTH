import assert from "node:assert/strict";
import { test } from "node:test";
import { challengeEntrySchema, challengeEntryWindow, entryMatchesRequest } from "../lib/challenge-entry-policy";

const valid = {
  requestId: "f1aba76f-5737-46cd-9d28-242584b16683", teamName: "ทีมวิจัย", solutionTitle: "Hospital navigation",
  description: "Reproducible ROS navigation results", repoUrl: "https://github.com/team/project", videoUrl: "https://youtu.be/entry"
};

test("entry validation trims content and discards client identity, status and scoring fields", () => {
  const input = challengeEntrySchema.parse({ ...valid, teamName: " ทีมวิจัย ", contactEmail: "forged@example.com", status: "APPROVED", benchmarkScore: 100 });
  assert.equal(input.teamName, "ทีมวิจัย");
  assert.equal("contactEmail" in input, false);
  assert.equal("status" in input, false);
  assert.equal("benchmarkScore" in input, false);
});

test("entry validation rejects invalid types, whitespace, oversized content and unsafe links", () => {
  for (const change of [
    { teamName: " " }, { solutionTitle: 42 }, { description: "" }, { description: "a".repeat(10001) },
    { teamName: "a".repeat(121) }, { requestId: "not-a-uuid" }, { repoUrl: "javascript:alert(1)" },
    { videoUrl: "ftp://example.com/file" }, { repoUrl: "https://user:password@example.com/repo" }, { videoUrl: [] }
  ]) assert.equal(challengeEntrySchema.safeParse({ ...valid, ...change }).success, false);
  assert.equal(challengeEntrySchema.safeParse({ ...valid, repoUrl: "", videoUrl: "" }).success, true);
});

test("only active competitions accept entries through the end of their Bangkok deadline day", () => {
  const challenge = { status: "ACTIVE", schedule: { submissionDeadline: "2026-11-08" } };
  assert.equal(challengeEntryWindow(challenge, new Date("2026-11-08T16:59:59.999Z")), true);
  assert.equal(challengeEntryWindow(challenge, new Date("2026-11-08T17:00:00Z")), false);
  for (const status of ["UPCOMING", "COMPLETED"]) assert.equal(challengeEntryWindow({ ...challenge, status }, new Date("2026-11-07")), false);
  for (const submissionDeadline of ["invalid", "2026-02-30", "2026-2-3", ""]) {
    assert.equal(challengeEntryWindow({ status: "ACTIVE", schedule: { submissionDeadline } }, new Date("2026-01-01")), false);
  }
});

test("receipt retries must match owner, competition and every submitted field", () => {
  const entry = { ...valid, submittedById: "user-one", challengeId: "challenge-one" };
  assert.equal(entryMatchesRequest(entry, "user-one", "challenge-one", valid), true);
  assert.equal(entryMatchesRequest(entry, "user-two", "challenge-one", valid), false);
  assert.equal(entryMatchesRequest(entry, "user-one", "challenge-two", valid), false);
  for (const field of ["teamName", "solutionTitle", "description", "repoUrl", "videoUrl"] as const) {
    assert.equal(entryMatchesRequest(entry, "user-one", "challenge-one", { ...valid, [field]: "changed" }), false);
  }
  assert.equal(entryMatchesRequest({ ...entry, submittedById: null }, "user-one", "challenge-one", valid), false);
});
