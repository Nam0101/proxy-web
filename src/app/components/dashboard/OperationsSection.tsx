import { policies, proxyPools } from "./data";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { SectionTitle } from "../ui/SectionTitle";
import { focusRing } from "../ui/styles";
import { IconBolt, IconFilter } from "../icons";

export function OperationsSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] rise-in delay-3">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>Proxy pools</SectionLabel>
            <SectionTitle>Performance overview</SectionTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-300 ${focusRing}`}
              type="button"
            >
              <IconFilter className="h-4 w-4" />
              Filters
            </button>
            <button
              className={`inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-semibold text-slate-950 ${focusRing}`}
              type="button"
            >
              <IconBolt className="h-4 w-4" />
              Optimize
            </button>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="pb-3 font-semibold">Pool</th>
                <th className="pb-3 font-semibold">Protocol</th>
                <th className="pb-3 font-semibold">IPs</th>
                <th className="pb-3 font-semibold">Latency</th>
                <th className="pb-3 font-semibold">Success</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {proxyPools.map((proxy) => (
                <tr
                  key={proxy.name}
                  className="text-slate-300 transition hover:bg-white/5"
                >
                  <td className="py-3 font-semibold text-slate-100">
                    {proxy.name}
                  </td>
                  <td className="py-3">{proxy.protocol}</td>
                  <td className="py-3">{proxy.ips}</td>
                  <td className="py-3">{proxy.latency}</td>
                  <td className="py-3">{proxy.success}</td>
                  <td className="py-3">
                    <span className={`badge ${proxy.statusTone}`}>
                      {proxy.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <SectionLabel>Policy studio</SectionLabel>
        <SectionTitle>Routing guardrails</SectionTitle>
        <p className="mt-2 text-sm text-slate-300">
          Policies aligned with ProxyPal operational playbooks.
        </p>
        <div className="mt-4 space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-100">{policy.title}</p>
                <span className={`badge ${policy.tone}`}>{policy.status}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{policy.detail}</p>
            </div>
          ))}
        </div>
        <button
          className={`mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-200 ${focusRing}`}
          type="button"
        >
          Open policy studio
        </button>
      </Card>
    </section>
  );
}
