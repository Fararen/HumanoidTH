"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Challenge, Submission } from "../types";
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Github,
  Video,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  ThumbsUp,
  Database,
  BookOpen,
  ArrowUpRight,
  HelpCircle,
  FileCode,
  Download
} from "lucide-react";

interface ChallengeDetailClientProps {
  challenge: Challenge;
  initialSubmissions: Submission[];
}

export default function ChallengeDetailClient({
  challenge,
  initialSubmissions
}: ChallengeDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "data" | "leaderboard" | "rules">("overview");
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [leaderboardScope, setLeaderboardScope] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  // Submit Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [teamInput, setTeamInput] = useState("");
  const [githubInput, setGithubInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user submissions from localStorage on mount
  useEffect(() => {
    try {
      const storageKey = `humanoidth_submissions_${challenge.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const userSubs: Submission[] = JSON.parse(saved);
        const existingIds = new Set(initialSubmissions.map((s) => s.id));
        const newOnes = userSubs.filter((s) => !existingIds.has(s.id));
        const combined = [...newOnes, ...initialSubmissions].sort((a, b) => b.totalScore - a.totalScore);
        const ranked: Submission[] = combined.map((item, idx) => ({
          ...item,
          rank: idx + 1,
          awardBadge: (idx === 0 ? "GOLD" : idx === 1 ? "SILVER" : idx === 2 ? "BRONZE" : item.awardBadge) as Submission["awardBadge"]
        }));
        setSubmissions(ranked);
      }
    } catch (e) {
      console.error("Failed to load local submissions:", e);
    }
  }, [challenge.id, initialSubmissions]);

  // Handle new submission
  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !teamInput.trim()) return;

    const rubricScores: Record<string, number> = {};
    let calculatedTotal = 0;
    challenge.rubric.forEach((r) => {
      const score = Math.round((r.weight * (0.84 + Math.random() * 0.14)) * 10) / 10;
      rubricScores[r.id] = score;
      calculatedTotal += score;
    });

    const finalScore = Math.round(calculatedTotal * 10) / 10;

    const newSub: Submission = {
      id: `user-sub-${Date.now()}`,
      challengeId: challenge.id,
      rank: 0,
      rankChange: 3,
      teamName: teamInput.trim(),
      teamAvatarEmoji: "🚀",
      title: titleInput.trim(),
      description: descriptionInput.trim() || "No detailed description provided.",
      submittedAt: new Date().toISOString().split("T")[0],
      lastSubmitTime: "just now",
      githubUrl: githubInput.trim() || undefined,
      videoUrl: videoInput.trim() || undefined,
      totalScore: finalScore,
      scoreDisplay: (finalScore / 100).toFixed(4),
      entriesCount: 1,
      rubricScores,
      status: "APPROVED",
      votesCount: 1
    };

    const updated = [newSub, ...submissions].sort((a, b) => b.totalScore - a.totalScore);
    const ranked: Submission[] = updated.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      awardBadge: (idx === 0 ? "GOLD" : idx === 1 ? "SILVER" : idx === 2 ? "BRONZE" : (idx < 5 ? "FINALIST" : undefined)) as Submission["awardBadge"]
    }));

    setSubmissions(ranked);

    try {
      const storageKey = `humanoidth_submissions_${challenge.id}`;
      const saved = localStorage.getItem(storageKey);
      const existing: Submission[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem(storageKey, JSON.stringify([newSub, ...existing]));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }

    setTitleInput("");
    setTeamInput("");
    setGithubInput("");
    setVideoInput("");
    setDescriptionInput("");
    setIsSubmitModalOpen(false);
    setActiveTab("leaderboard");
    setSuccessBanner(`🎉 ยินดีด้วย! ส่งผลงาน "${newSub.title}" สำเร็จ คะแนนพรีวิวอยู่ที่ ${newSub.scoreDisplay} (${newSub.totalScore} pts) และถูกจัดอันดับบน Leaderboard เรียบร้อยแล้ว`);
  };

  const handleVote = (subId: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, votesCount: s.votesCount + 1 } : s))
    );
  };

  const isOfficial = challenge.type === "OFFICIAL";
  const isActive = challenge.status === "ACTIVE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. Breadcrumbs */}
      <div>
        <Link
          href="/challenges"
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
          <ArrowLeft size={14} /> Competitions
        </Link>
      </div>

      {/* 2. Success Banner Notification */}
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
            onClick={() => setSuccessBanner(null)}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "#065f46" }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 3. Kaggle-Authentic Header (Open, Editorial, No Box Wrap) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 32,
          paddingTop: 8,
          paddingBottom: 4
        }}
      >
        {/* Left Column: Title, Subtitle, Metadata & Action */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 700,
              margin: 0,
              color: "var(--text-primary, #0f172a)",
              letterSpacing: "-0.03em",
              lineHeight: 1.2
            }}
          >
            {challenge.title}
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary, #64748b)",
              margin: "10px 0 16px 0",
              lineHeight: 1.55,
              maxWidth: 720
            }}
          >
            {challenge.shortDescription}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
              fontSize: 13,
              color: "var(--text-secondary, #64748b)"
            }}
          >
            <span>Hosted by <strong style={{ color: "var(--text-primary, #1e293b)" }}>{challenge.organizer.name}</strong></span>
            <span>•</span>
            <span><strong>{challenge.participantsCount}</strong> Teams</span>
            <span>•</span>
            <span style={{ color: "#19523c", fontWeight: 600 }}>{challenge.schedule.closingText}</span>
            <span>•</span>
            <span>Prize Pool: <strong style={{ color: "var(--text-primary, #0f172a)" }}>{challenge.prizeDisplay}</strong></span>
          </div>

          <div style={{ marginTop: 20 }}>
            {isActive ? (
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="button primary"
                style={{
                  height: 38,
                  padding: "0 22px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 8,
                  background: "#19523c",
                  color: "#ffffff",
                  boxShadow: "0 2px 6px rgba(25, 82, 60, 0.2)"
                }}
              >
                Submit Prediction / Entry
              </button>
            ) : (
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                Competition Closed
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Kaggle Cover Image Card */}
        {challenge.thumbnailUrl && (
          <div
            style={{
              width: 280,
              height: 120,
              borderRadius: 14,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
              border: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
              background: challenge.bannerGradient
            }}
          >
            <img
              src={challenge.thumbnailUrl}
              alt={challenge.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
            />
          </div>
        )}
      </div>

      {/* 4. Kaggle Minimalist Subnav Tabs */}
      <div
        style={{
          display: "flex",
          gap: 28,
          borderBottom: "1px solid var(--border, rgba(0, 0, 0, 0.12))",
          marginTop: 8
        }}
      >
        {[
          { id: "overview", label: "Overview" },
          { id: "data", label: "Data" },
          { id: "leaderboard", label: `Leaderboard (${submissions.length})` },
          { id: "rules", label: "Rules" }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "8px 0 12px 0",
                fontSize: 14,
                fontWeight: isSelected ? 600 : 400,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: isSelected ? "var(--text-primary, #0f172a)" : "var(--text-secondary, #64748b)",
                borderBottom: isSelected ? "3px solid #19523c" : "3px solid transparent",
                marginBottom: -1,
                transition: "all 120ms ease"
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(300px, 0.8fr)", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Description Section */}
            <div className="panel" style={{ padding: 24, margin: 0 }}>
              <h2 style={{ fontSize: 17, marginBottom: 12 }}>Description</h2>
              <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                {challenge.fullDescription}
              </div>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(74, 124, 89, 0.1)", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {challenge.tags.map((t) => (
                  <span key={t} className="badge" style={{ fontSize: 11.5 }}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Evaluation & Scoring Metric */}
            <div className="panel" style={{ padding: 24, margin: 0 }}>
              <h2 style={{ fontSize: 17, marginBottom: 12 }}>Evaluation Metric</h2>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)", margin: 0 }}>
                Submissions are evaluated on <strong>{challenge.evaluationMetric}</strong>. Teams provide reproducible code repositories and telemetry logs benchmarked against standardized scenario checkpoints.
              </p>
            </div>

            {/* Submission Requirements */}
            <div className="panel" style={{ padding: 24, margin: 0 }}>
              <h2 style={{ fontSize: 17, marginBottom: 12 }}>Submission Requirements Checklist</h2>
              <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--text-primary)" }}>
                {challenge.submissionRequirements.map((req, idx) => (
                  <li key={idx} style={{ lineHeight: 1.5 }}>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Prizes & Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Prizes Card */}
            <div className="panel" style={{ padding: 22, margin: 0 }}>
              <h2 style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Award size={18} style={{ color: "#b45309" }} /> Prizes ({challenge.prizePool})
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {challenge.prizes.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 12px",
                      background: idx === 0 ? "rgba(229, 184, 57, 0.1)" : "#faf8f2",
                      border: `1px solid ${idx === 0 ? "rgba(229, 184, 57, 0.35)" : "rgba(74, 124, 89, 0.12)"}`,
                      borderRadius: 8
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: idx === 0 ? "#b45309" : "var(--text-secondary)", textTransform: "uppercase" }}>
                      {p.place}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, marginTop: 2, color: "var(--text-primary)" }}>
                      {p.reward}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Milestones Card */}
            <div className="panel" style={{ padding: 22, margin: 0 }}>
              <h2 style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Calendar size={18} style={{ color: "#19523c" }} /> Timeline
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6, borderBottom: "1px solid rgba(74, 124, 89, 0.08)" }}>
                  <span className="muted">Registration Deadline:</span>
                  <strong>{challenge.schedule.registrationDeadline}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6, borderBottom: "1px solid rgba(74, 124, 89, 0.08)" }}>
                  <span className="muted">Final Submission:</span>
                  <strong style={{ color: "#b42318" }}>{challenge.schedule.submissionDeadline}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">Results Announced:</span>
                  <strong style={{ color: "#137333" }}>{challenge.schedule.announcementDate}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB: DATA & RESOURCES */}
      {activeTab === "data" && (
        <div className="panel" style={{ padding: 26, margin: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h2 style={{ fontSize: 18, margin: "0 0 6px 0" }}>Dataset & Simulation Environment</h2>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Contestants are provided calibrated robotics sensor logs, URDF meshes, and environment test scenes.
            </p>
          </div>

          <div
            style={{
              padding: "16px 20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FileCode size={24} style={{ color: "#19523c" }} />
              <div>
                <strong style={{ fontSize: 14 }}>Dataset Archive & Benchmark Starter Kit</strong>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {challenge.datasetOverview || "Includes ROS2 bag files, ground truth trajectories, and evaluation scorer."}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert("Starter kit bundle download initiated.")}
              className="button"
              style={{
                height: 36,
                padding: "0 16px",
                fontSize: 12.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Download size={14} /> Download Starter Kit (.zip)
            </button>
          </div>
        </div>
      )}

      {/* 7. TAB: KAGGLE-STYLE LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Leaderboard Header Toolbar: Scope & Description */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              padding: "10px 16px",
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid rgba(74, 124, 89, 0.16)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "inline-flex", background: "rgba(74, 124, 89, 0.08)", padding: 3, borderRadius: 6 }}>
                <button
                  type="button"
                  onClick={() => setLeaderboardScope("PUBLIC")}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: leaderboardScope === "PUBLIC" ? "#19523c" : "transparent",
                    color: leaderboardScope === "PUBLIC" ? "#ffffff" : "var(--text-primary)"
                  }}
                >
                  Public Leaderboard
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardScope("PRIVATE")}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: leaderboardScope === "PRIVATE" ? "#19523c" : "transparent",
                    color: leaderboardScope === "PRIVATE" ? "#ffffff" : "var(--text-primary)"
                  }}
                >
                  Private Leaderboard
                </button>
              </div>

              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {leaderboardScope === "PUBLIC"
                  ? "Provisional scores calculated from 40% validation set."
                  : "Final ranking released at competition deadline."}
              </span>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="button primary"
              style={{ height: 34, fontSize: 12.5 }}
            >
              + Submit Prediction
            </button>
          </div>

          {/* Kaggle Leaderboard High-Density Table */}
          <div className="table-wrap" style={{ background: "#ffffff", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ width: 60, textAlign: "center" }}>#</th>
                  <th style={{ width: 60, textAlign: "center" }}>Δ</th>
                  <th style={{ minWidth: 260 }}>Team</th>
                  <th style={{ width: 140, textAlign: "right" }}>Score</th>
                  <th style={{ width: 100, textAlign: "center" }}>Entries</th>
                  <th style={{ width: 130 }}>Last Submit</th>
                  <th style={{ width: 110, textAlign: "center" }}>Links</th>
                  <th style={{ width: 90, textAlign: "center" }}>Votes</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const isTop1 = sub.rank === 1;
                  const isTop2 = sub.rank === 2;
                  const isTop3 = sub.rank === 3;
                  const isExpanded = expandedSubmissionId === sub.id;
                  const delta = sub.rankChange ?? 0;

                  return (
                    <Fragment key={sub.id}>
                      <tr
                        key={sub.id}
                        style={{
                          background: isTop1
                            ? "rgba(229, 184, 57, 0.08)"
                            : isTop2
                            ? "rgba(100, 116, 139, 0.04)"
                            : isTop3
                            ? "rgba(180, 83, 9, 0.04)"
                            : undefined
                        }}
                      >
                        {/* Rank with Medals */}
                        <td style={{ textAlign: "center" }}>
                          {isTop1 ? (
                            <span style={{ fontSize: 18 }} title="1st Place (Gold Medal)">🥇</span>
                          ) : isTop2 ? (
                            <span style={{ fontSize: 18 }} title="2nd Place (Silver Medal)">🥈</span>
                          ) : isTop3 ? (
                            <span style={{ fontSize: 18 }} title="3rd Place (Bronze Medal)">🥉</span>
                          ) : (
                            <strong style={{ fontSize: 13, color: "var(--text-secondary)" }}>{sub.rank}</strong>
                          )}
                        </td>

                        {/* Rank Delta Indicator (Kaggle-style rank movement) */}
                        <td style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700 }}>
                          {delta > 0 ? (
                            <span style={{ color: "#16a34a" }}>▲ {delta}</span>
                          ) : delta < 0 ? (
                            <span style={{ color: "#dc2626" }}>▼ {Math.abs(delta)}</span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        {/* Team Avatar & Title */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "#f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                flexShrink: 0
                              }}
                            >
                              {sub.teamAvatarEmoji || "🤖"}
                            </div>
                            <div>
                              <strong style={{ fontSize: 13.5, color: "var(--text-primary)", display: "block" }}>
                                {sub.teamName}
                              </strong>
                              <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                                {sub.title}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Score (Formatted Kaggle-style with 4 decimals or metric) */}
                        <td style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 14,
                              fontWeight: 800,
                              color: isTop1 ? "#19523c" : "var(--text-primary)"
                            }}
                          >
                            {sub.scoreDisplay || (sub.totalScore / 100).toFixed(4)}
                          </span>
                        </td>

                        {/* Entries count */}
                        <td style={{ textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>
                          {sub.entriesCount || 1}
                        </td>

                        {/* Last Submit Time */}
                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          {sub.lastSubmitTime || sub.submittedAt}
                        </td>

                        {/* Links */}
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                            {sub.githubUrl && (
                              <a
                                href={sub.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Open GitHub Code"
                                className="button"
                                style={{ height: 26, width: 26, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <Github size={13} />
                              </a>
                            )}
                            {sub.videoUrl && (
                              <a
                                href={sub.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Watch Demo Video"
                                className="button"
                                style={{ height: 26, width: 26, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <Video size={13} />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Votes */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleVote(sub.id)}
                            style={{
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              borderRadius: 4,
                              border: "1px solid rgba(74, 124, 89, 0.2)",
                              background: "#ffffff",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <ThumbsUp size={11} style={{ color: "#19523c" }} /> {sub.votesCount}
                          </button>
                        </td>

                        {/* Expand Accordion */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Rubric Details Row */}
                      {isExpanded && (
                        <tr style={{ background: "#fbfaf7" }}>
                          <td colSpan={9} style={{ padding: "14px 24px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--text-primary)" }}>
                                {sub.description}
                              </p>

                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                {challenge.rubric.map((r) => {
                                  const score = sub.rubricScores[r.id] ?? "-";
                                  return (
                                    <div
                                      key={r.id}
                                      style={{
                                        padding: "4px 10px",
                                        background: "#ffffff",
                                        border: "1px solid rgba(74, 124, 89, 0.18)",
                                        borderRadius: 6,
                                        fontSize: 11.5
                                      }}
                                    >
                                      <span className="muted">{r.name}:</span>{" "}
                                      <strong style={{ color: "#19523c" }}>{score} pts</strong>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. TAB: RULES */}
      {activeTab === "rules" && (
        <div className="panel" style={{ padding: 26, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Competition Rules</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {challenge.rules.map((rule, idx) => (
              <div key={idx} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 800, color: "#19523c" }}>{idx + 1}.</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. SUBMIT ENTRY MODAL (KAGGLE STYLE) */}
      {mounted && isSubmitModalOpen && createPortal(
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
          onClick={() => setIsSubmitModalOpen(false)}
        >
          <div
            className="panel"
            style={{
              maxWidth: 580,
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: 26,
              position: "relative",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              zIndex: 100000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              style={{
                position: "absolute",
                right: 18,
                top: 18,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 4
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Send size={20} style={{ color: "#19523c" }} />
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Make a Submission</h2>
                <span className="muted" style={{ fontSize: 12 }}>
                  {challenge.title}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitEntry} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label>
                Submission Title *
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Robust SLAM with Dual LiDAR & Trajectory Smoother"
                  style={{ width: "100%", height: 36, marginTop: 4 }}
                />
              </label>

              <label>
                Team / Participant Name *
                <input
                  type="text"
                  required
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  placeholder="e.g. RoboTech KMUTT Team"
                  style={{ width: "100%", height: 36, marginTop: 4 }}
                />
              </label>

              <label>
                Public GitHub Repository URL
                <input
                  type="url"
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  placeholder="https://github.com/your-username/your-robotics-repo"
                  style={{ width: "100%", height: 36, marginTop: 4 }}
                />
              </label>

              <label>
                Demo Video / Simulation URL (YouTube, Vimeo, Drive)
                <input
                  type="url"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  placeholder="https://youtu.be/..."
                  style={{ width: "100%", height: 36, marginTop: 4 }}
                />
              </label>

              <label>
                Technical Abstract & Description *
                <textarea
                  rows={4}
                  required
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Describe your algorithm architecture, simulation parameters, and key innovations..."
                  style={{ width: "100%", marginTop: 4, padding: 8 }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="button"
                  style={{ height: 36 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button primary"
                  style={{ height: 36, padding: "0 20px" }}
                >
                  Submit Prediction
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
