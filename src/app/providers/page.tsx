"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { SectionLabel } from "../components/ui/SectionLabel";
import { SectionTitle } from "../components/ui/SectionTitle";
import { focusRing } from "../components/ui/styles";

interface ProviderItem {
  id: string;
  authenticated: boolean;
  accounts: number;
  account: string | null;
  error: string | null;
}

interface ProvidersResponse {
  running: boolean;
  providers: ProviderItem[];
  error: string | null;
  updatedAt: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  claude: "Claude",
  gemini: "Gemini",
  qwen: "Qwen",
  iflow: "iFlow",
  vertex: "Vertex",
  antigravity: "Antigravity",
  copilot: "Copilot",
};

function formatLabel(id: string) {
  return PROVIDER_LABELS[id] ?? id;
}

export default function ProvidersPage() {
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/proxy/providers", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load providers");
      const json = (await response.json()) as ProvidersResponse;
      setData(json);
      setError(json.error ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const providers = data?.providers ?? [];
  const running = data?.running ?? false;

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
            <SectionLabel>Providers</SectionLabel>
            <SectionTitle>Auth status</SectionTitle>
            <p className="mt-2 text-sm text-slate-300">
              Live provider connections from CLIProxyAPI.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span
                className={`badge ${
                  running ? "badge-emerald" : "badge-rose"
                } ${loading ? "shimmer" : ""}`}
              >
                {loading ? "Checking" : running ? "Running" : "Offline"}
              </span>
              <button
                className={`inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 ${focusRing}`}
                type="button"
                onClick={load}
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-fade">
            {providers.map((provider) => {
              const label = formatLabel(provider.id);
              const statusTone = provider.authenticated
                ? "badge-emerald"
                : provider.error
                  ? "badge-rose"
                  : "badge-amber";
              const statusText = provider.authenticated
                ? "Authenticated"
                : provider.error
                  ? "Error"
                  : "Not connected";
              return (
                <Card key={provider.id} className="p-5 hover-lift hover-gradient hover-glow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {label}
                      </p>
                      <p className="text-xs text-slate-400">{provider.id}</p>
                    </div>
                    <span className={`badge ${statusTone}`}>{statusText}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Accounts</span>
                    <span className="font-semibold text-slate-100">
                      {provider.accounts || 0}
                    </span>
                  </div>
                  {provider.account ? (
                    <p className="mt-2 text-xs text-slate-400">
                      Account: {provider.account}
                    </p>
                  ) : null}
                  {provider.error ? (
                    <p className="mt-2 text-xs text-rose-200">
                      {provider.error}
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
