"use client";

import { useState } from "react";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { registerAndLoginUser } from "@/app/actions";
import styles from "./Profile.module.css";

export default function RegisterAccountForm() {
  const [accountType, setAccountType] = useState<"USER" | "COMPANY">("USER");

  return <form action={registerAndLoginUser} className={styles.authForm}>
    <fieldset className={styles.accountTypeFieldset}>
      <legend>Choose account type</legend>
      <div className={styles.accountTypeGrid}>
        <label className={`${styles.accountTypeCard} ${accountType === "USER" ? styles.accountTypeCardActive : ""}`}>
          <input checked={accountType === "USER"} name="accountType" onChange={() => setAccountType("USER")} type="radio" value="USER" />
          <UserRound size={18} aria-hidden="true" />
          <span><strong>Individual</strong><small>Learn, simulate, compete, and contribute.</small></span>
        </label>
        <label className={`${styles.accountTypeCard} ${accountType === "COMPANY" ? styles.accountTypeCardActive : ""}`}>
          <input checked={accountType === "COMPANY"} name="accountType" onChange={() => setAccountType("COMPANY")} type="radio" value="COMPANY" />
          <Building2 size={18} aria-hidden="true" />
          <span><strong>Company</strong><small>Submit robot models and manage evaluations.</small></span>
        </label>
      </div>
    </fieldset>
    <label>Email address<input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></label>
    <label>Your name <span className={styles.optional}>(optional)</span><input name="name" placeholder="Your name" autoComplete="name" /></label>
    {accountType === "COMPANY" && <label>Company name<input name="companyName" required placeholder="Example Robotics Co., Ltd." autoComplete="organization" /></label>}
    <button type="submit" className={styles.primaryButton}>Create {accountType === "COMPANY" ? "company" : "individual"} account <ArrowRight size={16} aria-hidden="true" /></button>
  </form>;
}
