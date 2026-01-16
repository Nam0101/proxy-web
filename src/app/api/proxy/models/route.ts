import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_URL = (process.env.CLIPROXY_BASE_URL || "http://127.0.0.1:8317").replace(/\/$/, "");
const PROXY_API_KEY = process.env.CLIPROXY_API_KEY || "proxypal-local";

function normalizeModels(payload: any) {
  const raw = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : Array.isArray(payload)
        ? payload
        : [];

  return raw.map((model: any) => ({
    id: model?.id ?? model?.name ?? "unknown",
    ownedBy: model?.owned_by ?? model?.ownedBy ?? model?.provider ?? null,
    source: model?.source ?? null,
  }));
}

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${BASE_URL}/v1/models`, {
      headers: {
        Authorization: `Bearer ${PROXY_API_KEY}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch models (${response.status})`,
          models: [],
        },
        { status: response.status },
      );
    }

    const models = normalizeModels(data);

    return NextResponse.json({
      models,
      count: models.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        models: [],
      },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
