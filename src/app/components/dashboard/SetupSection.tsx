import { setupSteps } from "./data";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { SectionTitle } from "../ui/SectionTitle";
import { focusRing } from "../ui/styles";
import { IconCheck, IconCopy } from "../icons";

export function SetupSection() {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] rise-in delay-2">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Setup path</SectionLabel>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950">
            1 of 3 done
          </span>
        </div>
        <SectionTitle>Get started</SectionTitle>
        <p className="mt-2 text-sm text-slate-300">
          Follow the same flow used inside ProxyPal to manage providers and
          agents.
        </p>
        <div className="mt-4 space-y-3">
          {setupSteps.map((step, index) => {
            const isDone = step.status === "done";
            const isActive = step.status === "active";
            return (
              <div
                key={step.title}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : isActive
                      ? "border-cyan-500/30 bg-cyan-500/10"
                      : "border-white/10 bg-white/5"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone
                      ? "bg-emerald-400 text-slate-950"
                      : isActive
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-white/10 text-slate-300"
                  }`}
                >
                  {isDone ? <IconCheck className="h-4 w-4" /> : index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-100">{step.title}</p>
                  <p className="text-xs text-slate-400">{step.detail}</p>
                </div>
                <button
                  className={`inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold ${focusRing} ${
                    isDone
                      ? "bg-white/10 text-emerald-200"
                      : "bg-white text-slate-950"
                  }`}
                  type="button"
                >
                  {isDone ? "View" : "Start"}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <SectionLabel>API endpoint</SectionLabel>
        <SectionTitle>Local gateway</SectionTitle>
        <p className="mt-2 text-sm text-slate-300">
          Use this endpoint in Cursor, Continue, or any OpenAI-compatible
          client.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <code className="flex-1 text-xs font-semibold text-slate-200">
            http://127.0.0.1:7049/v1
          </code>
          <button
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 ${focusRing}`}
            type="button"
            aria-label="Copy endpoint"
          >
            <IconCopy className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-100">Management API</p>
          <p className="mt-2">ProxyPal is connected and streaming telemetry.</p>
        </div>
      </Card>
    </section>
  );
}
