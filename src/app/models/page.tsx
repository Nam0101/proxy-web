"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { SectionLabel } from "../components/ui/SectionLabel";
import { SectionTitle } from "../components/ui/SectionTitle";
import { focusRing } from "../components/ui/styles";

interface ModelItem {
  id: string;
  ownedBy: string | null;
  source: string | null;
}

interface ModelsResponse {
  models: ModelItem[];
  count: number;
  updatedAt: string;
  error?: string;
}

export default function ModelsPage() {
  const [data, setData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/proxy/models", { cache: "no-store" });
      const json = (await response.json()) as ModelsResponse;
      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch models");
      }
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const models = data?.models ?? [];
  const filtered = useMemo(() => {
    if (!query.trim()) return models;
    const needle = query.toLowerCase();
    return models.filter((model) =>
      [model.id, model.ownedBy, model.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [models, query]);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden scanlines">
        <div className="absolute -top-40 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.28),transparent_70%)] blur-2xl opacity-70 float-slow" />
        <div className="absolute -left-40 top-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.25),transparent_72%)] blur-3xl opacity-70 float-medium" />
        <div className="absolute bottom-0 left-1/2 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.2),transparent_70%)] blur-3xl opacity-60 float-fast" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.5)_0,transparent_55%)]" />
      </div>

      <div className="relative z-10 px-4 py-10 md:px-6 2xl:px-12">
        <div className="mx-auto w-full max-w-[1560px] space-y-6">
          <Card className="p-6">
            <SectionLabel>Models</SectionLabel>
            <SectionTitle>Available models</SectionTitle>
            <p className="mt-2 text-sm text-slate-300">
              Live list from CLIProxyAPI `/v1/models`.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search model, provider, or source..."
                className="h-10 w-full min-w-[220px] flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                className={`inline-flex h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 ${focusRing}`}
                type="button"
                onClick={load}
              >
                Refresh
              </button>
              <span className={`badge badge-cyan ${loading ? "shimmer" : ""}`}>
                {loading ? "Loading" : `${filtered.length} models`}
              </span>
            </div>
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 stagger-fade">
            {filtered.map((model) => (
              <Card key={model.id} className="p-4 hover-lift hover-gradient hover-glow">
                <p className="text-sm font-semibold text-slate-100">
                  {model.id}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="badge badge-indigo">
                    {model.ownedBy || "Unknown"}
                  </span>
                  {model.source ? (
                    <span className="badge badge-fuchsia">{model.source}</span>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
