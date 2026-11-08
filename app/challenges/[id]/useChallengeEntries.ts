"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChallengeEntryReceipt } from "../types";

type EntryFields = { teamName: string; solutionTitle: string; description: string; repoUrl: string; videoUrl: string };

export function useChallengeEntries(challengeId: string) {
  const [entries, setEntries] = useState<ChallengeEntryReceipt[]>([]);
  const [historyCode, setHistoryCode] = useState("LOADING");
  const [errorCode, setErrorCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busy = useRef(false);
  const request = useRef<{ fingerprint: string; id: string } | null>(null);
  const endpoint = `/api/challenges/${encodeURIComponent(challengeId)}/submit`;

  const loadEntries = useCallback(async (signal?: AbortSignal) => {
    setHistoryCode("LOADING");
    try {
      const response = await fetch(endpoint, { cache: "no-store", signal });
      const result = await response.json();
      if (signal?.aborted) return;
      if (!response.ok || !result.success) { setHistoryCode(result.code || "UNAVAILABLE"); return; }
      setEntries(result.entries);
      setHistoryCode("READY");
    } catch {
      if (!signal?.aborted) setHistoryCode("UNAVAILABLE");
    }
  }, [endpoint]);

  useEffect(() => {
    const controller = new AbortController();
    void loadEntries(controller.signal);
    return () => controller.abort();
  }, [loadEntries]);

  async function submit(fields: EntryFields) {
    if (busy.current) return null;
    busy.current = true;
    setIsSubmitting(true);
    setErrorCode("");
    try {
      const fingerprint = JSON.stringify({ challengeId, ...fields });
      if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: crypto.randomUUID() };
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, requestId: request.current.id })
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.entry?.id) {
        setErrorCode(result.code || "UNAVAILABLE");
        return null;
      }
      const entry: ChallengeEntryReceipt = result.entry;
      setEntries(previous => [entry, ...previous.filter(item => item.id !== entry.id)].slice(0, 50));
      setHistoryCode("READY");
      request.current = null;
      return entry;
    } catch {
      setErrorCode("UNAVAILABLE");
      return null;
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  }

  return { entries, historyCode, errorCode, isSubmitting, loadEntries, submit };
}
