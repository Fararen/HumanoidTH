"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CommunityPost,
  PostComment,
  PostType
} from "../types";
import {
  ArrowLeft,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Bookmark,
  Share2,
  Check,
  CornerDownRight,
  Send,
  Pin
} from "lucide-react";

interface PostDetailClientProps {
  initialPost: CommunityPost | null;
  initialComments: PostComment[];
  postId: string;
}

const POST_TYPE_CONFIG: Record<
  PostType,
  { label: string; bg: string; color: string; border: string }
> = {
  QUESTION: { label: "Question", bg: "rgba(229, 184, 57, 0.12)", color: "#b45309", border: "rgba(229, 184, 57, 0.35)" },
  DISCUSSION: { label: "Discussion", bg: "rgba(25, 82, 60, 0.08)", color: "#19523c", border: "rgba(25, 82, 60, 0.25)" },
  TUTORIAL: { label: "Tutorial", bg: "rgba(59, 130, 246, 0.1)", color: "#1d4ed8", border: "rgba(59, 130, 246, 0.3)" },
  SHOWCASE: { label: "Showcase", bg: "rgba(168, 85, 247, 0.1)", color: "#7e22ce", border: "rgba(168, 85, 247, 0.3)" },
  RESEARCH: { label: "Research", bg: "#e8f0ff", color: "#204899", border: "#aec5f0" },
  NEWS: { label: "News", bg: "rgba(16, 185, 129, 0.12)", color: "#047857", border: "rgba(16, 185, 129, 0.3)" },
  IDEA: { label: "Idea", bg: "rgba(249, 115, 22, 0.1)", color: "#c2410c", border: "rgba(249, 115, 22, 0.3)" }
};

const POSTS_STORAGE_KEY = "humanoidth_community_posts_v1";
const COMMENTS_STORAGE_PREFIX = "humanoidth_community_comments_";

