"use client";

import Link from "next/link";
import { Card } from "../ui/Card";
import { focusRing } from "../ui/styles";
import { IconSignal } from "../icons";
import { useAuth } from "../auth/useAuth";
import type { ProxySummary } from "./useProxySummary";

export function Header({
  summary,
  loading,
}: {
  summary: ProxySummary;
  loading: boolean;
}) {
  const { user, logout } = useAuth();
  const running = summary.running;
  const statusLabel = loading ? "Checking" : running ? "Running" : "Offline";
  const statusTone = running
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
    : "border-rose-400/30 bg-rose-500/10 text-rose-200";
  const initials = user ? user.slice(0, 2).toUpperCase() : "ME";

  return (
    <header className="sticky top-4 z-30 w-full px-4 md:px-6 2xl:px-12">
      <Card
        variant="strong"
        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_16px_40px_-18px_rgba(15,23,42,0.9)]">
            <IconSignal className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              CLIProxy Manager
            </p>
            <p className="font-heading text-lg font-semibold text-slate-100">
              Proxy Control Matrix
            </p>
          </div>
          <button
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone} ${loading ? "shimmer" : ""} ${focusRing}`}
            type="button"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${running ? "animate-ping bg-emerald-400" : "bg-rose-400"}`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${running ? "bg-emerald-400" : "bg-rose-400"}`}
              />
            </span>
            {statusLabel}
          </button>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Link
            className={`inline-flex h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:text-white ${focusRing}`}
            href="/providers"
          >
            Providers
          </Link>
          <Link
            className={`inline-flex h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:text-white ${focusRing}`}
            href="/client-keys"
          >
            Client keys
          </Link>
          <button
            className={`inline-flex h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:text-white ${focusRing}`}
            type="button"
            onClick={logout}
          >
            Sign out
          </button>
          <div className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-950">
              {initials}
            </span>
            <span className="hidden sm:inline">{user ?? "manager"}</span>
          </div>
        </div>
      </Card>
    </header>
  );
}
