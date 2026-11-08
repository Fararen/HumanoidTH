"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { registerAndLoginUser } from "@/app/actions";
import styles from "./Profile.module.css";

export default function RegisterAccountForm({ lang = "en" }: { lang?: "en" | "th" }) {
  const [accountType, setAccountType] = useState<"USER" | "COMPANY">("USER");
  const [currentLang, setCurrentLang] = useState(lang);

  useEffect(() => {
    const cookieLang = document.cookie.match(/(?:^|; )lang=(th|en)(?:;|$)/)?.[1];
    if (cookieLang === "en" || cookieLang === "th") setCurrentLang(cookieLang);
    const handleLanguageChange = (event: Event) => {
      const nextLang = (event as CustomEvent<"en" | "th">).detail;
      if (nextLang === "en" || nextLang === "th") setCurrentLang(nextLang);
    };
    window.addEventListener("atlas-language-change", handleLanguageChange);
    return () => window.removeEventListener("atlas-language-change", handleLanguageChange);
  }, [lang]);

  const copy = currentLang === "th" ? {
    chooseType: "เลือกประเภทบัญชี", individual: "บุคคล", individualLead: "เรียน ใช้ simulator แข่งขัน และร่วมส่งข้อมูล", company: "บริษัท", companyLead: "ส่งรุ่นหุ่นยนต์และจัดการผลประเมิน",
    email: "อีเมล", name: "ชื่อของคุณ", optional: "ไม่บังคับ", companyName: "ชื่อบริษัท", create: "สร้างบัญชี", createCompany: "บริษัท", createIndividual: "บุคคล",
    emailPlaceholder: "you@example.com", namePlaceholder: "ชื่อของคุณ", companyPlaceholder: "Example Robotics Co., Ltd."
  } : {
    chooseType: "Choose account type", individual: "Individual", individualLead: "Learn, simulate, compete, and contribute.", company: "Company", companyLead: "Submit robot models and manage evaluations.",
    email: "Email address", name: "Your name", optional: "optional", companyName: "Company name", create: "Create", createCompany: "company", createIndividual: "individual",
    emailPlaceholder: "you@example.com", namePlaceholder: "Your name", companyPlaceholder: "Example Robotics Co., Ltd."
  };

  return <form action={registerAndLoginUser} className={styles.authForm}>
    <fieldset className={styles.accountTypeFieldset}>
      <legend>{copy.chooseType}</legend>
      <div className={styles.accountTypeGrid}>
        <label className={`${styles.accountTypeCard} ${accountType === "USER" ? styles.accountTypeCardActive : ""}`}>
          <input checked={accountType === "USER"} name="accountType" onChange={() => setAccountType("USER")} type="radio" value="USER" />
          <UserRound size={18} aria-hidden="true" />
          <span><strong>{copy.individual}</strong><small>{copy.individualLead}</small></span>
        </label>
        <label className={`${styles.accountTypeCard} ${accountType === "COMPANY" ? styles.accountTypeCardActive : ""}`}>
          <input checked={accountType === "COMPANY"} name="accountType" onChange={() => setAccountType("COMPANY")} type="radio" value="COMPANY" />
          <Building2 size={18} aria-hidden="true" />
          <span><strong>{copy.company}</strong><small>{copy.companyLead}</small></span>
        </label>
      </div>
    </fieldset>
    <label>{copy.email}<input name="email" type="email" required placeholder={copy.emailPlaceholder} autoComplete="email" /></label>
    <label>{currentLang === "th" ? "รหัสผ่าน (อย่างน้อย 10 ตัวอักษร)" : "Password (at least 10 characters)"}<input name="password" type="password" minLength={10} maxLength={200} required autoComplete="new-password" /></label>
    <label>{copy.name} <span className={styles.optional}>({copy.optional})</span><input name="name" placeholder={copy.namePlaceholder} autoComplete="name" /></label>
    {accountType === "COMPANY" && <label>{copy.companyName}<input name="companyName" required placeholder={copy.companyPlaceholder} autoComplete="organization" /></label>}
    <button type="submit" className={styles.primaryButton}>{copy.create} {accountType === "COMPANY" ? copy.createCompany : copy.createIndividual} {currentLang === "th" ? "บัญชี" : "account"} <ArrowRight size={16} aria-hidden="true" /></button>
  </form>;
}
