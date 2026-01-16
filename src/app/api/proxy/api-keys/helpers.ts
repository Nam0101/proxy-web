const BASE_URL = (process.env.CLIPROXY_BASE_URL || "http://127.0.0.1:8317").replace(/\/$/, "");
const MANAGEMENT_KEY =
  process.env.CLIPROXY_MANAGEMENT_KEY || "proxypal-mgmt-key";

export const defaultHeaders = {
  "X-Management-Key": MANAGEMENT_KEY,
};

export const PROVIDERS = [
  { id: "gemini", label: "Gemini", endpoint: "gemini-api-key" },
  { id: "claude", label: "Claude", endpoint: "claude-api-key" },
  { id: "codex", label: "Codex", endpoint: "codex-api-key" },
  { id: "vertex", label: "Vertex", endpoint: "vertex-api-key" },
] as const;

const KEY_RENAMES: Array<[string, string]> = [
  ["api-key", "apiKey"],
  ["base-url", "baseUrl"],
  ["proxy-url", "proxyUrl"],
  ["excluded-models", "excludedModels"],
  ["api-key-entries", "apiKeyEntries"],
  ["project-id", "projectId"],
];

const REVERSE_KEY_RENAMES = KEY_RENAMES.map(([from, to]) => [to, from]);

function convertKeys<T>(value: T, mappings: Array<[string, string]>) {
  try {
    let json = JSON.stringify(value);
    mappings.forEach(([from, to]) => {
      json = json.replaceAll(`"${from}"`, `"${to}"`);
    });
    return JSON.parse(json) as T;
  } catch {
    return value;
  }
}

export function convertFromManagementFormat<T>(value: T) {
  return convertKeys(value, KEY_RENAMES);
}

export function convertToManagementFormat<T>(value: T) {
  return convertKeys(value, REVERSE_KEY_RENAMES);
}

export function extractArray(value: any, wrapperKey: string) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") {
    const candidate = value?.[wrapperKey];
    if (Array.isArray(candidate)) return candidate;
    if (candidate == null) return [];
  }
  return [];
}

export async function fetchJson(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data } as const;
  } catch (error) {
    return { ok: false, status: 0, data: null, error } as const;
  } finally {
    clearTimeout(timeout);
  }
}

export function getProviderByEndpoint(endpoint: string) {
  return PROVIDERS.find((provider) => provider.endpoint === endpoint) ?? null;
}
