"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  CommunityPost,
  CommunityTopic,
  PostType,
  SortOrder
} from "./types";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Bookmark,
  Share2,
  Search,
  Plus,
  Pin,
  CheckCircle2,
  X,
  Flame,
  Clock,
  TrendingUp,
  Tag,
  ShieldCheck,
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Radio,
  ExternalLink,
  Code2,
  Users
} from "lucide-react";

interface CommunityClientProps {
  initialPosts: CommunityPost[];
  topics: CommunityTopic[];
}

const POST_TYPE_CONFIG: Record<
  PostType,
  { label: string; bg: string; color: string; border: string }
> = {
  QUESTION: {
    label: "Question",
    bg: "rgba(217, 119, 6, 0.08)",
    color: "#b45309",
    border: "rgba(217, 119, 6, 0.25)"
  },
  DISCUSSION: {
    label: "Discussion",
    bg: "rgba(25, 82, 60, 0.08)",
    color: "#19523c",
    border: "rgba(25, 82, 60, 0.22)"
  },
  TUTORIAL: {
    label: "Tutorial",
    bg: "rgba(37, 99, 235, 0.08)",
    color: "#1d4ed8",
    border: "rgba(37, 99, 235, 0.25)"
  },
  SHOWCASE: {
    label: "Showcase",
    bg: "rgba(147, 51, 234, 0.08)",
    color: "#7e22ce",
    border: "rgba(147, 51, 234, 0.25)"
  },
  NEWS: {
    label: "News",
    bg: "rgba(16, 185, 129, 0.08)",
    color: "#047857",
    border: "rgba(16, 185, 129, 0.25)"
  },
  IDEA: {
    label: "Idea",
    bg: "rgba(234, 88, 12, 0.08)",
    color: "#c2410c",
    border: "rgba(234, 88, 12, 0.25)"
  }
};

const COMMUNITY_RULES = [
  {
    num: 1,
    title: "Technical Rigor & Reproducible Code",
    desc: "Share working code snippets, step-by-step reproduction steps, or GitHub links when asking for balance control or algorithm assistance."
  },
  {
    num: 2,
    title: "Open-Source Licensing Attribution",
    desc: "Credit original research authors, CAD designers, and ROS 2 package maintainers with appropriate licenses."
  },
  {
    num: 3,
    title: "Constructive Peer Review & Safety",
    desc: "Encourage questions from students and hardware makers. Highlight safety procedures for high-voltage actuators and bench tests."
  },
  {
    num: 4,
    title: "No Low-Effort AI Spam",
    desc: "Generic AI text dumps without engineering context or verified benchmarks are not permitted."
  }
];

const STORAGE_KEY = "humanoidth_community_posts_v1";

