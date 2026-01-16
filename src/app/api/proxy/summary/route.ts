import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_URL = (process.env.CLIPROXY_BASE_URL || "http://127.0.0.1:8317").replace(/\/$/, "");
const MANAGEMENT_KEY =
  process.env.CLIPROXY_MANAGEMENT_KEY || "proxypal-mgmt-key";
const PROXY_API_KEY = process.env.CLIPROXY_API_KEY || "proxypal-local";

const defaultHeaders = {
  "X-Management-Key": MANAGEMENT_KEY,
};

async function fetchJson(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: null, error } as const;
  } finally {
    clearTimeout(timeout);
  }
}

function countProviderAccounts(providers: Record<string, any>) {
  let connectedProviders = 0;
  let totalAccounts = 0;
  Object.values(providers || {}).forEach((provider) => {
    if (!provider) return;
    const authenticated = Boolean(provider.authenticated);
    const accounts = typeof provider.accounts === "number" ? provider.accounts : 0;
    if (authenticated || accounts > 0) {
      connectedProviders += 1;
      totalAccounts += accounts || 1;
    }
  });
  return { connectedProviders, totalAccounts };
}

function extractArray(value: any, wrapperKey?: string) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (wrapperKey && value[wrapperKey] && Array.isArray(value[wrapperKey])) {
    return value[wrapperKey];
  }
  if (value.files && Array.isArray(value.files)) return value.files;
  return [];
}

async function fetchKeyCount(endpoint: string) {
  const response = await fetchJson(`/v0/management/${endpoint}`, {
    headers: defaultHeaders,
  });
  if (!response.ok) return 0;
  const list = extractArray(response.data, endpoint);
  return list.length;
}

export async function GET() {
  const [
    authStatus,
    authFiles,
    logs,
    usage,
    models,
    geminiKeys,
    claudeKeys,
    codexKeys,
    vertexKeys,
    clientKeys,
  ] = await Promise.all([
    fetchJson("/api/auth/status", { headers: defaultHeaders }),
    fetchJson("/v0/management/auth-files", { headers: defaultHeaders }),
    fetchJson("/v0/management/logs?lines=200", { headers: defaultHeaders }),
    fetchJson("/v0/management/usage", { headers: defaultHeaders }),
    fetchJson("/v1/models", {
      headers: {
        Authorization: `Bearer ${PROXY_API_KEY}`,
      },
    }),
    fetchKeyCount("gemini-api-key"),
    fetchKeyCount("claude-api-key"),
    fetchKeyCount("codex-api-key"),
    fetchKeyCount("vertex-api-key"),
    fetchKeyCount("api-keys"),
  ]);

  const authProviders = authStatus.ok
    ? authStatus.data?.providers || {}
    : {};
  const { connectedProviders, totalAccounts } = countProviderAccounts(
    authProviders,
  );

  const authFilesCount = authFiles.ok
    ? extractArray(authFiles.data, "files").length
    : 0;

  const logsCount = logs.ok
    ? Array.isArray(logs.data?.lines)
      ? logs.data.lines.length
      : 0
    : 0;

  const totalTokens = usage.ok
    ? usage.data?.usage?.total_tokens ?? usage.data?.usage?.totalTokens ?? null
    : null;

  const totalRequests = usage.ok
    ? usage.data?.usage?.total_requests ?? usage.data?.usage?.totalRequests ?? 0
    : 0;

  const successCount = usage.ok
    ? usage.data?.usage?.success_count ?? usage.data?.usage?.successCount ?? 0
    : 0;

  const failureCount = usage.ok
    ? usage.data?.usage?.failure_count ?? usage.data?.usage?.failureCount ?? 0
    : 0;

  const running = authStatus.ok || models.ok;

  const apiKeysCount =
    Number(geminiKeys) +
    Number(claudeKeys) +
    Number(codexKeys) +
    Number(vertexKeys);
  const clientKeysCount = Number(clientKeys);

  return NextResponse.json({
    running,
    connectedProviders,
    totalAccounts,
    authFilesCount,
    logsCount,
    totalTokens,
    totalRequests,
    successCount,
    failureCount,
    apiKeysCount,
    clientKeysCount,
    updatedAt: new Date().toISOString(),
  });
}
