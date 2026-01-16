"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { SectionLabel } from "../components/ui/SectionLabel";
import { SectionTitle } from "../components/ui/SectionTitle";
import { focusRing } from "../components/ui/styles";

interface SeriesPoint {
  label: string;
  value: number;
}

interface UsageStats {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  requestsByDay: SeriesPoint[];
  tokensByDay: SeriesPoint[];
  requestsByHour: SeriesPoint[];
  tokensByHour: SeriesPoint[];
  models: Array<{
    name: string;
    requests: number;
    tokens: number;
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
  }>;
  providers: Array<{
    name: string;
    requests: number;
    tokens: number;
  }>;
}

interface UsageResponse {
  running: boolean;
  usage: UsageStats | null;
  error: string | null;
  updatedAt: string;
}

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatDate = (value?: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const takeRecent = (series: SeriesPoint[], max = 7) => {
  if (!series?.length) return [];
  return series.slice(-max);
};

const buildLineSeries = (
  series: SeriesPoint[],
  width: number,
  height: number,
  padding = 16,
) => {
  if (!series.length) {
    return { line: "", area: "", max: 0 };
  }
  const max = Math.max(...series.map((item) => item.value), 1);
  const step = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
  const points = series.map((item, index) => {
    const x = padding + step * index;
    const y =
      padding + (height - padding * 2) * (1 - item.value / max);
    return { x, y };
  });
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const area = `M${padding},${height - padding} ${points
    .map((point) => `L${point.x},${point.y}`)
    .join(" ")} L${padding + step * (series.length - 1)},${height - padding} Z`;
  return { line, area, max };
};

const sumValues = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);

