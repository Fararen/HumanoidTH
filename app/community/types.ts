export type PostType =
  | "QUESTION"
  | "DISCUSSION"
  | "TUTORIAL"
  | "SHOWCASE"
  | "RESEARCH"
  | "NEWS"
  | "IDEA";

export interface PostAuthor {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  roleBadge?: string;
  isVerified?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  parentId?: string | null;
  author: PostAuthor;
  content: string;
  createdAt: string;
  timeAgo?: string;
  upvotes: number;
  downvotes?: number;
  userVote?: "UP" | "DOWN" | null;
  replies?: PostComment[];
}

export interface CommunityPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  type: PostType;
  communityName?: string;
  author: PostAuthor;
  tags: string[];
  createdAt: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  userVote?: "UP" | "DOWN" | null;
  commentsCount: number;
  viewsCount: number;
  isBookmarked?: boolean;
  mediaUrl?: string;
  linkUrl?: string;
  isPinned?: boolean;
}

export type SortOrder = "TRENDING" | "LATEST" | "TOP" | "DISCUSSED";

export interface CommunityTopic {
  tag: string;
  label: string;
  postCount: number;
  description?: string;
}
