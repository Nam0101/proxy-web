import { NextResponse } from "next/server";
import { defaultHeaders, extractArray, fetchJson } from "../api-keys/helpers";

export const dynamic = "force-dynamic";

function formatError(status?: number) {
  if (status && status > 0) return `Endpoint returned ${status}`;
  return "Unable to reach CLIProxyAPI";
}

function normalizeKeys(value: any) {
  return extractArray(value, "api-keys").filter(
    (entry) => typeof entry === "string" && entry.trim().length > 0,
  ) as string[];
}

async function fetchKeys() {
  const response = await fetchJson("/v0/management/api-keys", {
    headers: defaultHeaders,
  });
  if (!response.ok) {
    return { ok: false, status: response.status, keys: [] as string[] } as const;
  }
  return {
    ok: true,
    status: response.status,
    keys: normalizeKeys(response.data),
  } as const;
}

export async function GET() {
  const response = await fetchKeys();
  const running = response.ok;
  return NextResponse.json({
    running,
    keys: response.keys,
    count: response.keys.length,
    error: running ? null : formatError(response.status),
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const rawKey =
    typeof payload?.key === "string"
      ? payload.key
      : typeof payload?.value === "string"
        ? payload.value
        : typeof payload?.apiKey === "string"
          ? payload.apiKey
          : "";
  const key = rawKey.trim();
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  const current = await fetchKeys();
  if (!current.ok) {
    return NextResponse.json(
      { error: formatError(current.status) },
      { status: 502 },
    );
  }

  const exists = current.keys.includes(key);
  const nextKeys = exists ? current.keys : [...current.keys, key];
  const updated = await fetchJson("/v0/management/api-keys", {
    method: "PUT",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(nextKeys),
  });

  if (!updated.ok) {
    return NextResponse.json(
      { error: formatError(updated.status) },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    keys: nextKeys,
    count: nextKeys.length,
  });
}

export async function DELETE(request: Request) {
  const payload = await request.json().catch(() => null);
  const key = typeof payload?.key === "string" ? payload.key.trim() : "";
  const index = typeof payload?.index === "number" ? payload.index : null;

  if (!key && index === null) {
    return NextResponse.json(
      { error: "key or index is required" },
      { status: 400 },
    );
  }

  const query =
    index !== null
      ? `index=${encodeURIComponent(String(index))}`
      : `value=${encodeURIComponent(key)}`;

  const response = await fetchJson(`/v0/management/api-keys?${query}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: formatError(response.status) },
      { status: 502 },
    );
  }

  const refreshed = await fetchKeys();
  return NextResponse.json({
    ok: true,
    keys: refreshed.keys,
    count: refreshed.keys.length,
  });
}
