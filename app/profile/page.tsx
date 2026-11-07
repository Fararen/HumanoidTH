import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { loginAsUser, logoutUser } from "@/app/actions";
import { getTranslation } from "@/lib/translations";
import { ArrowRight, Award, BadgeCheck, Bot, Building2, CircleHelp, Clock3, Database, ExternalLink, ShieldCheck, UserRound, Users } from "lucide-react";
import styles from "./Profile.module.css";
import RegisterAccountForm from "./RegisterAccountForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Profile",
  robots: { index: false, follow: false }
};

const reviewStatuses = ["QUEUED", "NEEDS_REVIEW", "ANALYZED", "FETCHING"];

function statusClass(status: string) {
  if (status === "APPROVED") return styles.statusApproved;
  if (["REJECTED", "FAILED"].includes(status)) return styles.statusRejected;
  return styles.statusReview;
}

function workflowProgress(status: string) {
  if (status === "APPROVED") return 4;
  if (["NEEDS_REVIEW", "ANALYZED"].includes(status)) return 3;
  if (["FETCHING", "FAILED"].includes(status)) return 2;
  if (status === "REJECTED") return 3;
  return 1;
}

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const currentEmail = cookieStore.get("user_email")?.value;
  const currentRole = cookieStore.get("user_role")?.value || "USER";
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "th";
  const t = getTranslation(lang);

  let users: Array<{ id: string; name: string | null; email: string; role: string; createdAt: Date }> = [];
  let currentUser: { name: string | null; email: string; role: string; createdAt: Date; submissions: Array<{ id: string; title: string; url: string | null; submissionType: string; status: string; reviewNotes: string | null; notes: string | null; createdAt: Date }>; companyMemberships: Array<{ role: string; company: { name: string; isVerified: boolean } }> } | null = null;
  let databaseOffline = false;

  try {
    const [userList, account] = await Promise.all([
      currentRole === "ADMIN" ? prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, name: true, email: true, role: true, createdAt: true } }) : Promise.resolve([]),
      currentEmail ? prisma.user.findUnique({ where: { email: currentEmail }, include: { submissions: { orderBy: { createdAt: "desc" }, take: 50 }, companyMemberships: { include: { company: true }, take: 1 } } }) : Promise.resolve(null)
    ]);
    users = userList;
    currentUser = account ? { name: account.name, email: account.email, role: account.role, createdAt: account.createdAt, submissions: account.submissions, companyMemberships: account.companyMemberships } : null;
  } catch (error) {
    console.error("Failed to query profile data:", error);
    databaseOffline = true;
  }

  const submissions = currentUser?.submissions ?? [];
  const approved = submissions.filter((item) => item.status === "APPROVED").length;
  const approvedShowcase = submissions.filter((item) => item.status === "APPROVED").slice(0, 3);
  const inReview = submissions.filter((item) => reviewStatuses.includes(item.status)).length;
  const displayName = currentUser?.name || currentUser?.email.split("@")[0] || "Atlas member";
  const activeRole = currentUser?.role || currentRole;
  const companyMembership = currentUser?.companyMemberships[0];
  const showcaseCopy = lang === "th" ? {
    eyebrow: "ผลงานใน ATLAS",
    title: "Contribution showcase",
    description: "รายการที่ผ่านการอนุมัติและเผยแพร่แล้ว",
    approved: "เผยแพร่แล้ว",
    emptyTitle: "ผลงานแรกของคุณจะแสดงที่นี่",
    emptyDescription: "เมื่อรายการผ่านการตรวจทานและอนุมัติ ระบบจะแสดงหลักฐานที่เผยแพร่แล้วในส่วนนี้",
    source: "เปิดหลักฐาน",
    add: "ส่งผลงาน"
  } : {
    eyebrow: "ATLAS CONTRIBUTIONS",
    title: "Contribution showcase",
    description: "Approved work published to the public atlas.",
    approved: "published records",
    emptyTitle: "Your first published record will appear here",
    emptyDescription: "Once a submission is reviewed and approved, its public evidence link will be featured here.",
    source: "View evidence",
    add: "Add a contribution"
  };

  return <div className={styles.profilePage}>
    <header className={styles.pageHeading}>
      <div><span className={styles.kicker}>HUMANOIDTH ACCOUNT</span><h1>{t.profileTitle}</h1><p>{t.profileDesc}</p></div>
      <Link className={styles.headingLink} href="/submit-data">Contribute to the atlas <ArrowRight size={16} aria-hidden="true" /></Link>
    </header>

    {databaseOffline && <div className={styles.warning} role="status">Account data is temporarily unavailable. Please refresh in a moment.</div>}

    {!currentEmail ? <div className={styles.signedOutLayout}>
      <section className={styles.welcomeCard}>
        <span className={styles.welcomeIcon}><UserRound size={22} aria-hidden="true" /></span>
        <span className={styles.kicker}>YOUR ATLAS WORKSPACE</span>
        <h2>Keep your contributions in one place.</h2>
        <p>Sign in with your email to follow submissions, check review progress, and build your public contribution history.</p>
        <div className={styles.benefitList}><span><BadgeCheck size={17} aria-hidden="true" />Track submission status</span><span><Database size={17} aria-hidden="true" />Keep a record of your evidence</span><span><Users size={17} aria-hidden="true" />Connect your work to the community</span></div>
        <div className={styles.welcomeFoot}><ShieldCheck size={16} aria-hidden="true" />A simple account for participating in the public atlas</div>
      </section>

      <section className={styles.authCard}>
        <div className={styles.cardHeading}><span className={styles.kicker}>WELCOME</span><h2>Sign in or create an account</h2><p>Use an email address you can access.</p></div>
        <RegisterAccountForm />
        {process.env.NODE_ENV !== "production" && <details className={styles.demoAccess}><summary><CircleHelp size={15} aria-hidden="true" />Try a mock account</summary><div className={styles.demoAccountGrid}>
          <form action={loginAsUser.bind(null, "member.demo@humanoidth.local", "USER", undefined)}><button type="submit"><UserRound size={16} aria-hidden="true" /><span><strong>Individual</strong><small>Learn, simulate, and compete</small></span></button></form>
          <form action={loginAsUser.bind(null, "company.demo@humanoidth.local", "COMPANY", "Eastern Automation Lab (อีสเทิร์น ออโตเมชัน)")}><button type="submit"><Building2 size={16} aria-hidden="true" /><span><strong>Company</strong><small>Submit models and view evaluations</small></span></button></form>
          <form action={loginAsUser.bind(null, "admin.demo@humanoidth.local", "ADMIN", undefined)}><button type="submit"><ShieldCheck size={16} aria-hidden="true" /><span><strong>Administrator</strong><small>Review accounts and operations</small></span></button></form>
        </div></details>}
      </section>
    </div> : <>
      <section className={styles.accountOverview}>
        <div className={styles.identityCard}>
          <div className={styles.avatar}>{displayName.slice(0, 1).toUpperCase()}</div>
          <div className={styles.identityCopy}><span className={styles.kicker}>SIGNED IN</span><h2>{displayName}</h2><p>{currentEmail}</p><span className={`${styles.roleBadge} ${activeRole === "ADMIN" ? styles.adminRole : ""}`}><ShieldCheck size={13} aria-hidden="true" />{activeRole}</span></div>
          <form action={logoutUser}><button type="submit" className={styles.logoutButton}>Sign out</button></form>
        </div>
        <div className={styles.statsGrid} aria-label="Contribution summary">
          <article className={styles.statCard}><span><Database size={16} aria-hidden="true" />Submitted</span><strong>{submissions.length}</strong><small>records shared</small></article>
          <article className={styles.statCard}><span><BadgeCheck size={16} aria-hidden="true" />Approved</span><strong>{approved}</strong><small>accepted into Atlas</small></article>
          <article className={styles.statCard}><span><Clock3 size={16} aria-hidden="true" />In review</span><strong>{inReview}</strong><small>awaiting review</small></article>
        </div>
      </section>

      {activeRole === "COMPANY" && <section className={styles.companyWorkspace}>
        <span className={styles.companyWorkspaceIcon}><Building2 size={20} aria-hidden="true" /></span>
        <div><span className={styles.kicker}>COMPANY WORKSPACE</span><h2>{companyMembership?.company.name || "Company account"}</h2><p>{companyMembership?.company.isVerified ? "Verified organization" : "Company profile awaiting verification"} · {companyMembership?.role || "OWNER"}</p></div>
        <Link className={styles.secondaryButton} href="/company/models/new">Open Company Portal <ArrowRight size={14} aria-hidden="true" /></Link>
      </section>}

      <section className={styles.showcaseSection} aria-labelledby="profile-showcase-title">
        <header className={styles.showcaseHeading}>
          <div><span className={styles.kicker}>{showcaseCopy.eyebrow}</span><h2 id="profile-showcase-title">{showcaseCopy.title}</h2><p>{showcaseCopy.description}</p></div>
          <Link href="/submit-data" className={styles.secondaryButton}>{showcaseCopy.add} <ArrowRight size={14} aria-hidden="true" /></Link>
        </header>
        <div className={styles.showcaseGrid}>
          <article className={styles.showcaseImpact}>
            <span className={styles.showcaseImpactIcon}><Award size={19} aria-hidden="true" /></span>
            <span className={styles.showcaseImpactLabel}>{showcaseCopy.approved}</span>
            <strong>{approved}</strong>
            <span className={styles.showcaseImpactFoot}>{displayName}</span>
          </article>
          <div className={styles.showcaseRecords}>
            {approvedShowcase.length ? approvedShowcase.map((item) => <article className={styles.showcaseRecord} key={item.id}>
              <span className={styles.showcaseRecordIcon}><BadgeCheck size={17} aria-hidden="true" /></span>
              <div className={styles.showcaseRecordBody}><span className={styles.showcaseType}>{item.submissionType.replace(/[_-]/g, " ")}</span><h3>{item.title}</h3><p>{item.createdAt.toLocaleDateString(lang === "th" ? "th-TH" : "en", { day: "numeric", month: "short", year: "numeric" })}</p></div>
              {item.url && <a href={item.url} target="_blank" rel="noreferrer" className={styles.showcaseSource} aria-label={`${showcaseCopy.source}: ${item.title}`}><ExternalLink size={15} aria-hidden="true" /></a>}
            </article>) : <article className={styles.showcaseEmpty}><span><Database size={19} aria-hidden="true" /></span><div><strong>{showcaseCopy.emptyTitle}</strong><p>{showcaseCopy.emptyDescription}</p></div></article>}
          </div>
        </div>
      </section>

      <section className={styles.submissionsSection}>
        <header className={styles.sectionHeading}><div><span className={styles.kicker}>YOUR ACTIVITY</span><h2>Submission history</h2><p>Follow the records you have shared with the atlas.</p></div><Link href="/submit-data" className={styles.secondaryButton}>Submit a record <ArrowRight size={15} aria-hidden="true" /></Link></header>
        {submissions.length ? <div className={styles.submissionList}>{submissions.map((item) => <article className={styles.submissionItem} key={item.id}>
          <div className={styles.submissionIcon}><Bot size={18} aria-hidden="true" /></div>
          <div className={styles.submissionMain}><h3>{item.title}</h3><p>{item.submissionType.replace(/[_-]/g, " ")} · {item.createdAt.toLocaleDateString(lang === "th" ? "th-TH" : "en", { day: "numeric", month: "short", year: "numeric" })}</p>{item.reviewNotes || item.notes ? <small>{item.reviewNotes || item.notes}</small> : null}
            <div className={`${styles.workflow} ${["REJECTED", "FAILED"].includes(item.status) ? styles.workflowStopped : ""}`} aria-label={`Submission workflow: ${item.status.toLowerCase()}`}>
              {[["Submitted", 1], ["Processing", 2], ["Review", 3], ["In Atlas", 4]].map(([label, step]) => <span key={label} className={`${styles.workflowStep} ${Number(step) <= workflowProgress(item.status) ? styles.workflowComplete : ""} ${Number(step) === workflowProgress(item.status) && item.status !== "APPROVED" ? styles.workflowCurrent : ""}`}><i />{label}</span>)}
            </div>
          </div>
          <span className={`${styles.statusBadge} ${statusClass(item.status)}`}>{item.status.replace(/_/g, " ").toLowerCase()}</span>
          {item.url ? <a className={styles.sourceLink} href={item.url} target="_blank" rel="noreferrer">Open source <ArrowRight size={13} aria-hidden="true" /></a> : null}
        </article>)}</div> : <div className={styles.emptyState}><span><Database size={20} aria-hidden="true" /></span><strong>No submissions yet</strong><p>Share a robot model, research source, or correction to start your contribution history.</p><Link href="/submit-data" className={styles.primaryButton}>Submit your first record <ArrowRight size={16} aria-hidden="true" /></Link></div>}
      </section>
    </>}

    {activeRole === "ADMIN" && <section className={styles.adminSection}>
      <header className={styles.sectionHeading}><div><span className={styles.kicker}>ADMINISTRATION</span><h2>Atlas accounts</h2><p>Recently registered accounts in this workspace.</p></div><span className={styles.userCount}>{users.length} accounts</span></header>
      <div className={styles.userList}>{users.map((user) => <article className={styles.userRow} key={user.id}><span className={styles.userAvatar}>{(user.name || user.email).slice(0, 1).toUpperCase()}</span><span><strong>{user.name || "Unnamed member"}</strong><small>{user.email}</small></span><span className={styles.roleBadge}>{user.role}</span><time>{user.createdAt.toLocaleDateString(lang === "th" ? "th-TH" : "en", { day: "numeric", month: "short", year: "numeric" })}</time></article>)}{!users.length && <p className={styles.emptyUsers}>No accounts found.</p>}</div>
    </section>}
  </div>;
}
