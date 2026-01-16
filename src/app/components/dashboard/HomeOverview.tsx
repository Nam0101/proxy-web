import type { ProxySummary } from "./useProxySummary";
import { QuickLinksSection } from "./QuickLinksSection";
import { StatusPanel } from "./StatusPanel";

export function HomeOverview({
  summary,
  loading,
  error,
}: {
  summary: ProxySummary;
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] rise-in delay-1">
      <QuickLinksSection summary={summary} loading={loading} error={error} />
      <StatusPanel summary={summary} loading={loading} error={error} />
    </section>
  );
}
