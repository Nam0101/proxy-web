"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "../components/ui/Card";
import { focusRing } from "../components/ui/styles";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next") || "/";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Login failed");
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden scanlines">
        <div className="absolute -top-44 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.35),transparent_70%)] blur-3xl opacity-80 float-slow" />
        <div className="absolute -left-48 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.3),transparent_72%)] blur-3xl opacity-70 float-medium" />
        <div className="absolute bottom-0 left-1/2 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.25),transparent_70%)] blur-3xl opacity-60 float-fast" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.65)_0,transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0_94%,rgba(148,163,184,0.12)_94%),linear-gradient(90deg,transparent_0_94%,rgba(148,163,184,0.12)_94%)] bg-[size:46px_46px] opacity-30" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 md:px-8">
        <div className="grid w-full max-w-[1120px] gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center space-y-6">
            <span className="chip chip-cyan w-fit">Internal Access</span>
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
              <span className="rainbow-text">
                CLIProxy Manager Control Deck
              </span>
            </h1>
            <p className="text-base text-slate-300">
              Authenticate to manage providers, API keys, and runtime telemetry.
              Accounts are provisioned internally — no public sign up.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Secure Mode
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Signed sessions, management key stays server-side.
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Live Sync
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Dashboard pulls real data from CLIProxyAPI.
                </p>
              </Card>
            </div>
          </div>

          <Card className="p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-semibold text-slate-100">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Use a provisioned account to access the console.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-200">
                Username
                <input
                  className={`mt-2 h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-100 placeholder:text-slate-500 ${focusRing}`}
                  placeholder="manager"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-200">
                Password
                <input
                  className={`mt-2 h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-100 placeholder:text-slate-500 ${focusRing}`}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                className={`btn-glow inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/30 transition hover:bg-slate-100 ${focusRing}`}
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Enter control deck"}
              </button>
            </form>
            <p className="mt-6 text-xs text-slate-500">
              Need access? Ask the proxy admin to create credentials.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
