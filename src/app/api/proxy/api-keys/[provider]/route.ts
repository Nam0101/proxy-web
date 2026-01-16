import { NextResponse } from "next/server";

import {
  PROVIDERS,
  convertFromManagementFormat,
  convertToManagementFormat,
  defaultHeaders,
  extractArray,
  fetchJson,
  getProviderByEndpoint,
} from "../helpers";

export const dynamic = "force-dynamic";

function getProvider(providerId: string) {
  return (
    PROVIDERS.find((provider) => provider.id === providerId) ??
    getProviderByEndpoint(providerId)
  );
}

async function fetchKeys(endpoint: string) {
  const result = await fetchJson(`/v0/management/${endpoint}`, {
    headers: defaultHeaders,
  });
  if (!result.ok) {
    return { ok: false, status: result.status, data: [] as any[] } as const;
  }
  const rawKeys = extractArray(result.data, endpoint);
  const keys = convertFromManagementFormat(rawKeys) as any[];
  return { ok: true, status: result.status, data: keys } as const;
}

async function putKeys(endpoint: string, keys: any[]) {
  const payload = convertToManagementFormat(keys);
  return fetchJson(`/v0/management/${endpoint}`, {
    method: "PUT",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function fallbackAdd(endpoint: string, entry: any) {
  const list = await fetchKeys(endpoint);
  if (!list.ok) return { ok: false, status: list.status } as const;
  const next = [...list.data, entry];
  const update = await putKeys(endpoint, next);
  return update.ok
    ? ({ ok: true } as const)
    : ({ ok: false, status: update.status } as const);
}

async function fallbackDelete(
  endpoint: string,
  options: { index?: number; apiKey?: string },
) {
  const list = await fetchKeys(endpoint);
  if (!list.ok) return { ok: false, status: list.status } as const;
  const next = [...list.data];
  let removed = false;
  if (typeof options.index === "number") {
    if (options.index >= 0 && options.index < next.length) {
      next.splice(options.index, 1);
      removed = true;
    }
  } else if (options.apiKey) {
    const index = next.findIndex((item) => item?.apiKey === options.apiKey);
    if (index >= 0) {
      next.splice(index, 1);
      removed = true;
    }
  }

  if (!removed) {
    return { ok: false, status: 404 } as const;
  }

  const update = await putKeys(endpoint, next);
  return update.ok
    ? ({ ok: true } as const)
    : ({ ok: false, status: update.status } as const);
}

export async function POST(
  request: Request,
  { params }: { params: { provider: string } },
) {
  const provider = getProvider(params.provider);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  const payload = convertToManagementFormat(body);
  const result = await fetchJson(`/v0/management/${provider.endpoint}`, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  if ([404, 405, 501].includes(result.status)) {
    const fallback = await fallbackAdd(provider.endpoint, body);
    if (fallback.ok) return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    {
      error:
        typeof result.status === "number" && result.status > 0
          ? `Request returned ${result.status}`
          : "Unable to reach CLIProxyAPI",
    },
    { status: 502 },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: { provider: string } },
) {
  const provider = getProvider(params.provider);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  const payload = convertToManagementFormat(body);
  const result = await fetchJson(`/v0/management/${provider.endpoint}`, {
    method: "DELETE",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  if ([404, 405, 501].includes(result.status)) {
    const fallback = await fallbackDelete(provider.endpoint, {
      index: typeof (body as any).index === "number" ? (body as any).index : undefined,
      apiKey: typeof (body as any).apiKey === "string" ? (body as any).apiKey : undefined,
    });
    if (fallback.ok) return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    {
      error:
        typeof result.status === "number" && result.status > 0
          ? `Request returned ${result.status}`
          : "Unable to reach CLIProxyAPI",
    },
    { status: 502 },
  );
}