export default function AnalyticsPage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const chartId = useId();
  const gradientBase = useMemo(() => chartId.replace(/:/g, "_"), [chartId]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch("/api/proxy/usage", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load usage");
      const json = (await response.json()) as UsageResponse;
      setUsage(json.usage ?? null);
      setRunning(Boolean(json.running));
      setUpdatedAt(json.updatedAt ?? null);
      setError(json.error ?? null);
    } catch (err) {
      setRunning(false);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summaryText = useMemo(() => {
    if (!updatedAt) return "Last update unavailable";
    return `Last updated ${formatDate(updatedAt)}`;
  }, [updatedAt]);

  const successRate = useMemo(() => {
    if (!usage || usage.totalRequests === 0) return null;
    return (usage.successCount / usage.totalRequests) * 100;
  }, [usage]);

  const recentRequests = useMemo(
    () => takeRecent(usage?.requestsByDay ?? []),
    [usage],
  );
  const recentTokens = useMemo(
    () => takeRecent(usage?.tokensByDay ?? []),
    [usage],
  );

  const hourlyRequests = useMemo(
    () => takeRecent(usage?.requestsByHour ?? [], 24),
    [usage],
  );
  const hourlyTokens = useMemo(
    () => takeRecent(usage?.tokensByHour ?? [], 24),
    [usage],
  );
  const tokenBreakdown = useMemo(() => {
    if (!usage) return null;
    return {
      input: usage.inputTokens ?? 0,
      output: usage.outputTokens ?? 0,
      cached: usage.cachedTokens ?? 0,
    };
  }, [usage]);
  const providerRows = useMemo(() => {
    if (!usage?.providers?.length) return [];
    return [...usage.providers]
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 6);
  }, [usage]);
  const modelRows = useMemo(() => {
    if (!usage?.models?.length) return [];
    return [...usage.models].sort((a, b) => b.tokens - a.tokens).slice(0, 6);
  }, [usage]);
  const providerTotal = useMemo(
    () => sumValues(providerRows.map((row) => row.tokens)) || 1,
    [providerRows],
  );
  const modelTotal = useMemo(
    () => sumValues(modelRows.map((row) => row.tokens)) || 1,
    [modelRows],
  );
  const donutPercent = useMemo(() => {
    if (successRate === null) return 0;
    return Math.min(Math.max(successRate, 0), 100);
  }, [successRate]);
  const requestChart = useMemo(
    () => buildLineSeries(hourlyRequests, 520, 180, 18),
    [hourlyRequests],
  );
  const tokenChart = useMemo(
    () => buildLineSeries(hourlyTokens, 520, 180, 18),
    [hourlyTokens],
  );
  const tokenTotal = useMemo(() => {
    if (!tokenBreakdown) return 0;
    return sumValues([
      tokenBreakdown.input,
      tokenBreakdown.output,
      tokenBreakdown.cached,
    ]);
  }, [tokenBreakdown]);
  const donutStats = useMemo(() => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - donutPercent / 100);
    return { radius, circumference, offset };
  }, [donutPercent]);
  const reqGradientId = `${gradientBase}-req`;
  const tokenGradientId = `${gradientBase}-tok`;

  const renderBars = (series: SeriesPoint[], colorClass: string) => {
    if (!series.length) {
      return <p className="mt-3 text-xs text-slate-400">No data yet.</p>;
    }
    const max = Math.max(...series.map((item) => item.value), 1);
    return (
      <div className="mt-4 flex items-end gap-2">
        {series.map((item) => (
          <div key={item.label} className="flex-1">
            <div className="h-24 overflow-hidden rounded-full bg-white/5">
              <div
                className={`w-full ${colorClass}`}
                style={{ height: `${Math.min((item.value / max) * 100, 100)}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden scanlines">
        <div className="absolute -top-48 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.35),transparent_70%)] blur-2xl opacity-70 float-slow" />
        <div className="absolute -left-40 top-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.3),transparent_72%)] blur-3xl opacity-70 float-medium" />
        <div className="absolute bottom-0 left-1/2 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.25),transparent_70%)] blur-3xl opacity-60 float-fast" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.5)_0,transparent_55%)]" />
      </div>

      <div className="relative z-10 px-4 py-10 md:px-6 2xl:px-12">
        <div className="mx-auto w-full max-w-[1560px] space-y-6">
          <Card className="p-6">
            <SectionLabel>Analytics</SectionLabel>
            <SectionTitle>Usage & throughput</SectionTitle>
            <p className="mt-2 text-sm text-slate-300">
              Track total requests, success rates, and token flow.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span
                  className={`badge ${
                    running ? "badge-emerald" : "badge-rose"
                  } ${loading ? "shimmer" : ""}`}
                >
                  {loading ? "Checking" : running ? "Running" : "Offline"}
                </span>
                <span>{summaryText}</span>
              </div>
              <button
                className={`inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 ${focusRing}`}
                type="button"
                onClick={() => load()}
              >
                Refresh
              </button>
            </div>
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total requests",
                value:
                  usage?.totalRequests !== undefined
                    ? formatCompact(usage.totalRequests)
                    : "—",
              },
              {
                label: "Success rate",
                value:
                  successRate !== null ? formatPercent(successRate) : "—",
              },
              {
                label: "Total tokens",
                value:
                  usage?.totalTokens !== undefined
                    ? formatCompact(usage.totalTokens)
                    : "—",
              },
              {
                label: "Cached tokens",
                value:
                  usage?.cachedTokens !== undefined
                    ? formatCompact(usage.cachedTokens)
                    : "—",
              },
            ].map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-100">
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Traffic pulse
                  </p>
                  <p className="text-xs text-slate-400">
                    Requests over last 24 hours
                  </p>
                </div>
                <span className="badge badge-cyan">
                  {hourlyRequests.length
                    ? formatCompact(
                        hourlyRequests[hourlyRequests.length - 1].value,
                      )
                    : "—"}
                </span>
              </div>
              {hourlyRequests.length ? (
                <div className="mt-4">
                  <svg
                    className="h-44 w-full"
                    viewBox="0 0 520 180"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id={reqGradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(34,211,238,0.45)" />
                        <stop offset="100%" stopColor="rgba(168,85,247,0.05)" />
                      </linearGradient>
                    </defs>
                    <path
                      d={requestChart.area}
                      fill={`url(#${reqGradientId})`}
                      stroke="none"
                    />
                    <path
                      d={requestChart.line}
                      fill="none"
                      stroke="rgba(34,211,238,0.85)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-400">No hourly data yet.</p>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Token pulse
                  </p>
                  <p className="text-xs text-slate-400">
                    Tokens over last 24 hours
                  </p>
                </div>
                <span className="badge badge-fuchsia">
                  {hourlyTokens.length
                    ? formatCompact(
                        hourlyTokens[hourlyTokens.length - 1].value,
                      )
                    : "—"}
                </span>
              </div>
              {hourlyTokens.length ? (
                <div className="mt-4">
                  <svg
                    className="h-44 w-full"
                    viewBox="0 0 520 180"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id={tokenGradientId}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="rgba(217,70,239,0.45)" />
                        <stop offset="100%" stopColor="rgba(34,211,238,0.05)" />
                      </linearGradient>
                    </defs>
                    <path
                      d={tokenChart.area}
                      fill={`url(#${tokenGradientId})`}
                      stroke="none"
                    />
                    <path
                      d={tokenChart.line}
                      fill="none"
                      stroke="rgba(217,70,239,0.85)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-400">No hourly data yet.</p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-100">
                Success vs failure
              </p>
              <div className="mt-4 flex items-center gap-6">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={donutStats.radius}
                    fill="none"
                    stroke="rgba(148,163,184,0.2)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={donutStats.radius}
                    fill="none"
                    stroke="rgba(34,197,94,0.85)"
                    strokeWidth="12"
                    strokeDasharray={donutStats.circumference}
                    strokeDashoffset={donutStats.offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text
                    x="60"
                    y="60"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-slate-100 text-lg font-semibold"
                  >
                    {successRate === null ? "—" : formatPercent(successRate)}
                  </text>
                </svg>
                <div className="text-xs text-slate-400">
                  <p>
                    {formatCompact(usage?.successCount ?? 0)} successful requests
                  </p>
                  <p className="mt-1">
                    {formatCompact(usage?.failureCount ?? 0)} failed requests
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-100">
                Token breakdown
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Input vs output vs cached tokens
              </p>
              {tokenBreakdown ? (
                <div className="mt-4 space-y-3">
                  <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="bg-cyan-500/70"
                      style={{
                        width: `${tokenTotal ? (tokenBreakdown.input / tokenTotal) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-fuchsia-500/70"
                      style={{
                        width: `${tokenTotal ? (tokenBreakdown.output / tokenTotal) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-emerald-500/70"
                      style={{
                        width: `${tokenTotal ? (tokenBreakdown.cached / tokenTotal) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                    <span>
                      <span className="inline-block h-2 w-2 rounded-full bg-cyan-500/70" />{" "}
                      Input {formatCompact(tokenBreakdown.input)}
                    </span>
                    <span>
                      <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-500/70" />{" "}
                      Output {formatCompact(tokenBreakdown.output)}
                    </span>
                    <span>
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/70" />{" "}
                      Cached {formatCompact(tokenBreakdown.cached)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-400">No token data yet.</p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-100">
                Requests (7 days)
              </p>
              {renderBars(recentRequests, "bg-cyan-500/70")}
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-100">
                Tokens (7 days)
              </p>
              {renderBars(recentTokens, "bg-fuchsia-500/70")}
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-100">
                Provider usage
              </p>
              <div className="mt-4 space-y-3 text-xs">
                {providerRows.length === 0 ? (
                  <p className="text-slate-400">No provider usage yet.</p>
                ) : (
                  providerRows.map((provider) => {
                    const pct = (provider.tokens / providerTotal) * 100;
                    return (
                      <div key={provider.name}>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>{provider.name}</span>
                          <span>
                            {formatCompact(provider.tokens)} tokens ·{" "}
                            {formatCompact(provider.requests)} req
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/5">
                          <div
                            className="h-2 rounded-full bg-emerald-500/70"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-100">
                Model usage
              </p>
              <div className="mt-4 space-y-3 text-xs">
                {modelRows.length === 0 ? (
                  <p className="text-slate-400">No model usage yet.</p>
                ) : (
                  modelRows.map((model) => {
                    const pct = (model.tokens / modelTotal) * 100;
                    return (
                      <div key={model.name}>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>{model.name}</span>
                          <span>
                            {formatCompact(model.tokens)} tokens ·{" "}
                            {formatCompact(model.requests)} req
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/5">
                          <div
                            className="h-2 rounded-full bg-cyan-500/70"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
