"use client";

import Link from "next/link";
import { CircleUserRound, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import type { SyntheticEvent } from "react";
import LanguageSelector from "./LanguageSelector";
import GlobalSearch from "./GlobalSearch";

type Props = { currentLang: "en" | "th"; currentRole?: string; currentEmail?: string };

export default function TopNav({ currentLang, currentRole, currentEmail }: Props) {
  const pathname = usePathname() || "/";
  const th = currentLang === "th";
  const label = th ? {
    overview: "ภาพรวม", companyLeaderboard: "ตารางอันดับบริษัท (M02)", submitModel: "ส่งรุ่นประเมิน (Company Portal)", dashboard: "แดชบอร์ด",
    robots: "รุ่นหุ่นยนต์", database: "ฐานข้อมูลหลักฐาน", map: "แผนที่ระบบนิเวศ", network: "กราฟความรู้",
    analytics: "การวิเคราะห์", perspectives: "มุมมองงานวิจัย", contributions: "ผู้ร่วมพัฒนา", submitData: "ส่งข้อมูล", inventory: "คลังหุ่นยนต์",
    dataPulls: "ดึงข้อมูล", reviewQueue: "คิวตรวจสอบ", profile: "โปรไฟล์", signUp: "สมัครสมาชิก"
  } : {
    overview: "Overview", companyLeaderboard: "Company Leaderboard", submitModel: "Submit Company Model", dashboard: "Dashboard",
    robots: "Robot models", database: "Evidence database", map: "Ecosystem map", network: "Knowledge graph",
    analytics: "Analytics", perspectives: "Research perspectives", contributions: "Contributors", submitData: "Submit data", inventory: "Robot inventory",
    dataPulls: "Data pulls", reviewQueue: "Review queue", profile: "Profile", signUp: "Sign up"
  };
  const isActive = (href: string) => href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const groupIsActive = (links: string[]) => links.some(isActive);
  const workspace = ["/", "/leaderboards/company", "/company/models", "/ops/company"];
  const dashboard = ["/dashboard", "/analytics"];
  const explore = ["/robots", "/database", "/map", "/network"];
  const community = ["/community", "/challenges", "/perspectives", "/contributions", "/submit-data", "/inventory"];
  const canManageCompany = currentRole === "COMPANY" || currentRole === "ADMIN";
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
      <details className={groupIsActive(workspace) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "พื้นที่ทำงาน" : "Workspace"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/" className={isActive("/") ? "active" : ""}>{label.overview}</Link><Link href="/me">{th ? "พื้นที่ของฉัน" : "My workspace"}</Link><Link href="/learn">{th ? "เรียนหุ่นยนต์" : "Learn"}</Link><Link href="/evaluate">{th ? "ประเมินหุ่น" : "Evaluate"}</Link><Link href="/leaderboards">{th ? "ตารางอันดับทั้งหมด" : "All leaderboards"}</Link><Link href="/company/portal">Company workspace</Link><Link href="/leaderboards/company/industrial-pick-place" className={isActive("/leaderboards/company") ? "active" : ""}>{label.companyLeaderboard}</Link>{canManageCompany && <Link href="/company/models/new" className={isActive("/company/models") ? "active" : ""}>{label.submitModel}</Link>}</div></details>
      <details className={groupIsActive(dashboard) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "แดชบอร์ด" : "Dashboard"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/dashboard" className={isActive("/dashboard") ? "active" : ""}>{label.dashboard}</Link><Link href="/analytics" className={isActive("/analytics") ? "active" : ""}>{label.analytics}</Link></div></details>
      <details className={groupIsActive(explore) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "สำรวจข้อมูล" : "Explore"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/robots" className={isActive("/robots") ? "active" : ""}>{label.robots}</Link><Link href="/database" className={isActive("/database") ? "active" : ""}>{label.database}</Link><Link href="/map" className={isActive("/map") ? "active" : ""}>{label.map}</Link><Link href="/network" className={isActive("/network") ? "active" : ""}>{label.network}</Link></div></details>
      <details className={groupIsActive(community) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "ชุมชนและข้อมูล" : "Community"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/community" className={isActive("/community") ? "active" : ""}>{th ? "ชุมชน" : "Community"}</Link><Link href="/competitions" className={isActive("/competitions") ? "active" : ""}>{th ? "การแข่งขัน" : "Challenges"}</Link><Link href="/perspectives" className={isActive("/perspectives") ? "active" : ""}>{label.perspectives}</Link><Link href="/contributions" className={isActive("/contributions") ? "active" : ""}>{label.contributions}</Link><Link href="/submit-data" className={isActive("/submit-data") ? "active" : ""}>{label.submitData}</Link><Link href="/inventory" className={isActive("/inventory") ? "active" : ""}>{label.inventory}</Link></div></details>
      {currentRole === "ADMIN" && <details className={groupIsActive(["/data-pulls", "/admin"]) ? "active" : ""} onToggle={closeSiblingMenus}><summary>{th ? "ผู้ดูแล" : "Admin"}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu"><Link href="/data-pulls" className={isActive("/data-pulls") ? "active" : ""}>{label.dataPulls}</Link><Link href="/admin" className={isActive("/admin") ? "active" : ""}>{label.reviewQueue}</Link></div></details>}
    </nav>
    <GlobalSearch lang={currentLang} />
    <div className="top-nav__tools"><LanguageSelector currentLang={currentLang} /><Link href={currentEmail ? "/profile" : "/register"} className="top-nav__profile"><CircleUserRound size={18} aria-hidden="true" /><span>{currentEmail ? label.profile : label.signUp}</span></Link></div>
  </div></header>;
}
