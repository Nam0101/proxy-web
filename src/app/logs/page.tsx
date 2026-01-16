"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { SectionLabel } from "../components/ui/SectionLabel";
import { SectionTitle } from "../components/ui/SectionTitle";
import { focusRing } from "../components/ui/styles";
import { Header } from "../components/dashboard/Header";
import { IconFilter } from "../components/icons";
import {
  getSettings,
  mergeSettings,
  type LogFilter,
  type LogLevel,
} from "../lib/settings";

type ParsedLog = {
  id: string;
  level: LogLevel;
  timestamp?: string;
  message: string;
};

const levelOptions = [
  { key: "all", label: "All", tone: "badge-indigo" },
  { key: "error", label: "Error", tone: "badge-rose" },
  { key: "warn", label: "Warn", tone: "badge-amber" },
  { key: "info", label: "Info", tone: "badge-cyan" },
  { key: "debug", label: "Debug", tone: "badge-indigo" },
  { key: "trace", label: "Trace", tone: "badge-fuchsia" },
  { key: "success", label: "Success", tone: "badge-emerald" },
  { key: "unknown", label: "Unknown", tone: "badge-indigo" },
] as const;

const levelTones: Record<LogLevel, string> = {
  error: "badge-rose",
  warn: "badge-amber",
  info: "badge-cyan",
  debug: "badge-indigo",
  trace: "badge-fuchsia",
  success: "badge-emerald",
  unknown: "badge-indigo",
};

const lineCountOptions = [100, 200, 500, 1000];

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function extractTimestamp(text: string) {
  const isoMatch = text.match(
    /\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/,
  );
  if (isoMatch) return isoMatch[0];
  const timeMatch = text.match(/\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/);
  if (timeMatch) return timeMatch[0];
  return undefined;
}

function normalizeLevel(levelHint: unknown, text: string): LogLevel {
  if (typeof levelHint === "string") {
    const lowered = levelHint.toLowerCase();
    if (["error", "err", "fatal", "panic"].includes(lowered)) return "error";
    if (["warn", "warning"].includes(lowered)) return "warn";
    if (["debug"].includes(lowered)) return "debug";
    if (["trace"].includes(lowered)) return "trace";
    if (["info", "notice"].includes(lowered)) return "info";
    if (["success", "ok"].includes(lowered)) return "success";
  }

  if (typeof levelHint === "number") {
    if (levelHint >= 50) return "error";
    if (levelHint >= 40) return "warn";
    if (levelHint >= 30) return "info";
    if (levelHint >= 20) return "debug";
    return "trace";
  }

  const upper = text.toUpperCase();
  if (/\b(ERROR|ERR|FATAL|PANIC)\b/.test(upper)) return "error";
  if (/\b(WARN|WARNING)\b/.test(upper)) return "warn";
  if (/\bDEBUG\b/.test(upper)) return "debug";
  if (/\bTRACE\b/.test(upper)) return "trace";
  if (/\b(INFO|NOTICE)\b/.test(upper)) return "info";
  if (/\b(SUCCESS|OK)\b/.test(upper)) return "success";
  return "unknown";
}

