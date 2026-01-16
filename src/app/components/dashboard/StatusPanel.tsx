import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { SectionTitle } from "../ui/SectionTitle";
import type { ProxySummary } from "./useProxySummary";

interface StatusPanelProps {
  summary: ProxySummary;
  loading: boolean;
  error: string | null;
}

export function StatusPanel({ summary, loading, error }: StatusPanelProps) {
  const formatCompact = (value: number) =>
    new Intl.NumberFormat("en", { notation: "compact" }).format(value);

  const successRate =
    summary.totalRequests > 0
      ? Math.round((summary.successCount / summary.totalRequests) * 100)
      : 0;

  const updatedAt = summary.updatedAt
    ? new Date(summary.updatedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const stats = [
    {
      label: "Total requests",
      value: summary.running ? formatCompact(summary.totalRequests) : "—",
    },
    {
      label: "Success rate",
      value: summary.running ? `${successRate}%` : "—",
    },
    {
      label: "Total tokens",
      value:
        summary.running && typeof summary.totalTokens === "number"
          ? formatCompact(summary.totalTokens)
          : "—",
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <SectionLabel>Live summary</SectionLabel>
        <span
          className={`badge ${
            summary.running ? "badge-emerald" : "badge-rose"
          } ${loading ? "shimmer" : ""}`}
        >
          {loading ? "Checking" : summary.running ? "Running" : "Offline"}
        </span>
      </div>
      <SectionTitle>Proxy status</SectionTitle>
      <p className="mt-2 text-sm text-slate-300">
        Updated at {updatedAt}
      </p>
      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`hover-gradient flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm ${loading ? "shimmer" : ""}`}
          >
            <span className="text-slate-400">{stat.label}</span>
            <span className="font-semibold text-slate-100">{stat.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
        Streaming from CLIProxyAPI management API.
      </div>
    </Card>
  );
}
