"use client";

import Link from "next/link";
import { CircleUserRound, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import type { SyntheticEvent } from "react";
import LanguageSelector from "./LanguageSelector";
import GlobalSearch from "./GlobalSearch";

type Props = { currentLang: "en" | "th"; currentRole?: string };

export default function TopNav({ currentLang, currentRole }: Props) {
  const pathname = usePathname() || "/";
  const th = currentLang === "th";
  const isActive = (href: string) => href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const groupIsActive = (links: string[]) => links.some(isActive);
  const workspace = ["/", "/dashboard"];
  const explore = ["/robots", "/database", "/map", "/network"];
  const community = ["/community", "/challenges", "/analytics", "/perspectives", "/contributions", "/submit-data", "/inventory"];
  const closeSiblingMenus = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const currentMenu = event.currentTarget;
    if (!currentMenu.open) return;

    currentMenu.parentElement?.querySelectorAll("details[open]").forEach((menu) => {
      if (menu !== currentMenu) menu.removeAttribute("open");
    });
  };

  return <header className="top-nav"><div className="top-nav__inner">
    <Link href="/" className="top-nav__brand" aria-label="HumanoidTH home"><img src="/logo.png" alt="" /></Link>
    <nav className="top-nav__links" aria-label={th ? "เมนูหลัก" : "Primary navigation"}>
      <details className={groupIsActive(workspace) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "พื้นที่ทำงาน" : "Workspace"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/" className={isActive("/") ? "active" : ""}>Overview</Link><Link href="/#leaderboard">Leaderboard</Link><Link href="/dashboard" className={isActive("/dashboard") ? "active" : ""}>Dashboard</Link></div></details>
      <details className={groupIsActive(explore) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "สำรวจข้อมูล" : "Explore"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/robots" className={isActive("/robots") ? "active" : ""}>Robot models</Link><Link href="/database" className={isActive("/database") ? "active" : ""}>Evidence database</Link><Link href="/map" className={isActive("/map") ? "active" : ""}>Ecosystem map</Link><Link href="/network" className={isActive("/network") ? "active" : ""}>Knowledge graph</Link></div></details>
      <details className={groupIsActive(community) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "ข้อมูลเชิงลึก" : "Insights"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/community" className={isActive("/community") ? "active" : ""}>{th ? "ชุมชน" : "Community"}</Link><Link href="/challenges" className={isActive("/challenges") ? "active" : ""}>{th ? "การแข่งขัน" : "Challenges"}</Link><Link href="/analytics" className={isActive("/analytics") ? "active" : ""}>Analytics</Link><Link href="/perspectives" className={isActive("/perspectives") ? "active" : ""}>Research perspectives</Link><Link href="/contributions" className={isActive("/contributions") ? "active" : ""}>Contributors</Link><Link href="/submit-data" className={isActive("/submit-data") ? "active" : ""}>Submit data</Link><Link href="/inventory" className={isActive("/inventory") ? "active" : ""}>Robot inventory</Link></div></details>
      {currentRole === "ADMIN" && <details className={groupIsActive(["/data-pulls", "/admin"]) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "ผู้ดูแล" : "Admin"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/data-pulls" className={isActive("/data-pulls") ? "active" : ""}>Data pulls</Link><Link href="/admin" className={isActive("/admin") ? "active" : ""}>Review queue</Link></div></details>}
    </nav>
    <GlobalSearch lang={currentLang} />
    <div className="top-nav__tools"><LanguageSelector currentLang={currentLang} /><Link href="/profile" className="top-nav__profile"><CircleUserRound size={18} aria-hidden="true" /><span>{currentLang === "th" ? "โปรไฟล์" : "Profile"}</span></Link></div>
  </div></header>;
}
