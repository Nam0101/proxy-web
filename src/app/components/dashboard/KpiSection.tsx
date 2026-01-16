import { kpis } from "./data";
import { Card } from "../ui/Card";

export function KpiSection() {
  return (
    <section className="grid gap-4 md:grid-cols-3 rise-in delay-1">
      {kpis.map((metric) => (
        <Card
          key={metric.label}
          className={`relative overflow-hidden bg-gradient-to-br ${metric.surface} p-4`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400/70 via-cyan-400/60 to-amber-400/60" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {metric.label}
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-100">
              {metric.value}
            </p>
            <p className={`text-xs font-semibold ${metric.tone}`}>
              {metric.change}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-400">{metric.hint}</p>
        </Card>
      ))}
    </section>
  );
}
