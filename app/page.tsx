import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import RobotViewer from "./components/RobotViewer";
import { Bot, Box, CheckCircle2, ClipboardCheck, Database, FileSearch, Globe2, Inbox, Network, Send, UsersRound } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "HumanoidTH - Thailand Humanoid Research Console", description: "Open data for Thailand's humanoid, social, and service robotics ecosystem.", alternates: { canonical: "/" } };

const humanize = (value: string | null) => (value || "Unknown").replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function OverviewPage() {
  const role = (await cookies()).get("user_role")?.value;
  const isAdmin = role === "ADMIN";
  let offline = false;
  let metrics = { sources: 0, accepted: 0, robots: 0, inventory: 0, contributions: 0, review: 0, coverage: "No dated records", run: "No active runs" };
  let platforms: Array<{ platform: string | null; _count: { _all: number } }> = [];

  try {
    const [sources, accepted, robots, inventory, contributions, review, groupedPlatforms, range, latestRun] = await Promise.all([
      prisma.sourceRecord.count(), prisma.sourceRecord.count({ where: { relevanceStatus: "ACCEPTED" } }), prisma.robotModel.count(), prisma.ownedInventory.count(), prisma.contribution.count(), prisma.submittedData.count({ where: { status: { in: ["QUEUED", "NEEDS_REVIEW"] } } }), prisma.sourceRecord.groupBy({ by: ["platform"], _count: { _all: true } }), prisma.sourceRecord.aggregate({ _min: { publishedAt: true }, _max: { publishedAt: true } }), prisma.pipelineRun.findFirst({ orderBy: { startedAt: "desc" } })
    ]);
    metrics = { sources, accepted, robots, inventory, contributions, review, coverage: range._min.publishedAt && range._max.publishedAt ? `${range._min.publishedAt.getFullYear()} - ${range._max.publishedAt.getFullYear()}` : "No dated records", run: latestRun ? `${humanize(latestRun.status)} - ${latestRun.pipelineName}` : "No active runs" };
    platforms = groupedPlatforms.sort((a, b) => b._count._all - a._count._all);
  } catch { offline = true; }

  const findPlatform = (name: string) => platforms.find((item) => item.platform?.toLowerCase() === name)?._count._all ?? 0;
  const majorPlatforms = [{ label: "OpenAlex", value: findPlatform("openalex"), caption: "Academic papers", icon: FileSearch }, { label: "GitHub", value: findPlatform("github"), caption: "Code repositories", icon: Network }, { label: "YouTube", value: findPlatform("youtube"), caption: "Videos", icon: Globe2 }];
  const remaining = Math.max(0, platforms.reduce((sum, item) => sum + item._count._all, 0) - majorPlatforms.reduce((sum, item) => sum + item.value, 0));
  const kpis = [{ label: "Total sources", value: metrics.sources, detail: `${metrics.accepted.toLocaleString()} accepted`, icon: Database }, { label: "Robot models", value: metrics.robots, detail: "Registered models", icon: Bot }, { label: "Owned units", value: metrics.inventory, detail: "Public-safe inventory", icon: Box }, { label: "Contributors", value: metrics.contributions, detail: "Repos and papers", icon: UsersRound }];

  return <div className="overview-page">
    {offline && <div className="state-banner state-banner--warning"><strong>Live database unavailable.</strong> Metrics are not replaced with demo data.</div>}
    <section className="overview-hero">
      <div className="overview-copy"><span className="eyebrow">Open data. Brighter robotics for Thailand.</span><h1>Humanoid<span>TH</span></h1><p className="overview-title">Thailand Humanoid Research Console</p><p>A unified research home for robot models, evidence, publications, and community contributions across Thailand&apos;s embodied AI ecosystem.</p><div className="overview-status"><CheckCircle2 size={16} aria-hidden="true" />{offline ? "Live connection needs attention" : "Live database connected"}</div></div>
      <div className="mascot-stage" aria-label="Interactive humanoid robot model"><div className="mascot-grid" /><RobotViewer /></div>
      <section className="platform-panel" aria-labelledby="platform-heading"><div className="section-heading"><div><span className="eyebrow">Data coverage</span><h2 id="platform-heading">Ingestion origin</h2></div><Link href="/database?table=sources">View all</Link></div><div className="platform-list">{majorPlatforms.map(({ label, value, caption, icon: Icon }) => <Link href="/database?table=sources" className="origin-card" key={label}><span className="origin-icon"><Icon size={18} /></span><span><strong>{label}</strong><b>{value.toLocaleString()}</b><small>{caption}</small></span></Link>)}<div className="origin-summary"><span>Other grouped origins</span><strong>{remaining.toLocaleString()}</strong><small>Institutional, news, and community sources</small></div></div></section>
      <div className="hero-kpis">{kpis.map(({ label, value, detail, icon: Icon }) => <Link href={label === "Robot models" ? "/robots" : "/database"} className="overview-kpi" key={label}><span><Icon size={19} /></span><div><small>{label}</small><strong>{value.toLocaleString()}</strong><em>{detail}</em></div></Link>)}</div>
    </section>
    <section className="quick-actions" aria-label="Quick actions"><div className="quick-action-header"><div><span className="eyebrow">Start here</span><h2>Choose your next task</h2></div><span className="role-pill">{isAdmin ? "Admin workspace" : "Public workspace"}</span></div><div className="quick-action-grid"><Action href="/data-pulls" title="Run data pull" description="Fetch and review new public sources." icon={Inbox} restricted={!isAdmin} /><Action href="/database" title="Browse database" description="Explore sources, models, and linked evidence." icon={Database} /><Action href="/submit-data" title="Submit a record" description="Share a model, source, or correction for review." icon={Send} /><Action href="/admin" title={`Review queue${metrics.review ? ` (${metrics.review})` : ""}`} description="Validate incoming community records." icon={ClipboardCheck} restricted={!isAdmin} /></div></section>
    <section className="overview-detail-grid"><article className="surface-card"><span className="eyebrow">Pipeline status</span><h2>{metrics.run}</h2><p>Ingestion and review activity is tracked separately from public records.</p></article><article className="surface-card"><span className="eyebrow">Temporal coverage</span><h2>{metrics.coverage}</h2><p>Publication dates for available source evidence.</p></article></section>
  </div>;
}

function Action({ href, title, description, icon: Icon, restricted = false }: { href: string; title: string; description: string; icon: typeof Inbox; restricted?: boolean }) {
  return <Link className={`quick-action${restricted ? " quick-action--restricted" : ""}`} href={href}><span><Icon size={20} /></span><div><strong>{title}</strong><p>{description}</p>{restricted && <small>Admin access required</small>}</div></Link>;
}