export default function CommunityClient({
  initialPosts,
  topics
}: CommunityClientProps) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("TRENDING");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(true);
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isCreateModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCreateModalOpen]);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<PostType>("QUESTION");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("Robotics Explorer");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Check for success banner from /community/submit
      const successTitle = sessionStorage.getItem("humanoidth_new_post_success");
      if (successTitle) {
        setSuccessBanner(`🎉 โพสต์ "${successTitle}" เผยแพร่สำเร็จแล้ว และแสดงที่ด้านบนสุดของฟีด`);
        setSortOrder("LATEST");
        sessionStorage.removeItem("humanoidth_new_post_success");
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CommunityPost[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map((p) => p.id));
          const defaultsToAdd = initialPosts.filter((p) => !storedIds.has(p.id));
          setPosts([...parsed, ...defaultsToAdd]);
          return;
        }
      }
    } catch {
      // Fallback
    }
  }, [initialPosts]);

  // Handle Voting (Reddit style: UP = Orange, DOWN = Blue)
  const handleVote = (postId: string, direction: "UP" | "DOWN") => {
    fetch("/api/community/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, voteType: direction })
    }).catch(() => {});
    setPosts((prev) => {
      const updated = prev.map((post) => {
        if (post.id !== postId) return post;
        const currentVote = post.userVote;
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

        return {
          ...post,
          upvotes: Math.max(0, post.upvotes + upDiff),
          downvotes: Math.max(0, post.downvotes + downDiff),
          userVote: nextVote
        };
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      return updated;
    });
  };

  // Handle Bookmark
  const handleBookmark = (postId: string) => {
    setPosts((prev) => {
      const updated = prev.map((post) =>
        post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Handle Share Copy Link
  const handleShare = (post: CommunityPost) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/community/${post.id}`;
      navigator.clipboard.writeText(url);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

  // Handle Create Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagsArray = newTags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: newTitle.trim(),
      content: newContent.trim(),
      type: newType,
      author: {
        id: `u-${Date.now()}`,
        name: authorName.trim() || "Robotics Explorer",
        handle: authorName.trim().toLowerCase().replace(/\s+/g, "_"),
        roleBadge: "Community Member",
        isVerified: false
      },
      tags: tagsArray.length > 0 ? tagsArray : ["Robotics", "Humanoid"],
      createdAt: new Date().toISOString(),
      timeAgo: "Just now",
      upvotes: 1,
      downvotes: 0,
      userVote: "UP",
      commentsCount: 0,
      viewsCount: 1,
      isBookmarked: false,
      mediaUrl: newImageUrl.trim() || undefined
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Reset Form, switch to LATEST so the new post appears immediately at the top
    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setNewImageUrl("");
    setSelectedType("ALL");
    setSelectedTag("ALL");
    setSortOrder("LATEST");
    setSuccessBanner(`🎉 โพสต์ "${newPost.title}" เผยแพร่สำเร็จแล้ว และแสดงที่ด้านบนสุดของฟีด`);
    setIsCreateModalOpen(false);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Filter & Sort
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const matchesSearch =
          !search ||
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.content.toLowerCase().includes(search.toLowerCase()) ||
          post.author.name.toLowerCase().includes(search.toLowerCase()) ||
          post.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

        const matchesType =
          selectedType === "ALL" || post.type === selectedType;

        const matchesTag =
          selectedTag === "ALL" || post.tags.includes(selectedTag);

        return matchesSearch && matchesType && matchesTag;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortOrder === "LATEST") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortOrder === "TOP") {
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        }
        if (sortOrder === "DISCUSSED") {
          return b.commentsCount - a.commentsCount;
        }
        // Hot / Trending
        const scoreA = (a.upvotes - a.downvotes) * 2 + a.commentsCount * 3;
        const scoreB = (b.upvotes - b.downvotes) * 2 + b.commentsCount * 3;
        return scoreB - scoreA;
      });
  }, [posts, search, selectedType, selectedTag, sortOrder]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 1. Impeccable Header: Editorial, Clean, No Broken Green Block */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
          paddingBottom: 4
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 800,
                margin: 0,
                color: "var(--text-primary, #0f172a)",
                letterSpacing: "-0.03em",
                lineHeight: 1.15
              }}
            >
              Discussions
            </h1>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary, #64748b)"
              }}
            >
              r/HumanoidTH • {posts.length} Threads
            </span>
          </div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--text-secondary, #64748b)",
              margin: "6px 0 0 0",
              maxWidth: 640
            }}
          >
            Ask technical questions, benchmark balance control loops, share open-source hardware, and exchange insights with Thailand&apos;s robotics ecosystem.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsJoined(!isJoined)}
            style={{
              height: 38,
              padding: "0 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              border: "1px solid var(--border, rgba(0,0,0,0.15))",
              background: isJoined ? "transparent" : "#19523c",
              color: isJoined ? "var(--text-primary, #1e293b)" : "#ffffff",
              transition: "all 140ms ease"
            }}
          >
            {isJoined ? "Joined Community" : "+ Join Community"}
          </button>

          <Link
            href="/community/submit"
            style={{
              height: 38,
              padding: "0 20px",
              fontSize: 13,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 8,
              background: "#19523c",
              color: "#ffffff",
              textDecoration: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(25, 82, 60, 0.2)"
            }}
          >
            <Plus size={16} /> Create Post
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          style={{
            padding: "12px 18px",
            background: "#ecfdf5",
            border: "1px solid #6ee7b7",
            borderRadius: 8,
            color: "#065f46",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={16} style={{ color: "#059669" }} />
            <strong>{successBanner}</strong>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "#065f46" }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. Unified Search & Flair Filter Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "10px 14px",
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
          borderRadius: 10,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)"
        }}
      >
        {/* Left: Search input */}
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 440 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary, #64748b)"
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discussions, hardware builds, or authors..."
            style={{
              width: "100%",
              paddingLeft: 34,
              paddingRight: 12,
              height: 34,
              fontSize: 13,
              borderRadius: 6,
              border: "1px solid var(--border, rgba(0, 0, 0, 0.12))",
              background: "rgba(0, 0, 0, 0.02)",
              outline: "none"
            }}
          />
        </div>

        {/* Right: Category Flairs filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            style={{
              padding: "4px 11px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              border: `1px solid ${selectedType === "ALL" ? "#19523c" : "transparent"}`,
              background: selectedType === "ALL" ? "rgba(25, 82, 60, 0.09)" : "transparent",
              color: selectedType === "ALL" ? "#19523c" : "var(--text-secondary, #64748b)",
              cursor: "pointer"
            }}
          >
            All Flairs
          </button>

          {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map((type) => {
            const config = POST_TYPE_CONFIG[type];
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(isSelected ? "ALL" : type)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: isSelected ? `1px solid ${config.color}` : "1px solid transparent",
                  background: isSelected ? config.bg : "transparent",
                  color: isSelected ? config.color : "var(--text-secondary, #64748b)",
                  cursor: "pointer",
                  transition: "all 120ms ease"
                }}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main 2-Column Content Layout (Reddit Feed + Clean Right Sidebar) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(290px, 320px)",
          gap: 20,
          alignItems: "start"
        }}
      >
        {/* Left Column: Feed Stream */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Quick Create Thread Input */}
          <Link
            href="/community/submit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
              borderRadius: 10,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
              cursor: "pointer",
              textDecoration: "none",
              transition: "border-color 140ms ease"
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#19523c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0
              }}
            >
              H
            </div>

            <div
              style={{
                flex: 1,
                height: 34,
                padding: "0 14px",
                borderRadius: 6,
                background: "rgba(0, 0, 0, 0.025)",
                border: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
                fontSize: 13,
                color: "var(--text-secondary, #64748b)",
                display: "flex",
                alignItems: "center"
              }}
            >
              Create Post...
            </div>

            <span
              title="Add Image or STEP/CAD preview"
              style={{
                color: "var(--text-secondary, #64748b)",
                padding: "6px"
              }}
            >
              <ImageIcon size={18} />
            </span>

            <span
              title="Add Link / Repo"
              style={{
                color: "var(--text-secondary, #64748b)",
                padding: "6px"
              }}
            >
              <LinkIcon size={18} />
            </span>
          </Link>

          {/* Sort Tabs Bar (Hot / New / Top / Rising) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
              borderRadius: 10
            }}
          >
            {[
              { id: "TRENDING", label: "Hot", icon: Flame },
              { id: "LATEST", label: "New", icon: Sparkles },
              { id: "TOP", label: "Top Voted", icon: TrendingUp },
              { id: "DISCUSSED", label: "Rising", icon: MessageSquare }
            ].map((s) => {
              const isSelected = sortOrder === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSortOrder(s.id as SortOrder)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 700 : 500,
                    border: "none",
                    background: isSelected ? "rgba(25, 82, 60, 0.08)" : "transparent",
                    color: isSelected ? "#19523c" : "var(--text-secondary, #64748b)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Icon size={14} style={{ color: isSelected ? "#19523c" : "#94a3b8" }} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Active Tag Filter Pill */}
          {selectedTag !== "ALL" && (
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "rgba(25, 82, 60, 0.06)",
                border: "1px solid rgba(25, 82, 60, 0.18)",
                fontSize: 12.5,
                color: "#19523c",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>Filtering by topic: <strong>#{selectedTag}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedTag("ALL")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#19523c",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Post Cards Feed */}
          {filteredPosts.map((post) => {
            const netVotes = post.upvotes - post.downvotes;
            const flair = POST_TYPE_CONFIG[post.type];
            const isUpvoted = post.userVote === "UP";
            const isDownvoted = post.userVote === "DOWN";

            return (
              <article
                key={post.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 10,
                  border: post.isPinned
                    ? "1px solid rgba(25, 82, 60, 0.35)"
                    : "1px solid var(--border, rgba(0, 0, 0, 0.08))",
                  background: "var(--surface, #ffffff)",
                  padding: "16px 18px 12px 18px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                  transition: "border-color 140ms ease"
                }}
              >
                {/* 1. Header Metadata */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    gap: 8
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      fontSize: 12,
                      color: "var(--text-secondary, #64748b)"
                    }}
                  >
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

                    <span style={{ fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>
                      u/{post.author.handle || post.author.name.toLowerCase().replace(/\s+/g, "_")}
                    </span>

                    {post.author.roleBadge && (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(0,0,0,0.04)",
                          color: "var(--text-secondary, #475569)",
                          fontWeight: 500
                        }}
                      >
                        {post.author.roleBadge}
                      </span>
                    )}

                    <span>•</span>
                    <span>{post.timeAgo}</span>
                  </div>

                  {/* Top-Right Badges: Pinned & Flair */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {post.isPinned && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "rgba(25, 82, 60, 0.09)",
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
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: flair.bg,
                        color: flair.color,
                        border: `1px solid ${flair.border}`
                      }}
                    >
                      {flair.label}
                    </span>
                  </div>
                </div>

                {/* 2. Post Title */}
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    margin: "0 0 8px 0",
                    lineHeight: 1.35
                  }}
                >
                  <Link
                    href={`/community/${post.id}`}
                    style={{
                      color: "var(--text-primary, #0f172a)",
                      textDecoration: "none"
                    }}
                  >
                    {post.title}
                  </Link>
                </h2>

                {/* 3. Post Body Excerpt */}
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "var(--text-secondary, #334155)",
                    margin: "0 0 12px 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}
                >
                  {post.content}
                </p>

                {/* 4. Optional Media Preview */}
                {post.mediaUrl && (
                  <div
                    style={{
                      marginBottom: 12,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid var(--border, rgba(0,0,0,0.08))",
                      background: "#0a0a0a",
                      maxHeight: 340,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      style={{
                        width: "100%",
                        maxHeight: 340,
                        objectFit: "cover",
                        display: "block"
                      }}
                    />
                  </div>
                )}

                {/* 5. Post Tags */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 12
                  }}
                >
                  {post.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTag(t)}
                      style={{
                        background: "rgba(0, 0, 0, 0.035)",
                        border: "none",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#19523c",
                        cursor: "pointer"
                      }}
                    >
                      #{t}
                    </button>
                  ))}
                </div>

                {/* 6. Reddit Signature Bottom Action Pills */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap"
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
                      onClick={() => handleVote(post.id, "UP")}
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
                      onClick={() => handleVote(post.id, "DOWN")}
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
                  <Link
                    href={`/community/${post.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 9999,
                      background: "rgba(0, 0, 0, 0.04)",
                      color: "var(--text-secondary, #475569)",
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "background 120ms ease"
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>{post.commentsCount} Comments</span>
                  </Link>

                  {/* Share Pill */}
                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 9999,
                      background: "rgba(0, 0, 0, 0.04)",
                      border: "none",
                      color: copiedPostId === post.id ? "#19523c" : "var(--text-secondary, #475569)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "background 120ms ease"
                    }}
                  >
                    {copiedPostId === post.id ? (
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
                    onClick={() => handleBookmark(post.id)}
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
            );
          })}

          {!filteredPosts.length && (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "var(--text-secondary, #64748b)",
                background: "var(--surface, #ffffff)",
                borderRadius: 10,
                border: "1px dashed var(--border, rgba(0, 0, 0, 0.15))"
              }}
            >
              No discussions found matching your filter criteria. Be the first to start a conversation!
            </div>
          )}
        </div>

        {/* Right Column: Clean Editorial Community Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 1. About Community Card */}
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 10,
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, rgba(0, 0, 0, 0.09))",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-primary, #0f172a)"
                }}
              >
                About Community
              </h3>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#19523c" }}>r/HumanoidTH</span>
            </div>

            <p
              style={{
                fontSize: 12.5,
                lineHeight: 1.55,
                color: "var(--text-secondary, #64748b)",
                margin: "0 0 14px 0"
              }}
            >
              Thailand&apos;s robotics developer collective for sharing control algorithms, CAD files, ROS 2 benchmarks, and embodied AI research.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                padding: "10px 0",
                borderTop: "1px solid var(--border, rgba(0,0,0,0.06))",
                borderBottom: "1px solid var(--border, rgba(0,0,0,0.06))",
                marginBottom: 14
              }}
            >
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                  4.3k
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary, #64748b)" }}>
                  Members
                </div>
              </div>

              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#16a34a", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  142
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary, #64748b)" }}>
                  Online now
                </div>
              </div>
            </div>

            <Link
              href="/community/submit"
              style={{
                width: "100%",
                height: 36,
                borderRadius: 6,
                background: "#19523c",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxSizing: "border-box"
              }}
            >
              <Plus size={14} /> Create a Post
            </Link>
          </div>

          {/* 2. Community Norms */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 10,
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, rgba(0, 0, 0, 0.09))"
            }}
          >
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "0 0 10px 0",
                color: "var(--text-secondary, #64748b)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <ShieldCheck size={15} style={{ color: "#19523c" }} /> Community Norms
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {COMMUNITY_RULES.map((rule) => {
                const isOpen = expandedRule === rule.num;
                return (
                  <div
                    key={rule.num}
                    style={{
                      borderBottom: "1px solid var(--border, rgba(0,0,0,0.05))",
                      paddingBottom: 4
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedRule(isOpen ? null : rule.num)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "none",
                        border: "none",
                        padding: "5px 0",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-primary, #1e293b)"
                      }}
                    >
                      <span>{rule.num}. {rule.title}</span>
                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {isOpen && (
                      <p
                        style={{
                          fontSize: 11.5,
                          lineHeight: 1.5,
                          color: "var(--text-secondary, #64748b)",
                          margin: "2px 0 6px 12px"
                        }}
                      >
                        {rule.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Popular Topics */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 10,
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, rgba(0, 0, 0, 0.09))"
            }}
          >
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "0 0 10px 0",
                color: "var(--text-secondary, #64748b)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Tag size={14} style={{ color: "#19523c" }} /> Topics
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {topics.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === t.tag ? "ALL" : t.tag)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: selectedTag === t.tag ? "rgba(25, 82, 60, 0.08)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 12, color: selectedTag === t.tag ? "#19523c" : "var(--text-primary, #1e293b)" }}>
                      #{t.tag}
                    </strong>
                    <div style={{ fontSize: 10.5, color: "var(--text-secondary, #64748b)" }}>
                      {t.label}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 10,
                      background: "#f1f5f9",
                      color: "#475569"
                    }}
                  >
                    {t.postCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* 4. Create Post Modal mounted directly to document.body via Portal */}
      {mounted && isCreateModalOpen && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
            boxSizing: "border-box"
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              maxWidth: 580,
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "24px 28px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              border: "1px solid rgba(0, 0, 0, 0.12)",
              position: "relative",
              zIndex: 100000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18
              }}
            >
              <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Create Post
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6, color: "#1e293b" }}>
                  Your Name / Handle
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Dr. Kittisak Charoen"
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.18)",
                    padding: "0 12px",
                    fontSize: 13.5,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6, color: "#1e293b" }}>
                    Flair / Category
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PostType)}
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 6,
                      border: "1px solid rgba(0,0,0,0.18)",
                      padding: "0 10px",
                      fontSize: 13.5,
                      background: "#ffffff",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="QUESTION">Question</option>
                    <option value="DISCUSSION">Discussion</option>
                    <option value="TUTORIAL">Tutorial</option>
                    <option value="SHOWCASE">Showcase</option>
                    <option value="NEWS">News</option>
                    <option value="IDEA">Idea</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6, color: "#1e293b" }}>
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="ROS2, Hardware, SLAM"
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 6,
                      border: "1px solid rgba(0,0,0,0.18)",
                      padding: "0 12px",
                      fontSize: 13.5,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6, color: "#1e293b" }}>
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What is your question or discussion topic?"
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.18)",
                    padding: "0 12px",
                    fontSize: 13.5,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6, color: "#1e293b" }}>
                  Body Text
                </label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share details, reproducible code, logs, or hardware specifications..."
                  style={{
                    width: "100%",
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.18)",
                    padding: "10px 12px",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6, color: "#1e293b" }}>
                  Image / Media URL (Optional)
                </label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.18)",
                    padding: "0 12px",
                    fontSize: 13.5,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 6
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    height: 36,
                    padding: "0 18px",
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.18)",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    height: 36,
                    padding: "0 22px",
                    borderRadius: 6,
                    border: "none",
                    background: "#19523c",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(25, 82, 60, 0.25)"
                  }}
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
