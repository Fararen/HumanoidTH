"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Challenge } from "./types";
import styles from "./ChallengesClient.module.css";
import { getTranslation, type Language } from "@/lib/translations";
import {
  Trophy,
  Search,
  Calendar,
  Users,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
  List as ListIcon,
  Plus
} from "lucide-react";

interface ChallengesClientProps {
  initialChallenges: Challenge[];
  lang: Language;
}

const thaiChallengeCopy: Record<string, Partial<Pick<Challenge, "shortDescription" | "category">> & { closingText?: string }> = {
  "th-humanoid-nav-2026": {
    shortDescription: "พัฒนาอัลกอริทึม SLAM และการหลบสิ่งกีดขวางแบบไดนามิกสำหรับหุ่นยนต์ฮิวแมนนอยด์ในสภาพแวดล้อมโรงพยาบาลที่ซับซ้อน",
    category: "หุ่นยนต์ฮิวแมนนอยด์",
    closingText: "เหลือเวลา 43 วัน"
  },
  "vision-bin-picking-2026": {
    shortDescription: "แก้โจทย์หยิบชิ้นส่วนอุตสาหกรรมที่ซ้อนกันและสะท้อนแสง ด้วยการรับรู้ RGB-D และการประเมินท่าทางวัตถุ 6 มิติ",
    category: "การจัดการวัตถุด้วยหุ่นยนต์",
    closingText: "เหลือเวลา 38 วัน"
  },
  "diy-robot-gripper-showcase": {
    shortDescription: "นำเสนออุปกรณ์ปลายแขนกลที่สร้างสรรค์ เข้าถึงได้ และผลิตได้ด้วยต้นทุนวัสดุรวมไม่เกิน 100 ดอลลาร์สหรัฐ",
    category: "การออกแบบฮาร์ดแวร์",
    closingText: "เหลือเวลา 53 วัน"
  },
  "mini-walking-gait-sim": {
    shortDescription: "ฝึกนโยบาย reinforcement learning เพื่อควบคุมความมั่นคงของหุ่นยนต์สองขาบนพื้นผิวไม่เรียบใน MuJoCo",
    category: "ปัญญาประดิษฐ์สำหรับหุ่นยนต์",
    closingText: "สิ้นสุดแล้ว"
  }
};

function localizeChallenge(challenge: Challenge, lang: Language) {
  if (lang !== "th") return challenge;
  const copy = thaiChallengeCopy[challenge.id];
  if (!copy) return challenge;
  return {
    ...challenge,
    shortDescription: copy.shortDescription ?? challenge.shortDescription,
    category: copy.category ?? challenge.category,
    schedule: { ...challenge.schedule, closingText: copy.closingText ?? challenge.schedule.closingText }
  };
}

