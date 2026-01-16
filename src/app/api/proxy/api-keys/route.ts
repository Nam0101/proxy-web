import { NextResponse } from "next/server";

import {
  PROVIDERS,
  convertFromManagementFormat,
  defaultHeaders,
  extractArray,
  fetchJson,
} from "./helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const responses = await Promise.all(
    PROVIDERS.map((provider) =>
      fetchJson(`/v0/management/${provider.endpoint}`, {
        headers: defaultHeaders,
      }).then((result) => ({ provider, result })),
    ),
  );

  const providers = responses.map(({ provider, result }) => {
    if (!result.ok) {
      return {
        id: provider.id,
        label: provider.label,
        endpoint: provider.endpoint,
        keys: [],
        count: 0,
        error:
          typeof result.status === "number" && result.status > 0
            ? `Request returned ${result.status}`
            : "Unable to reach CLIProxyAPI",
      };
    }

    const rawKeys = extractArray(result.data, provider.endpoint);
    const keys = convertFromManagementFormat(rawKeys);
    return {
      id: provider.id,
      label: provider.label,
      endpoint: provider.endpoint,
      keys,
      count: Array.isArray(keys) ? keys.length : 0,
      error: null,
    };
  });

  const running = providers.some((item) => item.count > 0 || !item.error);

  return NextResponse.json({
    running,
    providers,
    updatedAt: new Date().toISOString(),
  });
}
