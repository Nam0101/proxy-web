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

async function fetchJson(path: string, init?: RequestInit) {
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

function clampLines(value: number) {
  if (!Number.isFinite(value)) return 200;
  return Math.min(1000, Math.max(10, Math.trunc(value)));
}

function extractLines(data: unknown) {
  if (!data) return [] as unknown[];
  if (Array.isArray(data)) return data;
  if (
    typeof data === "object" &&
    data !== null &&
    "lines" in data &&
    Array.isArray((data as { lines?: unknown[] }).lines)
  ) {
    return (data as { lines: unknown[] }).lines;
  }
  if (
    typeof data === "object" &&
    data !== null &&
    "logs" in data &&
    Array.isArray((data as { logs?: unknown[] }).logs)
  ) {
    return (data as { logs: unknown[] }).logs;
  }
  return [] as unknown[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linesParam = Number(searchParams.get("lines") ?? "200");
  const lines = clampLines(linesParam);

  const response = await fetchJson(`/v0/management/logs?lines=${lines}`, {
    headers: defaultHeaders,
  });

  if (!response.ok) {
    return NextResponse.json({
      ok: false,
      lines: [],
      error:
        typeof response.status === "number" && response.status > 0
          ? `Logs returned ${response.status}`
          : "Unable to reach CLIProxyAPI",
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    ok: true,
    lines: extractLines(response.data),
    error: null,
    updatedAt: new Date().toISOString(),
  });
}
