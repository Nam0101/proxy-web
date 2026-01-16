"use client";

import { Header } from "./Header";
import { HeroSection } from "./HeroSection";
import { HomeOverview } from "./HomeOverview";
import { useProxySummary } from "./useProxySummary";

export function DashboardShell() {
  const { summary, loading, error } = useProxySummary();

  return (
    <div className="relative z-10 pb-16">
      <Header summary={summary} loading={loading} />

      <div className="w-full px-4 pt-6 md:px-6 2xl:px-12">
        <main className="space-y-6">
          <HeroSection summary={summary} loading={loading} />
          <HomeOverview summary={summary} loading={loading} error={error} />
        </main>
      </div>
    </div>
  );
}
