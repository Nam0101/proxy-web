import Link from "next/link";
import { quickLinks } from "./data";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { SectionTitle } from "../ui/SectionTitle";
import { focusRing } from "../ui/styles";
import type { ProxySummary } from "./useProxySummary";

interface QuickLinksSectionProps {
  summary: ProxySummary;
  loading: boolean;
  error: string | null;
}

export function QuickLinksSection({
  summary,
  loading,
  error,
}: QuickLinksSectionProps) {
  const formatCompact = (value: number) =>
    new Intl.NumberFormat("en", { notation: "compact" }).format(value);

  const getBadge = (item: (typeof quickLinks)[number]) => {
    if (item.badge) return item.badge;
    if (loading) return "Loading";
    if (error || !summary.running) return "Offline";
    if (!item.statKey) return "—";
    const value = summary[item.statKey as keyof ProxySummary];
    if (value === null || value === undefined) return "—";
    const formatted = typeof value === "number" ? formatCompact(value) : value;
    return item.suffix ? `${formatted} ${item.suffix}` : String(formatted);
  };

  return (
    <Card className="p-6">
      <SectionLabel>Overview</SectionLabel>
      <SectionTitle>Jump to tools</SectionTitle>
      <p className="mt-2 text-sm text-slate-300">
        Clean dashboard — deep dives live in their own screens.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 stagger-fade">
        {quickLinks.map((item) => {
          const content = (
            <>
              <span>
                <span className="block text-slate-100">{item.title}</span>
                <span className="text-xs text-slate-400">{item.detail}</span>
              </span>
              <span className={`badge ${item.tone} ${loading ? "shimmer" : ""}`}>
                {getBadge(item)}
              </span>
            </>
          );

          const className = `hover-lift hover-gradient hover-glow flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-slate-100 transition hover:border-white/30 ${focusRing}`;

          if (item.href) {
            return (
              <Link key={item.title} href={item.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <button key={item.title} className={className} type="button">
              {content}
            </button>
          );
        })}
      </div>
      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      ) : null}
    </Card>
  );
}
