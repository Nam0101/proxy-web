import { navItems } from "./data";
import { Card } from "../ui/Card";
import { focusRing } from "../ui/styles";
import { SectionLabel } from "../ui/SectionLabel";

export function Sidebar() {
  return (
    <aside className="sticky top-28 hidden h-[calc(100vh-7rem)] w-64 flex-col gap-6 lg:flex">
      <Card className="p-4">
        <SectionLabel>Workspace</SectionLabel>
        <p className="mt-2 font-heading text-lg font-semibold text-slate-100">
          Proxy Fleet Ops
        </p>
        <p className="mt-1 text-sm text-slate-400">Plan: Enterprise Edge</p>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400">
          <span>Credits</span>
          <span className="text-slate-100">82% used</span>
        </div>
      </Card>

      <Card className="p-4">
        <SectionLabel>Navigation</SectionLabel>
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition ${focusRing} ${
                item.active
                  ? "bg-white text-slate-950 shadow-lg shadow-fuchsia-500/20"
                  : "text-slate-300 hover:bg-white/5"
              }`}
              type="button"
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    item.active
                      ? "bg-slate-950 text-white"
                      : item.badgeTone ?? "bg-white/10 text-slate-300"
                  }`}
                >
                  {item.badge}
                </span>
              ) : (
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.active ? "bg-slate-950" : "bg-slate-600"
                  }`}
                />
              )}
            </button>
          ))}
        </nav>
      </Card>

      <Card className="p-4">
        <SectionLabel>Runtime</SectionLabel>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Proxy status</span>
            <span className="font-semibold text-emerald-300">Running</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Port</span>
            <span className="font-semibold text-slate-100">7049</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Health checks</span>
            <span className="font-semibold text-slate-100">Every 15s</span>
          </div>
        </div>
        <button
          className={`mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-200 ${focusRing}`}
          type="button"
        >
          Open runtime controls
        </button>
      </Card>
    </aside>
  );
}
