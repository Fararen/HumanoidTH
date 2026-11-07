import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ensureM02Seeded,
  serializeCompanyModel
} from "@/lib/company-leaderboard";
import CompanyProductProfileClient from "./CompanyProductProfileClient";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  Database,
  ExternalLink,
  MapPin,
  Play
} from "lucide-react";

export const dynamic = "force-dynamic";

const pretty = (value: string | null | undefined) =>
  value ? value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "—";

export default async function RobotProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, cookieStore] = await Promise.all([params, cookies()]);
  const th = cookieStore.get("lang")?.value === "th";

  // 1. Check if `:id` matches an M02 Company Leaderboard Product Evaluation (`:productId`)
  try {
    await ensureM02Seeded();
    const companyEval = await prisma.companyModelEvaluation.findFirst({
      where: {
        OR: [{ id }, { modelCode: id }]
      }
    });
    if (companyEval) {
      return <CompanyProductProfileClient model={serializeCompanyModel(companyEval)} />;
    }
  } catch (err) {
    console.warn("CompanyModelEvaluation lookup skipped:", err);
  }

  // 2. Otherwise load standard HumanoidTH Atlas RobotModel
  let robot;
  let evidence: Array<{ id: string; title: string; url: string; platform: string | null; excerpt: string }> = [];
  try {
    robot = await prisma.robotModel.findUnique({
      where: { id },
      include: {
        inventory: { where: { visibility: "public" }, select: { id: true, locationLabel: true, displayName: true } },
        contributions: {
          where: { visibility: "public" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, contributionType: true, contributorName: true, sourceUrl: true }
        }
      }
    });
    if (robot) {
      evidence = await prisma.sourceRecord.findMany({
        where: {
          OR: [
            { title: { contains: robot.canonicalName, mode: "insensitive" } },
            { excerpt: { contains: robot.canonicalName, mode: "insensitive" } }
          ]
        },
        orderBy: [{ relevanceConfidence: "desc" }, { updatedAt: "desc" }],
        take: 8,
        select: { id: true, title: true, url: true, platform: true, excerpt: true }
      });
    }
  } catch (error) {
    console.error("Robot profile query failed:", error);
    return (
      <div className="robot-profile__offline">
        <strong>{th ? "โหลดข้อมูลไม่ได้ชั่วคราว" : "Robot profile is temporarily unavailable"}</strong>
        <p>{th ? "กรุณาลองใหม่อีกครั้งเมื่อฐานข้อมูลพร้อมใช้งาน" : "Please try again when the research database is available."}</p>
        <Link href="/robots">{th ? "กลับไปทะเบียนหุ่นยนต์" : "Back to robot registry"}</Link>
      </div>
    );
  }
  if (!robot) notFound();

  const locations = [
    ...new Set(robot.inventory.map((item) => item.locationLabel?.trim()).filter((value): value is string => Boolean(value)))
  ];
  const fields = [
    { label: th ? "ผู้ผลิต" : "Manufacturer", value: robot.manufacturer },
    { label: th ? "ผู้พัฒนา" : "Developer organization", value: robot.developerOrg },
    { label: th ? "ประเทศต้นกำเนิด" : "Country of origin", value: robot.countryOfOrigin },
    { label: th ? "รูปแบบการใช้งาน" : "Primary use case", value: robot.primaryUseCase },
    { label: th ? "ระดับ Embodiment" : "Embodiment level", value: robot.embodimentLevel ? pretty(robot.embodimentLevel) : null },
    { label: th ? "บันทึกครั้งแรก" : "First recorded", value: robot.firstSeenYear?.toString() ?? null }
  ];

  return (
    <div className="robot-profile">
      <Link className="robot-profile__back" href="/robots">
        <ArrowLeft size={15} />
        {th ? "กลับไปทะเบียนหุ่นยนต์" : "Robot model registry"}
      </Link>
      <header className="robot-profile__hero">
        <div className="robot-profile__hero-copy">
          <h1>{robot.canonicalName}</h1>
          <p>{robot.description || (th ? "ยังไม่มีคำอธิบายสำหรับโมเดลนี้" : "No description has been added for this robot model yet.")}</p>
          <div className="robot-profile__badges" style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span>
              <CheckCircle2 size={14} />
              {pretty(robot.thailandStatus)}
            </span>
            <span>{pretty(robot.robotType)}</span>
            <Link
              href={`/robots/${robot.id}/hri-lab`}
              style={{
                alignItems: "center",
                background: "#244e39",
                borderRadius: "8px",
                color: "#ffffff",
                display: "inline-flex",
                fontSize: "12.5px",
                fontWeight: 750,
                gap: "6px",
                padding: "7px 14px",
                textDecoration: "none"
              }}
            >
              <Play size={13} />
              {th ? "ทดลอง HRI (จุดต้อนรับศูนย์สุขภาวะ)" : "ทดลอง HRI · Launch Living Lab"}
            </Link>
          </div>
        </div>
        <div className="robot-profile__hero-mark">
          <Bot size={84} strokeWidth={1.1} />
          <span>HumanoidTH Registry</span>
        </div>
      </header>
      <div className="robot-profile__layout">
        <div className="robot-profile__main">
          <section className="robot-profile__section">
            <div className="robot-profile__section-heading">
              <h2>{th ? "ข้อมูลจำเพาะของรุ่น" : "Model specifications"}</h2>
            </div>
            <dl className="robot-profile__spec-grid">
              {fields.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="robot-profile__section">
            <div className="robot-profile__section-heading">
              <h2>{th ? "แหล่งข้อมูลและงานวิจัยที่เชื่อมโยง" : "Sources & linked research"}</h2>
              <span className="robot-profile__count">{evidence.length}</span>
            </div>
            {evidence.length ? (
              <div className="robot-profile__evidence">
                {evidence.map((source) => (
                  <a href={source.url} key={source.id} rel="noopener noreferrer" target="_blank">
                    <span className="robot-profile__source-icon">
                      <Database size={17} />
                    </span>
                    <span>
                      <strong>{source.title}</strong>
                      <small>{source.platform || "Research source"}</small>
                      {source.excerpt && <p>{source.excerpt}</p>}
                    </span>
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="robot-profile__empty">
                {th ? "ยังไม่มีหลักฐานที่เชื่อมโยงโดยตรง" : "No directly linked evidence has been added yet."}{" "}
                <Link href={`/database?table=sources&q=${encodeURIComponent(robot.canonicalName)}`}>
                  {th ? "ค้นหาในฐานข้อมูล" : "Search all sources"}
                </Link>
              </p>
            )}
          </section>
          {robot.contributions.length > 0 && (
            <section className="robot-profile__section">
              <div className="robot-profile__section-heading">
                <h2>{th ? "ข้อมูลการมีส่วนร่วมจากชุมชน" : "Community contributions"}</h2>
              </div>
              <div className="robot-profile__contributions">
                {robot.contributions.map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    <span>
                      {pretty(item.contributionType)}
                      {item.contributorName ? ` · ${item.contributorName}` : ""}
                    </span>
                    {item.sourceUrl && (
                      <a href={item.sourceUrl} rel="noopener noreferrer" target="_blank">
                        {th ? "เปิดแหล่งข้อมูล" : "Open source"}
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="robot-profile__aside">
          <section className="robot-profile__section">
            <div className="robot-profile__section-heading">
              <h2>{th ? "สถานที่สาธารณะในประเทศไทย" : "Public locations in Thailand"}</h2>
              <MapPin size={17} />
            </div>
            {locations.length ? (
              <ul className="robot-profile__locations">
                {locations.map((location) => (
                  <li key={location}>
                    <MapPin size={14} />
                    {location}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="robot-profile__empty">
                {th ? "ยังไม่มีสถานที่สาธารณะที่ยืนยันได้" : "No public deployment location is linked yet."}
              </p>
            )}
            <div className="robot-profile__presence-stats">
              <strong>{robot.inventory.length}</strong>
              <span>{th ? "รายการสาธารณะ" : `public ${robot.inventory.length === 1 ? "record" : "records"}`}</span>
            </div>
          </section>
          <section className="robot-profile__section robot-profile__source-card">
            <div className="robot-profile__section-heading">
              <h2>{th ? "แหล่งข้อมูลทางการ" : "Official source"}</h2>
              <Building2 size={17} />
            </div>
            {robot.officialUrl ? (
              <a className="robot-profile__official-link" href={robot.officialUrl} rel="noopener noreferrer" target="_blank">
                {th ? "เว็บไซต์ผู้พัฒนา" : "Developer website"}
                <ArrowUpRight size={14} />
              </a>
            ) : (
              <p className="robot-profile__empty">{th ? "ยังไม่มีลิงก์ทางการ" : "No official link provided."}</p>
            )}
            <span className="robot-profile__updated">
              <CalendarDays size={13} />
              {th ? "อัปเดตเมื่อ " : "Updated "}
              {new Intl.DateTimeFormat(th ? "th-TH" : "en", { dateStyle: "medium" }).format(robot.updatedAt)}
            </span>
          </section>
        </aside>
      </div>
    </div>
  );
}
