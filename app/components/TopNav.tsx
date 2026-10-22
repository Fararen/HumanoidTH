"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SyntheticEvent } from "react";
import { ChevronDown, CircleUserRound, Search } from "lucide-react";
import LanguageSelector from "./LanguageSelector";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[]; adminOnly?: boolean };

export default function TopNav({ currentLang, currentRole }: { currentLang: "en" | "th"; currentRole?: string }) {
  const pathname = usePathname() || "/";
  const isAdmin = currentRole === "ADMIN";
  const groups: NavGroup[] = [
    { label: "Explore", items: [{ href: "/dashboard", label: "Dashboard" }, { href: "/map", label: "Map" }, { href: "/network", label: "Network" }] },
    { label: "Robotics", items: [{ href: "/robots", label: "Robot models" }, { href: "/inventory", label: "Inventory" }] },
    { label: "Insights", items: [{ href: "/perspectives", label: "Perspectives" }, { href: "/analytics", label: "Analytics" }] },
    { label: "Contribute", items: [{ href: "/contributions", label: "Contributions" }, { href: "/submit-data", label: "Submit data" }] },
    { label: "Manage", adminOnly: true, items: [{ href: "/data-pulls", label: "Data pulls" }, { href: "/database", label: "Database" }, { href: "/admin", label: "Admin review" }] }
  ];
  const active = (href: string) => href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const closeOtherMenus = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const currentMenu = event.currentTarget;
    if (!currentMenu.open) return;
    document.querySelectorAll<HTMLDetailsElement>(".top-nav__links details[open]").forEach((menu) => {
      if (menu !== currentMenu) menu.open = false;
    });
  };

  return <header className="top-nav"><div className="top-nav__inner">
    <Link href="/" className="top-nav__brand" aria-label="HumanoidTH home"><img src="/logo.png" alt="" /><span>Humanoid<span>TH</span><small>Thailand Humanoid Research Console</small></span></Link>
    <nav className="top-nav__links" aria-label="Primary navigation"><Link href="/" className={active("/") ? "active" : ""}>Overview</Link>{groups.filter((group) => !group.adminOnly || isAdmin).map((group) => {
      return <details key={group.label} className={group.items.some((item) => active(item.href)) ? "active" : ""} onToggle={closeOtherMenus}><summary>{group.label}<ChevronDown size={14} aria-hidden="true" /></summary><div className="top-nav__menu">{group.items.map((item) => <Link href={item.href} key={item.href} className={active(item.href) ? "active" : ""}>{item.label}</Link>)}</div></details>;
    })}</nav>
    <div className="top-nav__tools"><label className="top-nav__search"><Search size={16} aria-hidden="true" /><input aria-label="Search the atlas" placeholder="Search datasets, models, papers..." /></label><LanguageSelector currentLang={currentLang} /><Link href="/profile" className="top-nav__profile"><CircleUserRound size={18} aria-hidden="true" /><span>Profile</span></Link></div>
  </div></header>;
}
