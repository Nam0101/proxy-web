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
    const text = await response.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { ok: response.ok, status: response.status, data } as const;
  } catch (error) {
    return { ok: false, status: 0, data: null, error } as const;
  } finally {
    clearTimeout(timeout);
  }
}

function extractFiles(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.files)) return value.files;
  if (Array.isArray(value.data)) return value.data;
  return [];
}

function normalizeAuthFile(entry: Record<string, any>) {
  const safe = entry ?? {};
  const id =
    safe.id ??
    safe.name ??
    safe.filename ??
    safe.file ??
    safe.path ??
    "unknown";
  const name = safe.name ?? safe.filename ?? safe.id ?? "unknown";
  const status = safe.status ?? safe.state ?? "unknown";
  const disabled =
    typeof safe.disabled === "boolean" ? safe.disabled : status === "disabled";
  return {
    id: String(id),
    name: String(name),
    provider: safe.provider ?? "unknown",
    label: safe.label ?? null,
    status,
    statusMessage: safe.statusMessage ?? safe.status_message ?? null,
    disabled,
    unavailable: Boolean(safe.unavailable ?? false),
    runtimeOnly: Boolean(safe.runtimeOnly ?? safe.runtime_only ?? false),
    source: safe.source ?? null,
    path: safe.path ?? null,
    size: typeof safe.size === "number" ? safe.size : null,
    modtime: safe.modtime ?? safe.mod_time ?? null,
    email: safe.email ?? null,
    accountType: safe.accountType ?? safe.account_type ?? null,
    account: safe.account ?? null,
    createdAt: safe.createdAt ?? safe.created_at ?? null,
    updatedAt: safe.updatedAt ?? safe.updated_at ?? null,
    lastRefresh: safe.lastRefresh ?? safe.last_refresh ?? null,
    successCount: safe.successCount ?? safe.success_count ?? null,
    failureCount: safe.failureCount ?? safe.failure_count ?? null,
  };
}

function normalizeAuthFiles(payload: any) {
  return extractFiles(payload).map((entry: any) => normalizeAuthFile(entry));
}

export async function GET() {
  const response = await requestJson("/v0/management/auth-files", {
    headers: defaultHeaders,
  });

  if (!response.ok) {
    return NextResponse.json({
      running: false,
      files: [],
      error:
        typeof response.status === "number" && response.status > 0
          ? `Auth files returned ${response.status}`
          : "Unable to reach CLIProxyAPI",
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    running: true,
    files: normalizeAuthFiles(response.data),
    error: null,
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let provider = "";
  let filename = "";
  let file: File | Blob | null = null;

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    provider = typeof body?.provider === "string" ? body.provider : "";
    filename = typeof body?.filename === "string" ? body.filename : "";
    if (typeof body?.content === "string") {
      file = new Blob([body.content], { type: "application/json" });
    }
  } else {
    const form = await request.formData();
    provider = String(form.get("provider") ?? "");
    filename = String(form.get("filename") ?? "");
    const uploaded = form.get("file");
    if (uploaded instanceof File) {
      file = uploaded;
      if (!filename) {
        filename = uploaded.name;
      }
    }
  }

  if (!provider || !file) {
    return NextResponse.json(
      { ok: false, error: "Missing provider or file payload." },
      { status: 400 },
    );
  }

  const formData = new FormData();
  formData.append("provider", provider);
  if (filename) formData.append("filename", filename);
  formData.append("file", file, filename || "auth.json");

  const response = await fetch(`${BASE_URL}/v0/management/auth-files`, {
    method: "POST",
    headers: defaultHeaders,
    body: formData,
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          typeof data === "string"
            ? data
            : data?.error ?? data?.message ?? "Upload failed",
      },
      { status: response.status || 502 },
    );
  }

  return NextResponse.json({ ok: true, data });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name =
    (typeof body?.name === "string" && body.name) ||
    (typeof body?.id === "string" && body.id) ||
    (typeof body?.fileId === "string" && body.fileId) ||
    "";
  const disabledValue =
    typeof body?.disabled === "boolean"
      ? body.disabled
      : typeof body?.enabled === "boolean"
        ? !body.enabled
        : null;

  if (!name || disabledValue === null) {
    return NextResponse.json(
      { ok: false, error: "Missing auth file name or disabled flag." },
      { status: 400 },
    );
  }

  const response = await requestJson(
    `/v0/management/auth-files?name=${encodeURIComponent(name)}`,
    {
      method: "PATCH",
      headers: {
        ...defaultHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, disabled: disabledValue }),
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          typeof response.data === "string"
            ? response.data
            : response.data?.error ?? response.data?.message ?? "Toggle failed",
      },
      { status: response.status || 502 },
    );
  }

  return NextResponse.json({ ok: true, data: response.data ?? null });
}
