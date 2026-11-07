"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CommunityPost,
  CommunityTopic,
  PostType
} from "../types";
import {
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Bold,
  Italic,
  Strikethrough,
  Superscript,
  Type,
  List,
  ListOrdered,
  Quote,
  Code,
  Table,
  MoreHorizontal,
  ChevronDown,
  ArrowLeft,
  Bot,
  ShieldCheck,
  Check,
  X,
  AlertCircle
} from "lucide-react";

interface SubmitPostClientProps {
  topics: CommunityTopic[];
}

const POST_TYPE_CONFIG: Record<
  PostType,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  QUESTION: {
    label: "Question ❓",
    bg: "rgba(217, 119, 6, 0.08)",
    color: "#b45309",
    border: "rgba(217, 119, 6, 0.28)",
    desc: "Technical questions about kinematics, ROS 2, IMU jitter, or motor drivers"
  },
  DISCUSSION: {
    label: "Discussion 💬",
    bg: "rgba(25, 82, 60, 0.08)",
    color: "#19523c",
    border: "rgba(25, 82, 60, 0.25)",
    desc: "Architecture trade-offs, humanoid ecosystem in Thailand, or industry trends"
  },
  TUTORIAL: {
    label: "Tutorial 📚",
    bg: "rgba(37, 99, 235, 0.08)",
    color: "#1d4ed8",
    border: "rgba(37, 99, 235, 0.28)",
    desc: "Step-by-step guides, Isaac Sim setups, or actuator manufacturing instructions"
  },
  SHOWCASE: {
    label: "Showcase 🚀",
    bg: "rgba(147, 51, 234, 0.08)",
    color: "#7e22ce",
    border: "rgba(147, 51, 234, 0.28)",
    desc: "Bench test results, cycloidal gears, biped walking videos, or hardware builds"
  },
  NEWS: {
    label: "News 📰",
    bg: "rgba(16, 185, 129, 0.08)",
    color: "#047857",
    border: "rgba(16, 185, 129, 0.28)",
    desc: "SDK updates, hackathon announcements, or university lab breakthroughs"
  },
  IDEA: {
    label: "Idea 💡",
    bg: "rgba(234, 88, 12, 0.08)",
    color: "#c2410c",
    border: "rgba(234, 88, 12, 0.28)",
    desc: "Conceptual proposals, compliant soft grippers, or research pitches"
  }
};

const STORAGE_KEY = "humanoidth_community_posts_v1";
const DRAFT_STORAGE_KEY = "humanoidth_post_draft_v1";

