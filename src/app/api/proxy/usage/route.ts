import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_URL = (process.env.CLIPROXY_BASE_URL || "http://127.0.0.1:8317").replace(
  /\/$/,
  "",
);
const MANAGEMENT_KEY =
  process.env.CLIPROXY_MANAGEMENT_KEY || "proxypal-mgmt-key";

const defaultHeaders = {
  "X-Management-Key": MANAGEMENT_KEY,
};

async function requestJson(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data } as const;
  } catch (error) {
    return { ok: false, status: 0, data: null, error } as const;
  } finally {
    clearTimeout(timeout);
  }
}

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const pick = (obj: Record<string, any>, keys: string[], fallback: any = 0) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return fallback;
};

const normalizeSeries = (value: any) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (Array.isArray(entry)) {
          const [label, val] = entry;
          return { label: String(label ?? ""), value: toNumber(val, 0) };
        }
        if (typeof entry === "object" && entry !== null) {
          const label =
            entry.label ??
            entry.date ??
            entry.day ??
            entry.name ??
            entry.key ??
            "";
          const val =
            entry.value ?? entry.count ?? entry.requests ?? entry.tokens ?? 0;
          return { label: String(label), value: toNumber(val, 0) };
        }
        if (typeof entry === "string") {
          return { label: entry, value: 0 };
        }
        return null;
      })
      .filter(Boolean) as { label: string; value: number }[];
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([label, val]) => ({
      label,
      value: toNumber(val, 0),
    }));
  }
  return [];
};

const normalizeList = (value: any, nameKey: string) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => ({
      name: entry?.[nameKey] ?? entry?.name ?? entry?.id ?? "unknown",
      requests: toNumber(entry?.requests ?? entry?.count ?? 0, 0),
      tokens: toNumber(entry?.tokens ?? entry?.totalTokens ?? 0, 0),
      inputTokens: toNumber(entry?.inputTokens ?? entry?.input_tokens ?? 0, 0),
      outputTokens: toNumber(entry?.outputTokens ?? entry?.output_tokens ?? 0, 0),
      cachedTokens: toNumber(entry?.cachedTokens ?? entry?.cached_tokens ?? 0, 0),
    }));
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([name, entry]) => ({
      name,
      requests: toNumber((entry as any)?.requests ?? 0, 0),
      tokens: toNumber((entry as any)?.tokens ?? 0, 0),
      inputTokens: toNumber((entry as any)?.input_tokens ?? 0, 0),
      outputTokens: toNumber((entry as any)?.output_tokens ?? 0, 0),
      cachedTokens: toNumber((entry as any)?.cached_tokens ?? 0, 0),
    }));
  }
  return [];
};

export async function GET() {
  const response = await requestJson("/v0/management/usage", {
    headers: defaultHeaders,
  });

  if (!response.ok) {
    return NextResponse.json({
      running: false,
      usage: null,
      error:
        typeof response.status === "number" && response.status > 0
          ? `Usage returned ${response.status}`
          : "Unable to reach CLIProxyAPI",
      updatedAt: new Date().toISOString(),
    });
  }

  const root = response.data ?? {};
  const usage = root.usage ?? root;

  const totalRequests = toNumber(
    pick(usage, ["total_requests", "totalRequests", "requests"], 0),
  );
  const successCount = toNumber(
    pick(usage, ["success_count", "successCount"], 0),
  );
  const failureCount = toNumber(
    pick(usage, ["failure_count", "failureCount"], 0),
  );
  const totalTokens = toNumber(
    pick(usage, ["total_tokens", "totalTokens", "tokens"], 0),
  );
  const inputTokens = toNumber(
    pick(usage, ["input_tokens", "inputTokens"], 0),
  );
  const outputTokens = toNumber(
    pick(usage, ["output_tokens", "outputTokens"], 0),
  );
  const cachedTokens = toNumber(
    pick(usage, ["cached_tokens", "cachedTokens"], 0),
  );

  return NextResponse.json({
    running: true,
    usage: {
      totalRequests,
      successCount,
      failureCount,
      totalTokens,
      inputTokens,
      outputTokens,
      cachedTokens,
      requestsByDay: normalizeSeries(
        pick(usage, ["requests_by_day", "requestsByDay"], []),
      ),
      tokensByDay: normalizeSeries(
        pick(usage, ["tokens_by_day", "tokensByDay"], []),
      ),
      requestsByHour: normalizeSeries(
        pick(usage, ["requests_by_hour", "requestsByHour"], []),
      ),
      tokensByHour: normalizeSeries(
        pick(usage, ["tokens_by_hour", "tokensByHour"], []),
      ),
      models: normalizeList(
        pick(usage, ["models", "model_stats", "modelStats"], []),
        "model",
      ),
      providers: normalizeList(
        pick(usage, ["providers", "provider_stats", "providerStats"], []),
        "provider",
      ),
    },
    error: null,
    updatedAt: new Date().toISOString(),
  });
}
