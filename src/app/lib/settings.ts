export type LogLevel =
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace"
  | "success"
  | "unknown";

export type LogFilter = "all" | LogLevel;

export type ProxySettings = {
  logLines: number;
  logAutoRefresh: boolean;
  logFilter: LogFilter;
  notifyOnFailure: boolean;
  maskKeys: boolean;
  confirmDanger: boolean;
  reduceMotion: boolean;
  compactCards: boolean;
};

export const SETTINGS_STORAGE_KEY = "proxypal.settings.v1" as const;

export const logFilterOptions = [
  "all",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "success",
  "unknown",
] as const satisfies readonly LogFilter[];

export const defaultSettings: ProxySettings = {
  logLines: 200,
  logAutoRefresh: true,
  logFilter: "all",
  notifyOnFailure: true,
  maskKeys: true,
  confirmDanger: true,
  reduceMotion: false,
  compactCards: false,
};

function clampLogLines(value: number) {
  if (!Number.isFinite(value)) return defaultSettings.logLines;
  return Math.min(1000, Math.max(10, Math.round(value)));
}

function isLogFilter(value: unknown): value is LogFilter {
  return typeof value === "string" && logFilterOptions.includes(value as LogFilter);
}

function normalizeSettings(raw: Partial<ProxySettings>): Partial<ProxySettings> {
  const normalized: Partial<ProxySettings> = {};

  if (typeof raw.logAutoRefresh === "boolean") {
    normalized.logAutoRefresh = raw.logAutoRefresh;
  }
  if (typeof raw.logLines === "number") {
    normalized.logLines = clampLogLines(raw.logLines);
  }
  if (isLogFilter(raw.logFilter)) {
    normalized.logFilter = raw.logFilter;
  }
  if (typeof raw.notifyOnFailure === "boolean") {
    normalized.notifyOnFailure = raw.notifyOnFailure;
  }
  if (typeof raw.maskKeys === "boolean") {
    normalized.maskKeys = raw.maskKeys;
  }
  if (typeof raw.confirmDanger === "boolean") {
    normalized.confirmDanger = raw.confirmDanger;
  }
  if (typeof raw.reduceMotion === "boolean") {
    normalized.reduceMotion = raw.reduceMotion;
  }
  if (typeof raw.compactCards === "boolean") {
    normalized.compactCards = raw.compactCards;
  }

  return normalized;
}

export function readSettings(): Partial<ProxySettings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<ProxySettings>;
    if (!parsed || typeof parsed !== "object") return {};
    return normalizeSettings(parsed);
  } catch {
    return {};
  }
}

export function getSettings(): ProxySettings {
  return {
    ...defaultSettings,
    ...readSettings(),
  };
}

export function writeSettings(next: ProxySettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(normalizeSettings(next)),
    );
  } catch {
    // Ignore write errors (private mode or quota).
  }
}

export function mergeSettings(
  partial: Partial<ProxySettings>,
): ProxySettings {
  const merged = {
    ...defaultSettings,
    ...readSettings(),
    ...normalizeSettings(partial),
  };
  writeSettings(merged);
  return merged;
}

export function clearSettings() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
