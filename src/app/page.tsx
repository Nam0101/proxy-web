import { DashboardShell } from "./components/dashboard/DashboardShell";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden scanlines">
        <div className="absolute -top-48 right-[-120px] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.45),transparent_70%)] blur-2xl opacity-80 float-slow" />
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.38),transparent_72%)] blur-3xl opacity-70 float-medium" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.35),transparent_70%)] blur-3xl opacity-70 float-fast" />
        <div className="absolute bottom-20 right-1/4 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.35),transparent_70%)] blur-3xl opacity-60 drift-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.45)_0,transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0_96%,rgba(148,163,184,0.12)_96%),linear-gradient(90deg,transparent_0_96%,rgba(148,163,184,0.12)_96%)] bg-[size:48px_48px] opacity-40" />
      </div>

      <DashboardShell />
    </div>
  );
}
