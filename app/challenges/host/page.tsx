import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, CalendarDays, ClipboardCheck, Trophy, UsersRound } from "lucide-react";
import { createCompetitionHostRequest } from "@/app/actions";
import { getTranslation } from "@/lib/translations";
import styles from "./HostCompetition.module.css";

export const metadata: Metadata = {
  title: "Host a Competition | HumanoidTH",
  description: "Submit a robotics competition proposal for Atlas review."
};

export default async function HostCompetitionPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "th";
  const t = getTranslation(lang);

  return <main className={styles.page}>
    <Link className={styles.backLink} href="/challenges"><ArrowLeft size={16} aria-hidden="true" /> {t.backToCompetitions}</Link>
    <header className={styles.hero}>
      <div><span className={styles.kicker}>{t.organizerWorkspace}</span><h1>{t.hostCompetitionTitle}</h1><p>{t.hostCompetitionLead}</p></div>
      <div className={styles.heroSteps} aria-label={t.hostCompetitionTitle}><span><ClipboardCheck size={17} aria-hidden="true" /> {t.submitProposal}</span><span><UsersRound size={17} aria-hidden="true" /> {t.reviewSetup}</span><span><Trophy size={17} aria-hidden="true" /> {t.publishChallenge}</span></div>
    </header>
    <div className={styles.layout}>
      <form action={createCompetitionHostRequest} className={styles.form}>
        <div className={styles.formHeading}><span className={styles.kicker}>{t.competitionBrief}</span><h2>{t.hostBriefTitle}</h2><p>{t.hostBriefLead}</p></div>
        <label>{t.competitionName}<input name="title" required placeholder={t.competitionNamePlaceholder} /></label>
        <div className={styles.twoColumns}><label>{t.format}<select name="format" required defaultValue="ONLINE"><option value="ONLINE">{t.onlineSimulation}</option><option value="ONSITE">{t.onsiteEvent}</option><option value="HYBRID">{t.hybrid}</option></select></label><label>{t.category}<input name="category" required placeholder={t.categoryPlaceholder} /></label></div>
        <label>{t.proposedStartDate} <span>{t.optional}</span><input name="proposedDate" type="date" /></label>
        <label>{t.challengeOverview}<textarea name="summary" required rows={5} placeholder={t.challengeOverviewPlaceholder} /></label>
        <label>{t.evaluationCriteria}<textarea name="evaluation" required rows={4} placeholder={t.evaluationCriteriaPlaceholder} /></label>
        <button className={styles.submitButton} type="submit">{t.submitForReview} <Trophy size={17} aria-hidden="true" /></button>
      </form>
      <aside className={styles.aside}>
        <span className={styles.asideIcon}><CalendarDays size={20} aria-hidden="true" /></span><h2>{t.whatHappensNext}</h2>
        <ol><li><strong>{t.scopeReview}</strong><span>{t.scopeReviewLead}</span></li><li><strong>{t.evaluationSetup}</strong><span>{t.evaluationSetupLead}</span></li><li><strong>{t.publish}</strong><span>{t.publishLead}</span></li></ol>
        <p>{t.hostProfileNote}</p>
      </aside>
    </div>
  </main>;
}
