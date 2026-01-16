import {
  providersAvailable,
  providersConnected,
  requestLogs,
} from "./data";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { SectionTitle } from "../ui/SectionTitle";
import { focusRing } from "../ui/styles";
import { IconPlus, IconSettings } from "../icons";

export function ProvidersSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] rise-in delay-2">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Providers</SectionLabel>
          <span className="badge badge-emerald">
            {providersConnected.length} connected
          </span>
        </div>
        <SectionTitle>Connected accounts</SectionTitle>
        <div className="mt-4 space-y-3">
          {providersConnected.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${provider.avatar}`}
                >
                  {provider.name.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-slate-100">
                    {provider.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {provider.accounts} account(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${provider.statusTone}`}>
                  {provider.status}
                </span>
                <button
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 ${focusRing}`}
                  type="button"
                  aria-label={`Manage ${provider.name}`}
                >
                  <IconSettings className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <SectionLabel>Add providers</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {providersAvailable.map((provider) => (
              <button
                key={provider}
                className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-fuchsia-400/50 ${focusRing}`}
                type="button"
              >
                <IconPlus className="h-3 w-3" />
                {provider}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <SectionLabel>Request feed</SectionLabel>
        <SectionTitle>Live request logs</SectionTitle>
        <div className="mt-4 space-y-3">
          {requestLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {log.route}
                  </p>
                  <p className="text-xs text-slate-400">
                    {log.provider} · {log.model}
                  </p>
                </div>
                <span className={`badge ${log.tone}`}>{log.status}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Latency: {log.latency}</span>
                <span>Tokens: {log.tokens}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          className={`mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-200 ${focusRing}`}
          type="button"
        >
          Open log viewer
        </button>
      </Card>
    </section>
  );
}