export default function SubmitPostClient({ topics }: SubmitPostClientProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form State
  const [selectedCommunity, setSelectedCommunity] = useState("r/HumanoidTH");
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState<PostType>("QUESTION");
  const [isFlairPickerOpen, setIsFlairPickerOpen] = useState(false);
  const [hasChosenFlair, setHasChosenFlair] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [authorName, setAuthorName] = useState("Robotics Explorer");

  // Drafts & Status State
  const [hasDraft, setHasDraft] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Check saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          setHasDraft(true);
        }
      }
    } catch {}
  }, []);

  // Restore draft
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.content) setContent(draft.content);
        if (draft.type) {
          setSelectedType(draft.type);
          setHasChosenFlair(true);
        }
        if (draft.tags) setTagsInput(draft.tags);
        if (draft.imageUrl) {
          setImageUrl(draft.imageUrl);
          setShowImageInput(true);
        }
        setFeedbackNotice("โหลดฉบับร่างเรียบร้อยแล้ว");
        setTimeout(() => setFeedbackNotice(null), 3000);
      }
    } catch {}
  };

  // Save draft
  const handleSaveDraft = () => {
    if (!title.trim() && !content.trim()) return;
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          title,
          content,
          type: selectedType,
          tags: tagsInput,
          imageUrl,
          updatedAt: new Date().toISOString()
        })
      );
      setHasDraft(true);
      setFeedbackNotice("บันทึกฉบับร่างเรียบร้อยแล้ว");
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch {}
  };

  // Textarea formatting helper
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = el.value;
    const selected = current.substring(start, end);
    const replacement = prefix + (selected || "ข้อความ") + suffix;
    const nextVal = current.substring(0, start) + replacement + current.substring(end);
    setContent(nextVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 6));
    }, 10);
  };

  // Handle Publish Post
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: title.trim(),
      content: content.trim() || "No text description provided.",
      type: selectedType,
      author: {
        id: `u-${Date.now()}`,
        name: authorName.trim() || "Robotics Explorer",
        handle: authorName.trim().toLowerCase().replace(/\s+/g, "_"),
        roleBadge: "Community Member",
        isVerified: false
      },
      tags: tagsArray.length > 0 ? tagsArray : ["Humanoid", "Robotics"],
      createdAt: new Date().toISOString(),
      timeAgo: "Just now",
      upvotes: 1,
      downvotes: 0,
      userVote: "UP",
      commentsCount: 0,
      viewsCount: 1,
      isBookmarked: false,
      mediaUrl: imageUrl.trim() || undefined
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [newPost, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Save success flash flag
      sessionStorage.setItem("humanoidth_new_post_success", newPost.title);
    } catch {}

    // Navigate to feed
    router.push("/community");
  };

  const currentFlair = POST_TYPE_CONFIG[selectedType];
  const canPublish = title.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. Top Breadcrumb & Notification */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <ArrowLeft size={14} /> Back to r/HumanoidTH Feed
        </Link>

        {feedbackNotice && (
          <div
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              background: "#ecfdf5",
              border: "1px solid #6ee7b7",
              color: "#065f46",
              fontSize: 12.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Check size={14} /> {feedbackNotice}
          </div>
        )}
      </div>

      {/* 2. Reddit Header Bar (เลือกชุมชน + ฉบับร่าง) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 4
        }}
      >
        {/* Left: Community Selector Pill Button */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsCommunityDropdownOpen(!isCommunityDropdownOpen)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              borderRadius: 9999,
              border: "1px solid var(--border, rgba(0, 0, 0, 0.16))",
              background: "#ffffff",
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--text-primary, #0f172a)",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#19523c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}
            >
              <Bot size={14} />
            </div>
            <span>{selectedCommunity}</span>
            <ChevronDown size={14} style={{ color: "#64748b" }} />
          </button>

          {/* Community Dropdown */}
          {isCommunityDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 6,
                width: 240,
                borderRadius: 10,
                background: "#ffffff",
                border: "1px solid var(--border, rgba(0, 0, 0, 0.12))",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                zIndex: 100,
                overflow: "hidden"
              }}
            >
              {[
                { id: "r/HumanoidTH", desc: "Thailand Humanoid Collective (Official)" },
                { id: "r/ROS2_Thailand", desc: "ROS 2 Humble & Jazzy developers" },
                { id: "r/Robotics_Hardware", desc: "Actuators, BLDC & Cycloidal drives" }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCommunity(c.id);
                    setIsCommunityDropdownOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    background: selectedCommunity === c.id ? "rgba(25, 82, 60, 0.08)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <strong style={{ fontSize: 13, color: selectedCommunity === c.id ? "#19523c" : "#0f172a" }}>
                    {c.id}
                  </strong>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{c.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Drafts Button */}
        <div>
          <button
            type="button"
            onClick={handleRestoreDraft}
            style={{
              background: "none",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              color: hasDraft ? "#19523c" : "var(--text-secondary, #64748b)",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 6
            }}
          >
            ฉบับร่าง {hasDraft ? "(1)" : ""}
          </button>
        </div>
      </div>

      {/* 3. Main 2-Column Reddit Create Post Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)",
          gap: 24,
          alignItems: "start"
        }}
      >
        {/* Left Column: The Editor Card (Matching User's Screenshot Exactly) */}
        <form
          onSubmit={handlePublish}
          style={{
            background: "#ffffff",
            borderRadius: 12,
            border: "1px solid var(--border, rgba(0, 0, 0, 0.1))",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Editor Body Area */}
          <div style={{ padding: "20px 24px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Author Handle Row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#64748b" }}>
              <span>Posting as:</span>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your Name / Handle"
                style={{
                  border: "none",
                  borderBottom: "1px dashed #cbd5e1",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#0f172a",
                  outline: "none",
                  padding: "1px 4px",
                  background: "transparent",
                  width: 180
                }}
              />
            </div>

            {/* Title Input (ชื่อ*) */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                required
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ชื่อ*"
                style={{
                  width: "100%",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text-primary, #0f172a)",
                  border: "none",
                  outline: "none",
                  padding: "6px 0",
                  letterSpacing: "-0.015em",
                  boxSizing: "border-box",
                  background: "transparent"
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 10,
                  fontSize: 11,
                  color: title.length > 280 ? "#ef4444" : "#94a3b8"
                }}
              >
                {title.length}/300
              </span>
            </div>

            {/* Tags / Flairs Row (🏷️ เพิ่มแท็ก) */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setIsFlairPickerOpen(!isFlairPickerOpen)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 9999,
                  border: hasChosenFlair ? `1px solid ${currentFlair.color}` : "1px solid var(--border, rgba(0, 0, 0, 0.16))",
                  background: hasChosenFlair ? currentFlair.bg : "#ffffff",
                  color: hasChosenFlair ? currentFlair.color : "var(--text-secondary, #475569)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 120ms ease"
                }}
              >
                <Tag size={13} />
                <span>{hasChosenFlair ? currentFlair.label : "เพิ่มแท็ก"}</span>
                <ChevronDown size={12} />
              </button>

              {/* Tags Input (comma separated) */}
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="เพิ่มแท็กหัวข้อ เช่น #ROS2, #Hardware (คั่นด้วยจุลภาค)"
                style={{
                  flex: 1,
                  minWidth: 220,
                  height: 32,
                  fontSize: 12.5,
                  borderRadius: 6,
                  border: "1px solid var(--border, rgba(0, 0, 0, 0.12))",
                  padding: "0 10px",
                  outline: "none",
                  background: "rgba(0, 0, 0, 0.015)"
                }}
              />

              {/* Flair Selection Dropdown */}
              {isFlairPickerOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 6,
                    width: 320,
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid var(--border, rgba(0, 0, 0, 0.12))",
                    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.12)",
                    padding: "10px",
                    zIndex: 100,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", padding: "2px 6px" }}>
                    เลือกหมวดหมู่กระทู้ (Post Flair)
                  </div>
                  {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map((type) => {
                    const cfg = POST_TYPE_CONFIG[type];
                    const isSelected = selectedType === type && hasChosenFlair;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedType(type);
                          setHasChosenFlair(true);
                          setIsFlairPickerOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 6,
                          background: isSelected ? cfg.bg : "transparent",
                          border: isSelected ? `1px solid ${cfg.border}` : "1px solid transparent",
                          cursor: "pointer",
                          textAlign: "left"
                        }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {isSelected && <Check size={14} style={{ color: cfg.color }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Optional Image URL Input (Shown when image button clicked) */}
            {showImageInput && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0"
                }}
              >
                <ImageIcon size={16} style={{ color: "#64748b" }} />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="ใส่ Image URL (เช่น https://images.unsplash.com/...)"
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowImageInput(false)}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Post Body (ส่วนเนื้อความ (ไม่บังคับ)) */}
            <div style={{ position: "relative", minHeight: 220, display: "flex", flexDirection: "column" }}>
              <textarea
                ref={textareaRef}
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ส่วนเนื้อความ (ไม่บังคับ)"
                style={{
                  width: "100%",
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "var(--text-primary, #1e293b)",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  padding: "6px 0",
                  boxSizing: "border-box",
                  background: "transparent",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          {/* 4. Reddit Formatting Toolbar (Matching User's Screenshot Exactly) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "10px 18px",
              borderTop: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
              background: "#fafafa",
              flexWrap: "wrap",
              color: "#64748b"
            }}
          >
            <button
              type="button"
              onClick={() => insertFormatting("[", "](https://)")}
              title="Add Link"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <LinkIcon size={16} />
            </button>

            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              title="Attach Image"
              style={{ padding: "6px 8px", background: showImageInput ? "#e2e8f0" : "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <ImageIcon size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("https://youtube.com/watch?v=")}
              title="Attach Video"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Video size={16} />
            </button>

            <span style={{ color: "#cbd5e1", margin: "0 2px" }}>|</span>

            <button
              type="button"
              onClick={() => insertFormatting("**", "**")}
              title="Bold"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Bold size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("*", "*")}
              title="Italic"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Italic size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("~~", "~~")}
              title="Strikethrough"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Strikethrough size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("^")}
              title="Superscript"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Superscript size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("### ")}
              title="Heading"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Type size={16} />
            </button>

            <span style={{ color: "#cbd5e1", margin: "0 2px" }}>|</span>

            <button
              type="button"
              onClick={() => insertFormatting("- ")}
              title="Bulleted List"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <List size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("1. ")}
              title="Numbered List"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <ListOrdered size={16} />
            </button>

            <span style={{ color: "#cbd5e1", margin: "0 2px" }}>|</span>

            <button
              type="button"
              onClick={() => insertFormatting(">! ", " !<")}
              title="Spoiler"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <AlertCircle size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("> ")}
              title="Quote"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Quote size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("```\n", "\n```")}
              title="Code Block"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Code size={16} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("| Column 1 | Column 2 |\n|---|---|\n| Item 1 | Item 2 |\n")}
              title="Table"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <Table size={16} />
            </button>

            <button
              type="button"
              title="More options"
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "inherit", borderRadius: 4 }}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* 5. Bottom Action Buttons Bar (บันทึกฉบับร่าง & โพสต์) */}
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
              background: "#ffffff",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12
            }}
          >
            <button
              type="button"
              onClick={handleSaveDraft}
              style={{
                height: 38,
                padding: "0 20px",
                borderRadius: 9999,
                border: "none",
                background: "#f1f5f9",
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 120ms ease"
              }}
            >
              บันทึกฉบับร่าง
            </button>

            <button
              type="submit"
              disabled={!canPublish}
              style={{
                height: 38,
                padding: "0 24px",
                borderRadius: 9999,
                border: "none",
                background: canPublish ? "#19523c" : "#cbd5e1",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor: canPublish ? "pointer" : "not-allowed",
                boxShadow: canPublish ? "0 2px 6px rgba(25, 82, 60, 0.25)" : "none",
                transition: "all 120ms ease"
              }}
            >
              โพสต์
            </button>
          </div>
        </form>

        {/* Right Column: Posting Guidelines Card (Reddit Sidebar) */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 12,
              background: "#ffffff",
              border: "1px solid var(--border, rgba(0, 0, 0, 0.09))",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#19523c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                }}
              >
                <ShieldCheck size={16} />
              </div>
              <strong style={{ fontSize: 13.5, color: "#0f172a" }}>
                การโพสต์ใน r/HumanoidTH
              </strong>
            </div>

            <ol
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 12,
                lineHeight: 1.6,
                color: "#475569",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <li>
                <strong>ระบุบริบททางวิศวกรรม</strong> เช่น ROS 2 version, มอเตอร์ไดรเวอร์ หรือประเภท Controller ที่ใช้
              </li>
              <li>
                <strong>แบ่งปันโค้ดและโมเดลที่รันซ้ำได้</strong> (Reproducible) พร้อมให้เครดิต License ของ Open-source
              </li>
              <li>
                <strong>คำนึงถึงความปลอดภัย</strong> เมื่อทดสอบแรงดันไฟฟ้าและ Actuator พิกัดสูง
              </li>
              <li>
                <strong>ค้นหากระทู้เดิมก่อน</strong> เพื่อป้องกันการตั้งคำถามซ้ำซ้อน
              </li>
              <li>
                <strong>สุภาพและสร้างสรรค์</strong> ให้เกียรติทั้งผู้เริ่มต้น นักศึกษา และวิจัยอาวุโส
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
