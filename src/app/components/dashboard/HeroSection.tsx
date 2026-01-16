import Link from "next/link";
import { heroTags } from "./data";
import { Card } from "../ui/Card";
import { focusRing } from "../ui/styles";
import { SectionLabel } from "../ui/SectionLabel";
import type { ProxySummary } from "./useProxySummary";

export function HeroSection({
  summary,
  loading,
}: {
  summary: ProxySummary;
  loading: boolean;
}) {
  const updatedAt = summary.updatedAt
    ? new Date(summary.updatedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const stats = [
    {
      label: "Providers online",
      value: summary.running ? summary.connectedProviders : 0,
    },
    {
      label: "Total requests",
      value: summary.running ? summary.totalRequests : 0,
    },
    {
      label: "Client keys",
      value: summary.running ? summary.clientKeysCount : 0,
    },
  ];

  return (
    <section className="rise-in">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_60%)]" />
        <div className="absolute -right-16 -top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.2),transparent_70%)]" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_70%)]" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionLabel>Command Layer</SectionLabel>
              <h1 className="font-heading mt-3 text-3xl font-semibold sm:text-4xl">
                <span className="rainbow-text">
                  Manage CLIProxy like a real-time operations deck.
                </span>
              </h1>
              <p className="mt-3 max-w-3xl text-base text-slate-300">
                Mirror CLIProxyAPI status, connect providers, and route traffic
                with a manager-first console built for 2026 load.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 shadow-sm">
              Updated {updatedAt}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 stagger-fade">
            {heroTags.map((chip) => (
              <span key={chip.label} className={`chip ${chip.tone}`}>
                {chip.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={`btn-glow inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/30 transition hover:bg-slate-100 ${focusRing}`}
              href="/providers"
            >
              Open providers
            </Link>
            <Link
              className={`inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 text-sm font-semibold text-slate-200 transition hover:border-white/30 ${focusRing}`}
              href="/client-keys"
            >
              Generate client keys
            </Link>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-slate-400">{stat.label}</span>
                <span className={`font-semibold text-slate-100 ${loading ? "shimmer" : ""}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
