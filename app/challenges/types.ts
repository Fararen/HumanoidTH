export type ChallengeType = "OFFICIAL" | "COMMUNITY";
export type ChallengeMode = "PROJECT_SHOWCASE" | "DATASET_BENCHMARK" | "SIMULATION";
export type ChallengeStatus = "ACTIVE" | "UPCOMING" | "COMPLETED";
export type KaggleCategory = "Featured" | "Research" | "Community" | "Getting Started";

export interface RubricCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export interface PrizeTier {
  place: string;
  reward: string;
  description?: string;
}

export interface ChallengeOrganizer {
  name: string;
  organizationType: string;
  isVerified: boolean;
  avatarEmoji?: string;
  avatarUrl?: string;
  websiteUrl?: string;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  kaggleCategory: KaggleCategory;
  type: ChallengeType;
  mode: ChallengeMode;
  status: ChallengeStatus;
  organizer: ChallengeOrganizer;
  bannerEmoji: string;
  bannerGradient: string;
  thumbnailUrl?: string;
  badgeLetter?: string;
  prizePool: string;
  prizeDisplay: string;
  prizes: PrizeTier[];
  schedule: {
    registrationDeadline: string;
    submissionDeadline: string;
    announcementDate: string;
    daysRemaining: number;
    closingText: string;
  };
  participantsCount: number;
  submissionsCount: number;
  tags: string[];
  rubric: RubricCriterion[];
  rules: string[];
  submissionRequirements: string[];
  evaluationMetric: string;
  datasetOverview?: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  rank: number;
  rankChange?: number; // e.g. +2, -1, 0
  awardBadge?: "GOLD" | "SILVER" | "BRONZE" | "FINALIST" | "HONORABLE";
  teamName: string;
  teamAvatarEmoji?: string;
  title: string;
  description: string;
  submittedAt: string;
  lastSubmitTime?: string;
  githubUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  totalScore: number;
  scoreDisplay?: string;
  entriesCount: number;
  rubricScores: Record<string, number>;
  status: "APPROVED" | "UNDER_REVIEW" | "PROVISIONAL";
  votesCount: number;
}
