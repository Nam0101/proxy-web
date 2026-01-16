"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { SectionLabel } from "../components/ui/SectionLabel";
import { SectionTitle } from "../components/ui/SectionTitle";
import { focusRing } from "../components/ui/styles";

interface ClientKeysResponse {
  running: boolean;
  keys: string[];
  count: number;
  error: string | null;
  updatedAt: string;
}

function maskKey(value: string) {
  if (!value) return "";
  if (value.length <= 10) return "*".repeat(value.length);
  return `${value.slice(0, 4)}•••${value.slice(-4)}`;
}

function createRandomKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `cp_${base64.slice(0, 32)}`;
}

export default function ClientKeysPage() {
  const [data, setData] = useState<ClientKeysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/proxy/client-keys", {
        cache: "no-store",
      });
      const json = (await response.json()) as ClientKeysResponse;
      if (!response.ok) {
        throw new Error(json.error || "Failed to load client keys");
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

  const keys = data?.keys ?? [];
  const running = data?.running ?? false;

  const totalLabel = useMemo(() => {
    if (!data) return "—";
    return `${data.count} keys`;
  }, [data]);

  const generate = useCallback(() => {
    setDraft(createRandomKey());
  }, []);

  const handleAdd = useCallback(async () => {
    const value = draft.trim();
    if (!value) return;
    setPending(true);
    try {
      const response = await fetch("/api/proxy/client-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: value }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to add key");
      }
      setDraft("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPending(false);
    }
  }, [draft, load]);

  const handleDelete = useCallback(
    async (key: string) => {
      if (!window.confirm("Remove this client API key?")) return;
      setPending(true);
      try {
        const response = await fetch("/api/proxy/client-keys", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to remove key");
        }
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setPending(false);
      }
    },
    [load],
  );

  const handleCopy = useCallback(async (key: string) => {
    await navigator.clipboard.writeText(key);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden scanlines">
        <div className="absolute -top-48 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.35),transparent_70%)] blur-2xl opacity-70 float-slow" />
        <div className="absolute -left-40 top-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.3),transparent_72%)] blur-3xl opacity-70 float-medium" />
        <div className="absolute bottom-0 left-1/2 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.25),transparent_70%)] blur-3xl opacity-60 float-fast" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.5)_0,transparent_55%)]" />
      </div>

      <div className="relative z-10 px-4 py-10 md:px-6 2xl:px-12">
        <div className="mx-auto w-full max-w-[1560px] space-y-6">
          <Card className="p-6">
            <SectionLabel>Client API keys</SectionLabel>
            <SectionTitle>Access control vault</SectionTitle>
            <p className="mt-2 text-sm text-slate-300">
              Generate keys for internal tools that call CLIProxyAPI. Keys map to
              the top-level <code className="text-slate-200">api-keys</code>{" "}
              list in the proxy config.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span
                className={`badge ${
                  running ? "badge-emerald" : "badge-rose"
                } ${loading ? "shimmer" : ""}`}
              >
                {loading ? "Checking" : running ? "Running" : "Offline"}
              </span>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  {totalLabel}
                </span>
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

          <Card className="p-6">
            <SectionLabel>Generate</SectionLabel>
            <SectionTitle>Provision a new key</SectionTitle>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                className={`h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-200 placeholder:text-slate-500 ${focusRing}`}
                placeholder="Generate or paste a client key"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button
                className={`inline-flex h-11 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:border-white/30 ${focusRing}`}
                type="button"
                onClick={generate}
              >
                Generate
              </button>
              <button
                className={`btn-glow inline-flex h-11 items-center rounded-full bg-white px-5 text-xs font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/30 transition hover:bg-slate-100 ${focusRing}`}
                type="button"
                onClick={handleAdd}
                disabled={!draft.trim() || pending}
              >
                {pending ? "Saving..." : "Add key"}
              </button>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-fade">
            {keys.length ? (
              keys.map((keyValue) => {
                const show = revealed[keyValue];
                return (
                  <Card key={keyValue} className="p-5 hover-lift hover-gradient hover-glow">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                          Client key
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-100">
                          {show ? keyValue : maskKey(keyValue)}
                        </p>
                      </div>
                      <span className="badge badge-cyan">Active</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        className={`inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:border-white/30 ${focusRing}`}
                        type="button"
                        onClick={() =>
                          setRevealed((prev) => ({
                            ...prev,
                            [keyValue]: !prev[keyValue],
                          }))
                        }
                      >
                        {show ? "Hide" : "Reveal"}
                      </button>
                      <button
                        className={`inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:border-white/30 ${focusRing}`}
                        type="button"
                        onClick={() => handleCopy(keyValue)}
                      >
                        Copy
                      </button>
                      <button
                        className={`inline-flex h-9 items-center rounded-full border border-rose-400/30 bg-rose-500/10 px-4 text-xs font-semibold text-rose-200 transition hover:border-rose-300/60 ${focusRing}`}
                        type="button"
                        onClick={() => handleDelete(keyValue)}
                        disabled={pending}
                      >
                        Remove
                      </button>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-6">
                <p className="text-sm text-slate-300">
                  No client keys yet. Generate one to allow internal tools to
                  authenticate.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
