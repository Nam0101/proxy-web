"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card } from "../components/ui/Card";
import { SectionLabel } from "../components/ui/SectionLabel";
import { SectionTitle } from "../components/ui/SectionTitle";
import { focusRing } from "../components/ui/styles";
import {
  clearSettings,
  defaultSettings,
  getSettings,
  logFilterOptions,
  writeSettings,
  type LogFilter,
  type ProxySettings,
} from "../lib/settings";

const lineCountOptions = [100, 200, 500, 1000];

const logFilterLabels: Record<LogFilter, string> = {
  all: "All",
  error: "Error",
  warn: "Warn",
  info: "Info",
  debug: "Debug",
  trace: "Trace",
  success: "Success",
  unknown: "Unknown",
};

function formatTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ToggleButton({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      aria-pressed={value}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${
        value
          ? "border-emerald-400/40 bg-emerald-500/15"
          : "border-white/10 bg-white/5"
      } ${focusRing}`}
      onClick={() => onChange(!value)}
      type="button"
      aria-label={label}
    >
      <span
        className={`inline-flex h-5 w-5 transform rounded-full transition ${
          value ? "translate-x-4 bg-emerald-300" : "translate-x-0 bg-slate-400"
        }`}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ProxySettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const stored = getSettings();
    setSettings(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => {
      writeSettings(settings);
      setSavedAt(new Date().toISOString());
    }, 200);
    return () => clearTimeout(id);
  }, [settings, hydrated]);

  const cardPadding = settings.compactCards ? "p-4" : "p-6";
  const motionClass = settings.reduceMotion ? "" : "float-slow";

  const updateSetting = <K extends keyof ProxySettings>(
    key: K,
    value: ProxySettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    clearSettings();
    setSettings(defaultSettings);
    setSavedAt(new Date().toISOString());
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden scanlines">
        <div
          className={`absolute -top-44 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.32),transparent_70%)] blur-3xl opacity-70 ${motionClass}`}
        />
        <div
          className={`absolute -left-40 top-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.28),transparent_72%)] blur-3xl opacity-70 ${motionClass}`}
        />
        <div
          className={`absolute bottom-0 left-1/3 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.25),transparent_70%)] blur-3xl opacity-60 ${motionClass}`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.55)_0,transparent_55%)]" />
      </div>

      <div className="relative z-10 px-4 py-10 md:px-6 2xl:px-12">
        <div className="mx-auto w-full max-w-[1560px] space-y-6">
          <Card className={cardPadding}>
            <SectionLabel>Settings</SectionLabel>
            <SectionTitle>Workspace preferences</SectionTitle>
            <p className="mt-2 text-sm text-slate-300">
              Preferences are stored locally in your browser and apply to the
              CLIProxy Manager UI.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>
                {hydrated ? `Saved ${formatTime(savedAt)}` : "Loading settings..."}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
              <span>{settings.reduceMotion ? "Motion reduced" : "Motion on"}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
              <span>{settings.compactCards ? "Compact cards" : "Comfort layout"}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={`inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 ${focusRing}`}
                onClick={handleReset}
                type="button"
              >
                Reset defaults
              </button>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className={`${cardPadding} space-y-4`}>
              <div>
                <SectionLabel>Log viewer</SectionLabel>
                <SectionTitle>Live tail defaults</SectionTitle>
              </div>
              <SettingRow
                title="Auto refresh"
                description="Pull new lines every 10 seconds by default."
              >
                <ToggleButton
                  value={settings.logAutoRefresh}
                  onChange={(value) => updateSetting("logAutoRefresh", value)}
                  label="Auto refresh logs"
                />
              </SettingRow>
              <SettingRow
                title="Line count"
                description="Default batch size for the log viewer."
              >
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Lines
                  </span>
                  <select
                    className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none"
                    onChange={(event) =>
                      updateSetting("logLines", Number(event.target.value))
                    }
                    value={settings.logLines}
                  >
                    {lineCountOptions.map((option) => (
                      <option key={option} className="bg-slate-950" value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </SettingRow>
              <SettingRow
                title="Default filter"
                description="Pick the level filter shown on first load."
              >
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Level
                  </span>
                  <select
                    className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none"
                    onChange={(event) =>
                      updateSetting("logFilter", event.target.value as LogFilter)
                    }
                    value={settings.logFilter}
                  >
                    {logFilterOptions.map((option) => (
                      <option key={option} className="bg-slate-950" value={option}>
                        {logFilterLabels[option]}
                      </option>
                    ))}
                  </select>
                </div>
              </SettingRow>
            </Card>

            <Card className={`${cardPadding} space-y-4`}>
              <div>
                <SectionLabel>Notifications</SectionLabel>
                <SectionTitle>Signal and alerts</SectionTitle>
              </div>
              <SettingRow
                title="Alert on failures"
                description="Surface failed requests in highlights and badges."
              >
                <ToggleButton
                  value={settings.notifyOnFailure}
                  onChange={(value) => updateSetting("notifyOnFailure", value)}
                  label="Notify on failures"
                />
              </SettingRow>
              <SettingRow
                title="Mask API keys"
                description="Hide sensitive keys by default in UI lists."
              >
                <ToggleButton
                  value={settings.maskKeys}
                  onChange={(value) => updateSetting("maskKeys", value)}
                  label="Mask API keys"
                />
              </SettingRow>
              <SettingRow
                title="Confirm destructive"
                description="Require confirmation before deletes or revokes."
              >
                <ToggleButton
                  value={settings.confirmDanger}
                  onChange={(value) => updateSetting("confirmDanger", value)}
                  label="Confirm destructive actions"
                />
              </SettingRow>
            </Card>

            <Card className={`${cardPadding} space-y-4 lg:col-span-2`}>
              <div>
                <SectionLabel>Experience</SectionLabel>
                <SectionTitle>UI comfort</SectionTitle>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SettingRow
                  title="Reduce motion"
                  description="Tone down background motion and glows."
                >
                  <ToggleButton
                    value={settings.reduceMotion}
                    onChange={(value) => updateSetting("reduceMotion", value)}
                    label="Reduce motion"
                  />
                </SettingRow>
                <SettingRow
                  title="Compact cards"
                  description="Use tighter padding across settings cards."
                >
                  <ToggleButton
                    value={settings.compactCards}
                    onChange={(value) => updateSetting("compactCards", value)}
                    label="Compact cards"
                  />
                </SettingRow>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
