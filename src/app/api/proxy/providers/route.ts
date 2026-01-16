import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_URL = (process.env.CLIPROXY_BASE_URL || "http://127.0.0.1:8317").replace(/\/$/, "");
const MANAGEMENT_KEY =
  process.env.CLIPROXY_MANAGEMENT_KEY || "proxypal-mgmt-key";

const PROVIDER_ORDER = [
  "openai",
  "claude",
  "gemini",
  "qwen",
  "iflow",
  "vertex",
  "antigravity",
  "copilot",
];

async function fetchAuthStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${BASE_URL}/api/auth/status`, {
      headers: {
        "X-Management-Key": MANAGEMENT_KEY,
      },
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

function normalizeProviders(providers: Record<string, any>) {
  return PROVIDER_ORDER.map((provider) => {
    const entry = providers?.[provider] || {};
    const authenticated = Boolean(entry.authenticated);
    const accounts = typeof entry.accounts === "number" ? entry.accounts : 0;
    return {
      id: provider,
      authenticated,
      accounts,
      account: entry.account || null,
      error: entry.error || null,
    };
  });
}

export async function GET() {
  const authStatus = await fetchAuthStatus();

  if (!authStatus.ok) {
    return NextResponse.json({
      running: false,
      providers: normalizeProviders({}),
      error:
        typeof authStatus.status === "number" && authStatus.status > 0
          ? `Auth status returned ${authStatus.status}`
          : "Unable to reach CLIProxyAPI",
      updatedAt: new Date().toISOString(),
    });
  }

  const providers = normalizeProviders(authStatus.data?.providers || {});
  const running = authStatus.data?.status === "ok" || providers.some((p) => p.authenticated || p.accounts > 0);

  return NextResponse.json({
    running,
    providers,
    error: null,
    updatedAt: new Date().toISOString(),
  });
}
