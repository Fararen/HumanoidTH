"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Challenge, KaggleCategory } from "./types";
import {
  Trophy,
  Search,
  Filter,
  CheckCircle2,
  Users,
  FileCheck2,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  Flame,
  Plus,
  MoreVertical
} from "lucide-react";

interface ChallengesClientProps {
  initialChallenges: Challenge[];
}

export default function ChallengesClient({ initialChallenges }: ChallengesClientProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [selectedKaggleCategory, setSelectedKaggleCategory] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"HOTNESS" | "PRIZE" | "TEAMS" | "CLOSING_SOON">("HOTNESS");
  const [viewMode, setViewMode] = useState<"LIST" | "GRID">("GRID");

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    initialChallenges.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [initialChallenges]);

  // Featured challenge for top spotlight
  const featuredChallenge = useMemo(() => {
    return initialChallenges.find((c) => c.kaggleCategory === "Featured") || initialChallenges[0];
  }, [initialChallenges]);

  // Filtering & Sorting
  const filteredChallenges = useMemo(() => {
    return initialChallenges
      .filter((c) => {
        const matchesSearch =
          !search ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
          c.organizer.name.toLowerCase().includes(search.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus =
          activeTab === "ALL" ||
          (activeTab === "ACTIVE" && c.status === "ACTIVE") ||
          (activeTab === "COMPLETED" && c.status === "COMPLETED");

        const matchesCategory =
          selectedKaggleCategory === "ALL" || c.kaggleCategory === selectedKaggleCategory;

        const matchesTag = selectedTag === "ALL" || c.tags.includes(selectedTag);

        return matchesSearch && matchesStatus && matchesCategory && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === "PRIZE") {
          const numA = parseInt(a.prizePool.replace(/[^0-9]/g, "") || "0", 10);
          const numB = parseInt(b.prizePool.replace(/[^0-9]/g, "") || "0", 10);
          return numB - numA;
        }
        if (sortBy === "TEAMS") {
          return b.participantsCount - a.participantsCount;
        }
        if (sortBy === "CLOSING_SOON") {
          return a.schedule.daysRemaining - b.schedule.daysRemaining;
        }
        // HOTNESS (default)
        return b.submissionsCount - a.submissionsCount;
      });
  }, [initialChallenges, search, activeTab, selectedKaggleCategory, selectedTag, sortBy]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        .kaggle-card {
          transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1), border-color 160ms ease !important;
        }
        .kaggle-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.09) !important;
          border-color: rgba(25, 82, 60, 0.35) !important;
        }
        .kaggle-row:hover {
          background: rgba(25, 82, 60, 0.03) !important;
        }
      `}</style>
      {/* 1. Refined Page Header */}
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
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.15
              }}
            >
              Competitions
            </h1>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)"
              }}
            >
              {initialChallenges.length} Active Challenges
            </span>
          </div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--text-secondary)",
              margin: "8px 0 0 0",
              maxWidth: 620
            }}
          >
            Benchmark autonomous control algorithms, solve humanoid robotics challenges, and compete for community prize pools.
          </p>
        </div>

        <button
          type="button"
          style={{
            height: 38,
            padding: "0 18px",
            fontSize: 13,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 8,
            border: "1px solid rgba(25, 82, 60, 0.35)",
            background: "#ffffff",
            color: "#19523c",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            transition: "all 140ms ease"
          }}
          onClick={() => alert("Host Competition: Submit official organizer credentials to publish an authorized robotics challenge.")}
        >
          <Plus size={16} /> Host a Competition
        </button>
      </div>

      {/* 2. Editorial Spotlight Hero Banner (No nested cards, no kickers) */}
      {featuredChallenge && (
        <div
          style={{
            position: "relative",
            background: `linear-gradient(90deg, rgba(13, 38, 29, 0.98) 0%, rgba(15, 45, 34, 0.94) 52%, rgba(15, 45, 34, 0.72) 100%), url('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80') center right / cover no-repeat`,
            borderRadius: 16,
            padding: "30px 34px",
            color: "#ffffff",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 0.8fr)",
            gap: 32,
            alignItems: "center",
            boxShadow: "0 12px 30px rgba(10, 28, 20, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            overflow: "hidden"
          }}
        >
          {/* Left Column: Heading, description, metadata */}
          <div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: "0 0 10px 0",
                color: "#ffffff",
                lineHeight: 1.25,
                letterSpacing: "-0.02em"
              }}
            >
              <Link href={`/challenges/${featuredChallenge.id}`} style={{ color: "#ffffff", textDecoration: "none" }}>
                {featuredChallenge.title}
              </Link>
            </h2>

            <p
              style={{
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.86)",
                lineHeight: 1.6,
                margin: "0 0 18px 0",
                maxWidth: 600
              }}
            >
              {featuredChallenge.shortDescription}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                fontSize: 12.5,
                color: "rgba(255, 255, 255, 0.8)"
              }}
            >
              <span>Hosted by <strong style={{ color: "#ffffff" }}>{featuredChallenge.organizer.name}</strong></span>
              <span>•</span>
              <span style={{ color: "#fde047", fontWeight: 700 }}>{featuredChallenge.schedule.closingText}</span>
              <span>•</span>
              <span>{featuredChallenge.category}</span>
            </div>
          </div>

          {/* Right Column: Un-nested typographic metric & clear CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 8,
              borderLeft: "1px solid rgba(255, 255, 255, 0.16)",
              paddingLeft: 28
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.68)"
              }}
            >
              Total Prize Pool
            </span>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#fde047",
                lineHeight: 1.15
              }}
            >
              {featuredChallenge.prizeDisplay}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: 12
              }}
            >
              {featuredChallenge.participantsCount} teams participating
            </div>

            <Link
              href={`/challenges/${featuredChallenge.id}`}
              style={{
                height: 42,
                padding: "0 22px",
                background: "#ffffff",
                color: "#0e3728",
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 800,
                textAlign: "center",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                transition: "transform 140ms ease, box-shadow 140ms ease"
              }}
            >
              Enter Competition <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Refined Tab Bar: All, Active, Completed & View Toggles */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border, rgba(74, 124, 89, 0.18))",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 6
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "ALL", label: "All Competitions" },
            { id: "ACTIVE", label: "Active" },
            { id: "COMPLETED", label: "Completed" }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "10px 18px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: isSelected ? "#19523c" : "var(--text-secondary, #64748b)",
                  borderBottom: `2.5px solid ${isSelected ? "#19523c" : "transparent"}`,
                  marginBottom: -1,
                  transition: "all 140ms ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* View Switcher: List vs Grid with High Contrast */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 6 }}>
          <button
            type="button"
            onClick={() => setViewMode("LIST")}
            style={{
              height: 32,
              width: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              border: viewMode === "LIST" ? "1px solid #19523c" : "1px solid var(--border, rgba(0,0,0,0.12))",
              background: viewMode === "LIST" ? "#19523c" : "var(--surface, #ffffff)",
              color: viewMode === "LIST" ? "#ffffff" : "var(--text-secondary, #64748b)",
              cursor: "pointer",
              transition: "all 120ms ease"
            }}
            title="Compact Row View"
          >
            <ListIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            style={{
              height: 32,
              width: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              border: viewMode === "GRID" ? "1px solid #19523c" : "1px solid var(--border, rgba(0,0,0,0.12))",
              background: viewMode === "GRID" ? "#19523c" : "var(--surface, #ffffff)",
              color: viewMode === "GRID" ? "#ffffff" : "var(--text-secondary, #64748b)",
              cursor: "pointer",
              transition: "all 120ms ease"
            }}
            title="Card Grid View"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* 4. Kaggle-Style Filter Controls Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, flex: 1 }}>
          {/* Search Input with Kaggle styling */}
          <div style={{ position: "relative", minWidth: 260, flex: "1 1 260px" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search competitions..."
              style={{
                width: "100%",
                paddingLeft: 36,
                height: 36,
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid rgba(74, 124, 89, 0.25)",
                background: "#ffffff"
              }}
            />
          </div>

          {/* Kaggle Categories Dropdown */}
          <select
            value={selectedKaggleCategory}
            onChange={(e) => setSelectedKaggleCategory(e.target.value)}
            style={{
              height: 36,
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid rgba(74, 124, 89, 0.25)",
              background: "#ffffff",
              padding: "0 12px"
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="Featured">Featured</option>
            <option value="Research">Research</option>
            <option value="Community">Community</option>
            <option value="Getting Started">Getting Started</option>
          </select>

          {/* Sort By Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                height: 36,
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid rgba(74, 124, 89, 0.25)",
                background: "#ffffff",
                padding: "0 10px"
              }}
            >
              <option value="HOTNESS">🔥 Hotness</option>
              <option value="PRIZE">💰 Prize Amount</option>
              <option value="TEAMS">👥 Most Teams</option>
              <option value="CLOSING_SOON">⏳ Closing Soon</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>
          {filteredChallenges.length} competitions
        </div>
      </div>

      {/* Quick Tag Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
          Tags:
        </span>
        <button
          type="button"
          onClick={() => setSelectedTag("ALL")}
          style={{
            padding: "3px 10px",
            fontSize: 11.5,
            fontWeight: 700,
            borderRadius: 16,
            border: `1px solid ${selectedTag === "ALL" ? "#19523c" : "rgba(74, 124, 89, 0.2)"}`,
            background: selectedTag === "ALL" ? "#19523c" : "#ffffff",
            color: selectedTag === "ALL" ? "#ffffff" : "var(--text-secondary)",
            cursor: "pointer"
          }}
        >
          All
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelectedTag(selectedTag === t ? "ALL" : t)}
            style={{
              padding: "3px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              borderRadius: 16,
              border: `1px solid ${selectedTag === t ? "#19523c" : "rgba(74, 124, 89, 0.2)"}`,
              background: selectedTag === t ? "#19523c" : "#ffffff",
              color: selectedTag === t ? "#ffffff" : "var(--text-secondary)",
              cursor: "pointer"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 5. Kaggle-Style High-Density List View (Default) */}
      {viewMode === "LIST" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            borderRadius: 10,
            border: "1px solid rgba(74, 124, 89, 0.18)",
            overflow: "hidden"
          }}
        >
          {filteredChallenges.map((item, idx) => {
            const isOfficial = item.type === "OFFICIAL";
            const isLast = idx === filteredChallenges.length - 1;

            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: isLast ? "none" : "1px solid rgba(74, 124, 89, 0.1)",
                  transition: "background 140ms ease"
                }}
                className="kaggle-row"
              >
                {/* Left Thumbnail Emoji Avatar */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    background: item.bannerGradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
                  }}
                >
                  {item.bannerEmoji}
                </div>

                {/* Middle Content */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/challenges/${item.id}`}
                      style={{
                        fontSize: 15.5,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        textDecoration: "none",
                        lineHeight: 1.3
                      }}
                    >
                      {item.title}
                    </Link>
                    {isOfficial ? (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "rgba(25, 82, 60, 0.08)",
                          color: "#19523c",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3
                        }}
                      >
                        <ShieldCheck size={12} /> Official
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "#f1f5f9",
                          color: "#475569"
                        }}
                      >
                        Community
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-secondary)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "90%"
                    }}
                  >
                    {item.shortDescription}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "var(--text-secondary)", flexWrap: "wrap", marginTop: 2 }}>
                    <span>Hosted by <strong style={{ color: "var(--text-primary)" }}>{item.organizer.name}</strong></span>
                    <span>•</span>
                    <span>{item.category}</span>
                    <span>•</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {item.tags.slice(0, 3).map((t) => (
                        <span key={t} style={{ color: "#19523c", fontWeight: 600 }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Prize & Metrics (Kaggle-style numbers) */}
                <div style={{ display: "flex", alignItems: "center", gap: 24, textAlign: "right", flexShrink: 0 }}>
                  <div style={{ minWidth: 110 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: isOfficial ? "#b45309" : "#19523c" }}>
                      {item.prizeDisplay}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 2 }}>
                      {item.participantsCount} teams
                    </div>
                  </div>

                  <div style={{ minWidth: 90 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: item.status === "ACTIVE" ? "#19523c" : "#64748b" }}>
                      {item.schedule.closingText}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      {item.submissionsCount} entries
                    </div>
                  </div>

                  <Link
                    href={`/challenges/${item.id}`}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      border: "1px solid rgba(74, 124, 89, 0.25)",
                      background: "#ffffff",
                      color: "#19523c",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    View <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}

          {!filteredChallenges.length && (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              No competitions found matching your filter criteria.
            </div>
          )}
        </div>
      )}

      {/* 6. Grid View (Kaggle Style Cards) */}
      {viewMode === "GRID" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20
          }}
        >
          {filteredChallenges.map((item) => (
            <div
              key={item.id}
              className="kaggle-card"
              style={{
                background: "var(--surface, #ffffff)",
                border: "1px solid var(--border, rgba(0, 0, 0, 0.09))",
                borderRadius: 16,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                transition: "all 180ms cubic-bezier(0.16, 1, 0.3, 1)",
                position: "relative"
              }}
            >
              {/* Top Banner Image */}
              <div
                style={{
                  position: "relative",
                  height: 120,
                  width: "100%",
                  background: item.bannerGradient
                }}
              >
                {item.thumbnailUrl && (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block"
                    }}
                  />
                )}
              </div>

              {/* Card Body */}
              <div
                style={{
                  padding: "16px 16px 14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1
                }}
              >
                {/* Competition Sub-heading */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--text-secondary, #71717a)",
                    fontSize: 12,
                    fontWeight: 500,
                    marginBottom: 6
                  }}
                >
                  <Trophy size={13} style={{ color: "#71717a" }} />
                  <span>Competition</span>
                </div>

                {/* Title & More Menu */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8
                  }}
                >
                  <Link
                    href={`/challenges/${item.id}`}
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text-primary, #0f172a)",
                      textDecoration: "none",
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: 40
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </Link>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 2,
                      cursor: "pointer",
                      color: "var(--text-secondary, #94a3b8)",
                      display: "flex",
                      alignItems: "center"
                    }}
                    aria-label="More options"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Short Description */}
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-secondary, #64748b)",
                    margin: "4px 0 4px 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  title={item.shortDescription}
                >
                  {item.shortDescription}
                </p>

                {/* Team Count */}
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-secondary, #64748b)",
                    marginTop: 2
                  }}
                >
                  {item.participantsCount} Teams
                </div>

                {/* Footer: Category & Status */}
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: 14,
                    borderTop: "1px solid var(--border, rgba(0, 0, 0, 0.08))",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary, #334155)"
                    }}
                  >
                    {item.kaggleCategory === "Getting Started"
                      ? "Knowledge"
                      : item.kaggleCategory}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-secondary, #64748b)"
                    }}
                  >
                    {item.status === "ACTIVE"
                      ? "Ongoing"
                      : item.status === "COMPLETED"
                      ? "Completed"
                      : "Upcoming"}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {!filteredChallenges.length && (
            <div style={{ gridColumn: "1 / -1", padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              No competitions found matching your filter criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