export default function ChallengesClient({ initialChallenges, lang }: ChallengesClientProps) {
  const t = getTranslation(lang);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ACTIVE");
  const [selectedKaggleCategory, setSelectedKaggleCategory] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"HOTNESS" | "PRIZE" | "TEAMS" | "CLOSING_SOON">("HOTNESS");
  const [viewMode, setViewMode] = useState<"LIST" | "GRID">("GRID");
  const [showAllTags, setShowAllTags] = useState(false);

  const activeCount = initialChallenges.filter((challenge) => challenge.status === "ACTIVE").length;
  const completedCount = initialChallenges.filter((challenge) => challenge.status === "COMPLETED").length;

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
  const localizedFeatured = featuredChallenge ? localizeChallenge(featuredChallenge, lang) : undefined;

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
    <div className={styles.page}>
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
        className={styles.pageHeader}
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
              {t.competitionsTitle}
            </h1>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)"
              }}
            >
              {activeCount} {t.competitionsOpen} · {initialChallenges.length} {t.competitionsTotal}
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
            {t.competitionsLead}
          </p>
        </div>

        <Link
          href="/challenges/host"
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
        >
          <Plus size={16} /> {t.hostCompetition}
        </Link>
      </div>

      {/* 2. Editorial Spotlight Hero Banner (No nested cards, no kickers) */}
      {localizedFeatured && (
        <div
          className={`${styles.hero} kaggle-card`}
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
            <span className={styles.heroEyebrow}>{t.featured} · {localizedFeatured.mode.replace(/_/g, " ")}</span>
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
              <Link href={`/challenges/${localizedFeatured.id}`} style={{ color: "#ffffff", textDecoration: "none" }}>
                {localizedFeatured.title}
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
              {localizedFeatured.shortDescription}
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
              <span>{t.hostedBy} <strong style={{ color: "#ffffff" }}>{localizedFeatured.organizer.name}</strong></span>
              <span aria-hidden="true">·</span>
              <span style={{ color: "#fde047", fontWeight: 700 }}>{localizedFeatured.schedule.closingText}</span>
              <span aria-hidden="true">·</span>
              <span>{localizedFeatured.category}</span>
            </div>
          </div>

          {/* Right Column: Un-nested typographic metric & clear CTA */}
          <div
            className={styles.heroMetric}
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
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: "rgba(255, 255, 255, 0.68)"
              }}
            >
              {t.totalPrizePool}
            </span>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#fde047",
                lineHeight: 1.15
              }}
            >
              {localizedFeatured.prizeDisplay}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: 12
              }}
            >
              {localizedFeatured.participantsCount} {t.teamsParticipating}
            </div>

            <Link
              href={`/challenges/${localizedFeatured.id}`}
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
              {t.enterCompetition} <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Refined Tab Bar: All, Active, Completed & View Toggles */}
      <div
        className={styles.tabsBar}
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
            { id: "ALL", label: `${t.allCompetitions} (${initialChallenges.length})` },
            { id: "ACTIVE", label: `${t.openNow} (${activeCount})` },
            { id: "COMPLETED", label: `${t.completed} (${completedCount})` }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                aria-pressed={isSelected}
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
        <div className={styles.viewSwitch}>
          <button
            type="button"
            onClick={() => setViewMode("LIST")}
            aria-pressed={viewMode === "LIST"}
            className={viewMode === "LIST" ? styles.viewSwitchActive : styles.viewSwitchButton}
            style={{
              height: 36,
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
          >
            <ListIcon size={15} aria-hidden="true" /> <span>{t.listView}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            aria-pressed={viewMode === "GRID"}
            className={viewMode === "GRID" ? styles.viewSwitchActive : styles.viewSwitchButton}
            style={{
              height: 36,
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
          >
            <LayoutGrid size={15} aria-hidden="true" /> <span>{t.cardView}</span>
          </button>
        </div>
      </div>

      {/* 4. Kaggle-Style Filter Controls Bar */}
      <div
        className={styles.filters}
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
              placeholder={t.searchCompetitions}
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
            <option value="ALL">{t.allCategories}</option>
            <option value="Featured">{t.featuredCategory}</option>
            <option value="Research">{t.researchCategory}</option>
            <option value="Community">{t.communityCategory}</option>
            <option value="Getting Started">{t.gettingStartedCategory}</option>
          </select>

          {/* Sort By Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{t.sortBy}</span>
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
              <option value="HOTNESS">{t.hotness}</option>
              <option value="PRIZE">{t.prizeAmount}</option>
              <option value="TEAMS">{t.mostTeams}</option>
              <option value="CLOSING_SOON">{t.closingSoon}</option>
            </select>
          </div>
        </div>

        <div aria-live="polite" style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>
          {filteredChallenges.length} {t.competitionsCount}
        </div>
      </div>

      {/* Quick Tag Pills */}
      <div className={styles.tagBar}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
          {t.tags}
        </span>
        <button
          type="button"
          onClick={() => setSelectedTag("ALL")}
          aria-pressed={selectedTag === "ALL"}
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
          {t.allCompetitions}
        </button>
        {allTags.slice(0, showAllTags ? allTags.length : 8).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelectedTag(selectedTag === t ? "ALL" : t)}
            aria-pressed={selectedTag === t}
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
        {allTags.length > 8 && <button type="button" className={styles.moreTags} onClick={() => setShowAllTags((value) => !value)}>{showAllTags ? t.showLess : `+${allTags.length - 8} ${t.more}`}</button>}
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
            const localizedItem = localizeChallenge(item, lang);

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
                className={`${styles.listRow} kaggle-row`}
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
                  <Trophy size={20} style={{ color: "#ffffff" }} />
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
                      {localizedItem.title}
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
                        <ShieldCheck size={12} /> {t.official}
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
                        {t.community}
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
                    {localizedItem.shortDescription}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "var(--text-secondary)", flexWrap: "wrap", marginTop: 2 }}>
                    <span>{t.hostedBy} <strong style={{ color: "var(--text-primary)" }}>{localizedItem.organizer.name}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>{localizedItem.category}</span>
                    <span aria-hidden="true">·</span>
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
                      {item.participantsCount} {t.teams}
                    </div>
                  </div>

                  <div style={{ minWidth: 90 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: item.status === "ACTIVE" ? "#19523c" : "#64748b" }}>
                      {localizedItem.schedule.closingText}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      {item.submissionsCount} {t.entries}
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
                    {t.view} <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}

          {!filteredChallenges.length && (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              {t.noCompetitions}
            </div>
          )}
        </div>
      )}

      {/* 6. Grid View (Kaggle Style Cards) */}
      {viewMode === "GRID" && (
        <div
          className={styles.grid}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20
          }}
        >
          {filteredChallenges.map((item) => {
            const localizedItem = localizeChallenge(item, lang);
            return <div
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
                    alt={localizedItem.title}
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
                  <span>{t.competition}</span>
                </div>

                  {/* Title */}
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
                    title={localizedItem.title}
                  >
                    {localizedItem.title}
                  </Link>
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
                  title={localizedItem.shortDescription}
                >
                  {localizedItem.shortDescription}
                </p>

                <div className={styles.cardMeta}>
                  <span><Users size={14} aria-hidden="true" /> {item.participantsCount} {t.teams}</span>
                  <span><Calendar size={14} aria-hidden="true" /> {localizedItem.schedule.closingText}</span>
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
                    {item.prizeDisplay}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-secondary, #64748b)"
                    }}
                  >
                    {item.status === "ACTIVE"
                      ? t.ongoing
                      : item.status === "COMPLETED"
                      ? t.completed
                      : t.upcoming}
                  </span>
                </div>
              </div>
            </div>;
          })}

          {!filteredChallenges.length && (
            <div style={{ gridColumn: "1 / -1", padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              {t.noCompetitions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
