"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "../actions";

interface LanguageSelectorProps {
  currentLang: "en" | "th";
}

export default function LanguageSelector({ currentLang }: LanguageSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedLang, setSelectedLang] = useState(currentLang);
  const router = useRouter();

  // A layout refresh changes the prop after the language cookie has been saved.
  // Keep the control in sync if navigation updates it from another tab or page.
  useEffect(() => {
    setSelectedLang(currentLang);
  }, [currentLang]);

  const handleLangChange = (lang: "en" | "th") => {
    if (lang === selectedLang || isPending) return;
    const previousLang = selectedLang;
    setSelectedLang(lang);

    startTransition(async () => {
      try {
        await setLanguage(lang);
        // setLanguage updates a cookie on the server. Refresh the current route so
        // every page reads the new layout language without changing its URL.
        router.refresh();
      } catch {
        setSelectedLang(previousLang);
      }
    });
  };

  return (
    <div className={`lang-selector ${isPending ? "loading" : ""}`}>
      <button
        onClick={() => handleLangChange("en")}
        className={selectedLang === "en" ? "active" : ""}
        aria-label="English"
        disabled={isPending}
      >
        <span className="flag">🇬🇧</span>
        <span className="lang-text">EN</span>
      </button>
      <button
        onClick={() => handleLangChange("th")}
        className={selectedLang === "th" ? "active" : ""}
        aria-label="ภาษาไทย"
        disabled={isPending}
      >
        <span className="flag">🇹🇭</span>
        <span className="lang-text">TH</span>
      </button>
    </div>
  );
}
