"use client";

import { useEffect, useState } from "react";

export interface ProxySummary {
  running: boolean;
  connectedProviders: number;
  totalAccounts: number;
  authFilesCount: number;
  logsCount: number;
  totalTokens: number | null;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  apiKeysCount: number;
  clientKeysCount: number;
  updatedAt: string;
}

const emptySummary: ProxySummary = {
  running: false,
  connectedProviders: 0,
  totalAccounts: 0,
  authFilesCount: 0,
  logsCount: 0,
  totalTokens: null,
  totalRequests: 0,
  successCount: 0,
  failureCount: 0,
  apiKeysCount: 0,
  clientKeysCount: 0,
  updatedAt: "",
};

export function useProxySummary(refreshMs = 15000) {
  const [summary, setSummary] = useState<ProxySummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/proxy/summary", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch summary");
        const data = (await response.json()) as ProxySummary;
        if (!active) return;
        setSummary(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, refreshMs);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [refreshMs]);

  return { summary, loading, error };
}
