"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { SectionLabel } from "../components/ui/SectionLabel";
import { SectionTitle } from "../components/ui/SectionTitle";
import { focusRing } from "../components/ui/styles";

interface ProviderKey {
  apiKey?: string;
  baseUrl?: string;
  proxyUrl?: string;
  excludedModels?: string[];
  prefix?: string;
  headers?: Record<string, string>;
  projectId?: string;
  location?: string;
  models?: Array<{ name: string; alias?: string }>;
  [key: string]: unknown;
}

interface ProviderEntry {
  id: string;
  label: string;
  endpoint: string;
  count: number;
  keys: ProviderKey[];
  error: string | null;
}

interface ApiKeysResponse {
  running: boolean;
  providers: ProviderEntry[];
  updatedAt: string;
}

interface DraftState {
  apiKey: string;
  extras: string;
  error: string | null;
  busy: boolean;
}

const DEFAULT_DRAFT: DraftState = {
  apiKey: "",
  extras: "",
  error: null,
  busy: false,
};

function maskKey(value?: string) {
  if (!value) return "****";
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "****";
  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}

function describeExtras(entry: ProviderKey) {
  const ignored = new Set(["apiKey"]);
  const extras = Object.keys(entry || {}).filter(
    (key) => !ignored.has(key) && entry[key] != null,
  );
  if (!extras.length) return null;
  return extras.map((key) => key.replace(/[A-Z]/g, (m) => ` ${m}`)).join(", ");
}

export default function ApiKeysPage() {
  const [data, setData] = useState<ApiKeysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/proxy/api-keys", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load API keys");
      const json = (await response.json()) as ApiKeysResponse;
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

  const providers = data?.providers ?? [];
  const running = data?.running ?? false;

  const updatedAt = useMemo(() => {
    if (!data?.updatedAt) return "";
    const date = new Date(data.updatedAt);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }, [data?.updatedAt]);

  const getDraft = (id: string) => drafts[id] ?? DEFAULT_DRAFT;

  const updateDraft = (id: string, patch: Partial<DraftState>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...DEFAULT_DRAFT, ...prev[id], ...patch },
    }));
  };

  const handleAdd = async (provider: ProviderEntry) => {
    const draft = getDraft(provider.id);
    if (!draft.apiKey.trim()) {
      updateDraft(provider.id, { error: "API key is required" });
      return;
    }

    let extras: Record<string, unknown> = {};
    if (draft.extras.trim()) {
      try {
        extras = JSON.parse(draft.extras) as Record<string, unknown>;
      } catch {
        updateDraft(provider.id, { error: "Advanced JSON is invalid" });
        return;
      }
    }

    updateDraft(provider.id, { busy: true, error: null });
    try {
      const payload = { apiKey: draft.apiKey.trim(), ...extras };
      const response = await fetch(`/api/proxy/api-keys/${provider.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const message = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(message?.error || "Failed to add key");
      }
      updateDraft(provider.id, { apiKey: "", extras: "", error: null });
      await load();
    } catch (err) {
      updateDraft(provider.id, {
        error: err instanceof Error ? err.message : "Failed to add key",
      });
    } finally {
      updateDraft(provider.id, { busy: false });
    }
  };

  const handleDelete = async (
    provider: ProviderEntry,
    index: number,
    apiKey?: string,
  ) => {
    const deleteId = `${provider.id}-${index}`;
    setDeletingKey(deleteId);
    try {
      const response = await fetch(`/api/proxy/api-keys/${provider.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ index, apiKey }),
      });
      if (!response.ok) {
        const message = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(message?.error || "Failed to delete key");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete key");
    } finally {
      setDeletingKey(null);
    }
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
            <SectionLabel>Provider API keys</SectionLabel>
            <SectionTitle>Manage provider credentials</SectionTitle>
            <p className="mt-2 text-sm text-slate-300">
              Add or remove keys for each provider. Client access keys live in
              the Client Keys screen.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span
                className={`badge ${
                  running ? "badge-emerald" : "badge-rose"
                } ${loading ? "shimmer" : ""}`}
              >
                {loading ? "Checking" : running ? "Running" : "Offline"}
              </span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {updatedAt ? <span>Updated {updatedAt}</span> : null}
                <button
                  className={`inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 ${focusRing}`}
                  type="button"
                  onClick={load}
                >
                  Refresh
                </button>
              </div>
            </div>
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 md:grid-cols-2 stagger-fade">
            {providers.map((provider) => {
              const draft = getDraft(provider.id);
              return (
                <Card key={provider.id} className="p-5 hover-lift hover-gradient hover-glow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {provider.label}
                      </p>
                      <p className="text-xs text-slate-400">{provider.id}</p>
                    </div>
                    <span className="badge badge-cyan">
                      {provider.count} key{provider.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  {provider.error ? (
                    <p className="mt-2 text-xs text-rose-200">
                      {provider.error}
                    </p>
                  ) : null}

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Add new key
                    </label>
                    <input
                      className={`mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 ${focusRing}`}
                      placeholder="sk-..."
                      value={draft.apiKey}
                      onChange={(event) =>
                        updateDraft(provider.id, { apiKey: event.target.value })
                      }
                    />
                    <details className="mt-2 text-xs text-slate-400">
                      <summary className="cursor-pointer text-slate-400">
                        Advanced JSON (optional)
                      </summary>
                      <textarea
                        className={`mt-2 min-h-[88px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 ${focusRing}`}
                        placeholder='{"baseUrl":"https://..."}'
                        value={draft.extras}
                        onChange={(event) =>
                          updateDraft(provider.id, {
                            extras: event.target.value,
                          })
                        }
                      />
                    </details>
                    {draft.error ? (
                      <p className="mt-2 text-xs text-rose-200">
                        {draft.error}
                      </p>
                    ) : null}
                    <button
                      className={`mt-3 inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:border-white/30 ${focusRing}`}
                      type="button"
                      onClick={() => handleAdd(provider)}
                      disabled={draft.busy}
                    >
                      {draft.busy ? "Saving..." : "Add key"}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {provider.keys.length === 0 ? (
                      <p className="text-xs text-slate-500">No keys yet.</p>
                    ) : (
                      provider.keys.map((item, index) => {
                        const keyLabel = maskKey(item.apiKey);
                        const extras = describeExtras(item);
                        const deleteId = `${provider.id}-${index}`;
                        return (
                          <div
                            key={`${provider.id}-${index}`}
                            className="flex items-start justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-100">
                                {keyLabel}
                              </p>
                              {extras ? (
                                <p className="text-[11px] text-slate-500">
                                  Extras: {extras}
                                </p>
                              ) : null}
                            </div>
                            <button
                              className={`text-xs font-semibold text-rose-200 transition hover:text-rose-100 ${focusRing}`}
                              type="button"
                              onClick={() =>
                                handleDelete(provider, index, item.apiKey)
                              }
                              disabled={deletingKey === deleteId}
                            >
                              {deletingKey === deleteId
                                ? "Removing..."
                                : "Delete"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