function parseLog(line: unknown, index: number): ParsedLog {
  let message = "";
  let timestamp: string | undefined;
  let levelHint: unknown;
  let rawText = "";

  if (typeof line === "string") {
    message = line;
    rawText = line;
  } else if (line && typeof line === "object") {
    const record = line as Record<string, unknown>;
    const msgCandidate =
      record.message ?? record.msg ?? record.text ?? record.event ?? record.detail;
    if (typeof msgCandidate === "string") {
      message = msgCandidate;
    } else if (msgCandidate !== undefined) {
      message = String(msgCandidate);
    }

    const rawCandidate = record.raw ?? record.line ?? record.payload;
    rawText =
      typeof rawCandidate === "string"
        ? rawCandidate
        : message || safeStringify(record);

    const timeCandidate =
      record.timestamp ?? record.time ?? record.ts ?? record.date ?? record.at;
    if (typeof timeCandidate === "number") {
      timestamp = new Date(timeCandidate).toISOString();
    } else if (typeof timeCandidate === "string") {
      timestamp = timeCandidate;
    }

    levelHint = record.level ?? record.severity ?? record.lvl ?? record.level_name;
  } else {
    message = String(line ?? "");
    rawText = message;
  }

  if (!message) message = rawText || "—";
  if (!rawText) rawText = message;
  if (!timestamp) timestamp = extractTimestamp(rawText);

  const level = normalizeLevel(levelHint, rawText || message);
  const id = `${index}-${level}-${(timestamp ?? "").slice(0, 12)}-${message.slice(0, 12)}`;

  return {
    id,
    level,
    timestamp,
    message,
  };
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LogsPage() {
  const [lines, setLines] = useState(() => getSettings().logLines);
  const [autoRefresh, setAutoRefresh] = useState(
    () => getSettings().logAutoRefresh,
  );
  const [filter, setFilter] = useState<LogFilter>(
    () => getSettings().logFilter,
  );
  const [rawLines, setRawLines] = useState<unknown[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchingRef = useRef(false);

  const fetchLogs = useCallback(
    async (silent = false) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (!silent) setLoading(true);
      try {
        const response = await fetch(`/api/proxy/logs?lines=${lines}`,
          {
            cache: "no-store",
          },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data?.error || "Failed to fetch logs");
        }
        setRawLines(Array.isArray(data.lines) ? data.lines : []);
        setUpdatedAt(data.updatedAt ?? new Date().toISOString());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!silent) setLoading(false);
        fetchingRef.current = false;
      }
    },
    [lines],
  );

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    mergeSettings({
      logLines: lines,
      logAutoRefresh: autoRefresh,
      logFilter: filter,
    });
  }, [lines, autoRefresh, filter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void fetchLogs(true);
    }, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchLogs]);

  const entries = useMemo(() => rawLines.map(parseLog), [rawLines]);

  const levelCounts = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        acc[entry.level] += 1;
        return acc;
      },
      {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
        trace: 0,
        success: 0,
        unknown: 0,
      },
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((entry) => entry.level === filter);
  }, [entries, filter]);

  const formatCompact = (value: number) =>
    new Intl.NumberFormat("en", { notation: "compact" }).format(value);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden scanlines">
        <div className="absolute -top-48 right-[-120px] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.45),transparent_70%)] blur-2xl opacity-80 float-slow" />
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.38),transparent_72%)] blur-3xl opacity-70 float-medium" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.35),transparent_70%)] blur-3xl opacity-70 float-fast" />
        <div className="absolute bottom-20 right-1/4 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.35),transparent_70%)] blur-3xl opacity-60 drift-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.45)_0,transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0_96%,rgba(148,163,184,0.12)_96%),linear-gradient(90deg,transparent_0_96%,rgba(148,163,184,0.12)_96%)] bg-[size:48px_48px] opacity-40" />
      </div>

      <div className="relative z-10 pb-16">
        <Header />

        <div className="w-full px-4 pt-6 md:px-6 2xl:px-12">
          <main className="space-y-6">
            <section className="rise-in">
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <SectionLabel>Logs</SectionLabel>
                    <SectionTitle>Live tail</SectionTitle>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300">
                      Stream the latest CLIProxyAPI entries, filter by level,
                      and keep the feed alive with auto-refresh.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/30 ${focusRing}`}
                      onClick={() => fetchLogs()}
                      type="button"
                    >
                      Refresh
                    </button>
                    <button
                      aria-pressed={autoRefresh}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        autoRefresh
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-slate-400"
                      } ${focusRing}`}
                      onClick={() => setAutoRefresh((prev) => !prev)}
                      type="button"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          autoRefresh ? "bg-emerald-400" : "bg-slate-500"
                        }`}
                      />
                      Auto 10s
                    </button>
                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        Lines
                      </span>
                      <select
                        className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none"
                        onChange={(event) =>
                          setLines(Number(event.target.value))
                        }
                        value={lines}
                      >
                        {lineCountOptions.map((option) => (
                          <option
                            key={option}
                            className="bg-slate-950"
                            value={option}
                          >
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>{
                    loading
                      ? "Fetching logs..."
                      : error
                        ? "Offline"
                        : `Updated ${formatTime(updatedAt)}`
                  }</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
                  <span>
                    Showing {formatCompact(filteredEntries.length)} of{" "}
                    {formatCompact(entries.length)}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
                  <span>{autoRefresh ? "Auto-refreshing" : "Manual refresh"}</span>
                </div>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    <IconFilter className="h-4 w-4" />
                    Level filter
                  </span>
                  {levelOptions.map((option) => {
                    const count =
                      option.key === "all"
                        ? entries.length
                        : levelCounts[option.key as LogLevel];
                    const selected = filter === option.key;
                    return (
                      <button
                        key={option.key}
                        className={`badge ${option.tone} ${selected ? "ring-1 ring-white/40" : "opacity-70 hover:opacity-100"} ${focusRing}`}
                        onClick={() => setFilter(option.key)}
                        type="button"
                      >
                        {option.label} {formatCompact(count)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-3">
                  {loading && entries.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400 shimmer">
                      Loading logs...
                    </div>
                  ) : filteredEntries.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                      No logs match this filter.
                    </div>
                  ) : (
                    filteredEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`badge ${levelTones[entry.level]}`}>
                            {entry.level.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-100">
                          {entry.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