export default function PostDetailClient({
  initialPost,
  initialComments,
  postId
}: PostDetailClientProps) {
  const [post, setPost] = useState<CommunityPost | null>(initialPost);
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [commenterName, setCommenterName] = useState("Robotics Explorer");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => { setPost(initialPost); setComments(initialComments); }, [initialPost, initialComments]);

  // Vote on Post
  const handlePostVote = (direction: "UP" | "DOWN") => {
    if (!post) return;
    const currentVote = post.userVote;
    fetch("/api/community/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, voteType: direction })
    }).catch(() => {});
    let nextVote: "UP" | "DOWN" | null = direction;
    let upDiff = 0;
    let downDiff = 0;

    if (currentVote === direction) {
      nextVote = null;
      if (direction === "UP") upDiff = -1;
      if (direction === "DOWN") downDiff = -1;
    } else if (currentVote === "UP" && direction === "DOWN") {
      upDiff = -1;
      downDiff = 1;
    } else if (currentVote === "DOWN" && direction === "UP") {
      upDiff = 1;
      downDiff = -1;
    } else if (!currentVote) {
      if (direction === "UP") upDiff = 1;
      if (direction === "DOWN") downDiff = 1;
    }

    const updated: CommunityPost = {
      ...post,
      upvotes: Math.max(0, post.upvotes + upDiff),
      downvotes: Math.max(0, post.downvotes + downDiff),
      userVote: nextVote
    };

    setPost(updated);

    try {
      const stored = localStorage.getItem(POSTS_STORAGE_KEY);
      if (stored) {
        const parsed: CommunityPost[] = JSON.parse(stored);
        const next = parsed.map((p) => (p.id === updated.id ? updated : p));
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(next));
      }
    } catch {}
  };

  // Vote on Comment or Reply
  const handleCommentVote = (commentId: string, parentCommentId?: string) => {
    setComments((prev) => {
      const updated = prev.map((c) => {
        if (!parentCommentId && c.id === commentId) {
          const isUp = c.userVote === "UP";
          return {
            ...c,
            upvotes: isUp ? c.upvotes - 1 : c.upvotes + 1,
            userVote: isUp ? null : ("UP" as const)
          };
        }
        if (parentCommentId && c.id === parentCommentId && c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r.id === commentId) {
                const isUp = r.userVote === "UP";
                return {
                  ...r,
                  upvotes: isUp ? r.upvotes - 1 : r.upvotes + 1,
                  userVote: isUp ? null : ("UP" as const)
                };
              }
              return r;
            })
          };
        }
        return c;
      });

      try {
        localStorage.setItem(`${COMMENTS_STORAGE_PREFIX}${postId}`, JSON.stringify(updated));
      } catch {}

      return updated;
    });
  };

  // Bookmark
  const handleBookmark = () => {
    if (!post) return;
    const updated = { ...post, isBookmarked: !post.isBookmarked };
    setPost(updated);
    try {
      const stored = localStorage.getItem(POSTS_STORAGE_KEY);
      if (stored) {
        const parsed: CommunityPost[] = JSON.parse(stored);
        const next = parsed.map((p) => (p.id === updated.id ? updated : p));
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(next));
      }
    } catch {}
  };

  // Share
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Submit Top-Level Comment
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: PostComment = {
      id: `comm-${Date.now()}`,
      postId,
      parentId: null,
      author: {
        id: `u-${Date.now()}`,
        name: commenterName.trim() || "Robotics Explorer",
        handle: commenterName.trim().toLowerCase().replace(/\s+/g, "_"),
        roleBadge: "Community Member",
        isVerified: false
      },
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 1,
      userVote: "UP",
      replies: []
    };

    fetch(`/api/community/posts/${post?.id || postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText.trim(), authorName: commenterName.trim() })
    }).catch(() => {});

    const next = [...comments, newComment];
    setComments(next);
    setCommentText("");

    // Update post commentsCount
    if (post) {
      const updatedPost = { ...post, commentsCount: post.commentsCount + 1 };
      setPost(updatedPost);
      try {
        const stored = localStorage.getItem(POSTS_STORAGE_KEY);
        if (stored) {
          const parsed: CommunityPost[] = JSON.parse(stored);
          const nextPosts = parsed.map((p) => (p.id === updatedPost.id ? updatedPost : p));
          localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts));
        }
      } catch {}
    }

    try {
      localStorage.setItem(`${COMMENTS_STORAGE_PREFIX}${postId}`, JSON.stringify(next));
    } catch {}
  };

  // Submit Nested Reply
  const handleSubmitReply = (parentCommentId: string) => {
    if (!replyText.trim()) return;

    const newReply: PostComment = {
      id: `reply-${Date.now()}`,
      postId,
      parentId: parentCommentId,
      author: {
        id: `u-${Date.now()}`,
        name: commenterName.trim() || "Robotics Explorer",
        handle: commenterName.trim().toLowerCase().replace(/\s+/g, "_"),
        roleBadge: "Community Member",
        isVerified: false
      },
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 1,
      userVote: "UP"
    };

    fetch(`/api/community/posts/${post?.id || postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText.trim(), parentId: parentCommentId, authorName: commenterName.trim() })
    }).catch(() => {});

    const next = comments.map((c) => {
      if (c.id === parentCommentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply]
        };
      }
      return c;
    });

    setComments(next);
    setReplyText("");
    setReplyingToId(null);

    // Update post commentsCount
    if (post) {
      const updatedPost = { ...post, commentsCount: post.commentsCount + 1 };
      setPost(updatedPost);
      try {
        const stored = localStorage.getItem(POSTS_STORAGE_KEY);
        if (stored) {
          const parsed: CommunityPost[] = JSON.parse(stored);
          const nextPosts = parsed.map((p) => (p.id === updatedPost.id ? updatedPost : p));
          localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts));
        }
      } catch {}
    }

    try {
      localStorage.setItem(`${COMMENTS_STORAGE_PREFIX}${postId}`, JSON.stringify(next));
    } catch {}
  };

  if (!post) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
        <p>Post not found or still loading...</p>
        <Link href="/community" style={{ color: "#19523c", fontWeight: 700 }}>
          ← Back to Community Discussions
        </Link>
      </div>
    );
  }

  const netVotes = post.upvotes - post.downvotes;
  const flair = POST_TYPE_CONFIG[post.type];
  const isUpvoted = post.userVote === "UP";
  const isDownvoted = post.userVote === "DOWN";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 1. Breadcrumbs */}
      <div>
        <Link
          href="/community"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: "#19523c",
            textDecoration: "none"
          }}
        >
          <ArrowLeft size={14} /> Community Discussions
        </Link>
      </div>

      {/* 2. Main 2-Column Thread Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)",
          gap: 24,
          alignItems: "start"
        }}
      >
        {/* Left Column: Post Card & Comments */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Main Post Card (Reddit Unified Card) */}
          <article
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 14,
              border: "1px solid var(--border, rgba(0, 0, 0, 0.09))",
              background: "var(--surface, #ffffff)",
              padding: "20px 24px 16px 24px",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)"
            }}
          >
            {/* Meta Row (Reddit Style) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                gap: 8
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  fontSize: 12.5,
                  color: "var(--text-secondary, #64748b)"
                }}
              >
                <strong style={{ color: "var(--text-primary, #0f172a)" }}>
                  r/HumanoidTH
                </strong>
                <span>•</span>
                <span>Posted by</span>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {post.author.avatarUrl && (
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        objectFit: "cover"
                      }}
                    />
                  )}
                  <strong style={{ color: "var(--text-primary, #1e293b)" }}>
                    u/{post.author.handle || post.author.name.toLowerCase().replace(/\s+/g, "_")}
                  </strong>
                </div>
                {post.author.roleBadge && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#f1f5f9",
                      color: "#475569"
                    }}
                  >
                    {post.author.roleBadge}
                  </span>
                )}
                <span>•</span>
                <span>{post.timeAgo}</span>
              </div>

              {/* Flair & Pinned */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {post.isPinned && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 9999,
                      background: "rgba(25, 82, 60, 0.1)",
                      color: "#19523c",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3
                    }}
                  >
                    <Pin size={11} /> Pinned
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 10px",
                    borderRadius: 9999,
                    background: flair.bg,
                    color: flair.color,
                    border: `1px solid ${flair.border}`
                  }}
                >
                  {flair.label}
                </span>
              </div>
            </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  margin: "0 0 14px 0",
                  lineHeight: 1.3,
                  color: "var(--text-primary, #0f172a)",
                  letterSpacing: "-0.02em"
                }}
              >
                {post.title}
              </h1>

              {/* Body */}
              <div
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.7,
                  color: "var(--text-primary, #1e293b)",
                  whiteSpace: "pre-wrap",
                  marginBottom: 18
                }}
              >
                {post.content}
              </div>

              {/* Optional Media */}
              {post.mediaUrl && (
                <div
                  style={{
                    marginBottom: 18,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid var(--border, rgba(0,0,0,0.08))"
                  }}
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    style={{
                      width: "100%",
                      maxHeight: 400,
                      objectFit: "cover",
                      display: "block"
                    }}
                  />
                </div>
              )}

              {/* Tags */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 16
                }}
              >
                {post.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#19523c",
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "rgba(25, 82, 60, 0.07)"
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>

            {/* Reddit Signature Bottom Action Pills */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                paddingTop: 12,
                borderTop: "1px solid var(--border, rgba(0, 0, 0, 0.06))"
              }}
            >
              {/* Grouped Reddit Vote Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: isUpvoted
                    ? "rgba(234, 88, 12, 0.12)"
                    : isDownvoted
                    ? "rgba(59, 130, 246, 0.12)"
                    : "rgba(0, 0, 0, 0.04)",
                  borderRadius: 9999,
                  padding: "2px 4px",
                  height: 32,
                  gap: 2
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePostVote("UP")}
                  aria-label="Upvote"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 6px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isUpvoted ? "#ea580c" : "#64748b",
                    transition: "all 120ms ease"
                  }}
                >
                  <ArrowBigUp size={20} fill={isUpvoted ? "#ea580c" : "none"} />
                </button>

                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    padding: "0 4px",
                    color: isUpvoted
                      ? "#ea580c"
                      : isDownvoted
                      ? "#3b82f6"
                      : "var(--text-primary, #1e293b)",
                    fontVariantNumeric: "tabular-nums"
                  }}
                >
                  {netVotes}
                </span>

                <button
                  type="button"
                  onClick={() => handlePostVote("DOWN")}
                  aria-label="Downvote"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 6px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDownvoted ? "#3b82f6" : "#64748b",
                    transition: "all 120ms ease"
                  }}
                >
                  <ArrowBigDown size={20} fill={isDownvoted ? "#3b82f6" : "none"} />
                </button>
              </div>

              {/* Comments Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 9999,
                  background: "rgba(0, 0, 0, 0.04)",
                  color: "var(--text-secondary, #475569)",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                <MessageSquare size={15} />
                <span>{post.commentsCount} Comments</span>
              </div>

              {/* Share Pill */}
              <button
                type="button"
                onClick={handleShare}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 9999,
                  background: "rgba(0, 0, 0, 0.04)",
                  border: "none",
                  color: isCopied ? "#19523c" : "var(--text-secondary, #475569)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "background 120ms ease"
                }}
              >
                {isCopied ? (
                  <>
                    <Check size={14} style={{ color: "#19523c" }} />
                    <span style={{ color: "#19523c" }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Share</span>
                  </>
                )}
              </button>

              {/* Save / Bookmark Pill */}
              <button
                type="button"
                onClick={handleBookmark}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 9999,
                  background: post.isBookmarked ? "rgba(25, 82, 60, 0.1)" : "rgba(0, 0, 0, 0.04)",
                  border: "none",
                  color: post.isBookmarked ? "#19523c" : "var(--text-secondary, #475569)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "background 120ms ease"
                }}
              >
                <Bookmark
                  size={14}
                  fill={post.isBookmarked ? "#19523c" : "none"}
                />
                <span>{post.isBookmarked ? "Saved" : "Save"}</span>
              </button>
            </div>
          </article>

          {/* Comment Form */}
          <div
            style={{
              padding: "20px 24px",
              borderRadius: 14,
              border: "1px solid var(--border, rgba(0, 0, 0, 0.09))",
              background: "var(--surface, #ffffff)",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
                fontSize: 13,
                color: "var(--text-secondary, #64748b)"
              }}
            >
              <span>Comment as <strong>{commenterName}</strong></span>
              <input
                type="text"
                value={commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                placeholder="Change display name"
                style={{
                  fontSize: 12,
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--border, rgba(0,0,0,0.12))",
                  width: 170
                }}
              />
            </div>

            <form onSubmit={handleSubmitComment}>
              <textarea
                required
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts, engineering insights, or answer this question..."
                style={{
                  width: "100%",
                  borderRadius: 8,
                  border: "1px solid var(--border, rgba(0,0,0,0.15))",
                  padding: "12px",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  resize: "vertical",
                  boxSizing: "border-box"
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="submit"
                  style={{
                    height: 36,
                    padding: "0 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#19523c",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Send size={14} /> Post Comment
                </button>
              </div>
            </form>
          </div>

          {/* 2-Level Nested Comments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: "4px 0",
                color: "var(--text-primary, #0f172a)"
              }}
            >
              All Comments ({comments.length})
            </h3>

            {comments.map((comment) => {
              const isCommentUpvoted = comment.userVote === "UP";

              return (
                <div
                  key={comment.id}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 12,
                    background: "var(--surface, #ffffff)",
                    border: "1px solid var(--border, rgba(0, 0, 0, 0.08))"
                  }}
                >
                  {/* Comment Author Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "var(--text-secondary, #64748b)",
                      marginBottom: 8
                    }}
                  >
                    {comment.author.avatarUrl && (
                      <img
                        src={comment.author.avatarUrl}
                        alt={comment.author.name}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          objectFit: "cover"
                        }}
                      />
                    )}
                    <strong style={{ color: "var(--text-primary, #1e293b)" }}>
                      {comment.author.name}
                    </strong>
                    {comment.author.roleBadge && (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#f1f5f9",
                          color: "#475569"
                        }}
                      >
                        {comment.author.roleBadge}
                      </span>
                    )}
                    <span>•</span>
                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Comment Content */}
                  <p
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: "var(--text-primary, #1e293b)",
                      whiteSpace: "pre-wrap",
                      margin: "0 0 10px 0"
                    }}
                  >
                    {comment.content}
                  </p>

                  {/* Comment Actions: Upvote & Reply */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      fontSize: 12,
                      color: "var(--text-secondary, #64748b)"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCommentVote(comment.id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: isCommentUpvoted ? "#19523c" : "inherit",
                        cursor: "pointer",
                        fontWeight: 700
                      }}
                    >
                      <ArrowBigUp size={18} fill={isCommentUpvoted ? "#19523c" : "none"} />
                      <span>{comment.upvotes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: "inherit",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      <CornerDownRight size={13} />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Inline Reply Form */}
                  {replyingToId === comment.id && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px dashed var(--border, rgba(0,0,0,0.1))"
                      }}
                    >
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.author.name}...`}
                        style={{
                          width: "100%",
                          borderRadius: 6,
                          border: "1px solid var(--border, rgba(0,0,0,0.15))",
                          padding: "8px",
                          fontSize: 13,
                          lineHeight: 1.4,
                          boxSizing: "border-box"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText("");
                          }}
                          style={{
                            padding: "4px 10px",
                            fontSize: 12,
                            borderRadius: 6,
                            border: "1px solid var(--border, rgba(0,0,0,0.15))",
                            background: "transparent",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitReply(comment.id)}
                          style={{
                            padding: "4px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            borderRadius: 6,
                            border: "none",
                            background: "#19523c",
                            color: "#ffffff",
                            cursor: "pointer"
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Level 2 Nested Replies (Reddit-Style) */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div
                      style={{
                        marginTop: 14,
                        marginLeft: 12,
                        paddingLeft: 16,
                        borderLeft: "1px solid rgba(25, 82, 60, 0.22)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12
                      }}
                    >
                      {comment.replies.map((reply) => {
                        const isReplyUpvoted = reply.userVote === "UP";
                        return (
                          <div
                            key={reply.id}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 8,
                              background: "#fbfaf7"
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                fontSize: 11.5,
                                color: "var(--text-secondary, #64748b)",
                                marginBottom: 4
                              }}
                            >
                              {reply.author.avatarUrl && (
                                <img
                                  src={reply.author.avatarUrl}
                                  alt={reply.author.name}
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    objectFit: "cover"
                                  }}
                                />
                              )}
                              <strong style={{ color: "var(--text-primary, #1e293b)" }}>
                                {reply.author.name}
                              </strong>
                              {reply.author.roleBadge && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: "#f1f5f9",
                                    color: "#475569"
                                  }}
                                >
                                  {reply.author.roleBadge}
                                </span>
                              )}
                              <span>•</span>
                              <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                            </div>

                            <p
                              style={{
                                fontSize: 13,
                                lineHeight: 1.55,
                                color: "var(--text-primary, #1e293b)",
                                whiteSpace: "pre-wrap",
                                margin: "0 0 6px 0"
                              }}
                            >
                              {reply.content}
                            </p>

                            <button
                              type="button"
                              onClick={() => handleCommentVote(reply.id, comment.id)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                color: isReplyUpvoted ? "#19523c" : "var(--text-secondary, #64748b)",
                                cursor: "pointer",
                                fontSize: 11.5,
                                fontWeight: 700
                              }}
                            >
                              <ArrowBigUp size={16} fill={isReplyUpvoted ? "#19523c" : "none"} />
                              <span>{reply.upvotes}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {!comments.length && (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  background: "var(--surface, #ffffff)",
                  borderRadius: 10,
                  border: "1px dashed var(--border, rgba(0,0,0,0.12))"
                }}
              >
                No comments yet. Be the first to join the conversation!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Author Profile Card & Guidelines */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Author Card */}
          <div
            style={{
              padding: "20px 22px",
              borderRadius: 12,
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, rgba(0, 0, 0, 0.09))"
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                margin: "0 0 12px 0",
                color: "var(--text-primary, #0f172a)"
              }}
            >
              Author Details
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>
                {post.author.name}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary, #64748b)" }}>
                @{post.author.handle}
              </div>
              {post.author.roleBadge && (
                <div style={{ fontSize: 12, color: "#19523c", fontWeight: 600 }}>
                  {post.author.roleBadge}
                </div>
              )}
            </div>
          </div>

          {/* Discussion Guidelines */}
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 12,
              background: "#faf8f2",
              border: "1px solid rgba(74, 124, 89, 0.15)",
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "var(--text-secondary, #475569)"
            }}
          >
            <strong style={{ color: "#19523c", display: "block", marginBottom: 6 }}>
              Commenting Guidelines
            </strong>
            <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>Provide reproduction steps for code snippets.</li>
              <li>State OS kernel & ROS 2 distribution used.</li>
              <li>Stay polite and constructive.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
