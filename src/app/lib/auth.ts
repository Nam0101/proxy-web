const SESSION_COOKIE = "proxypal_session";
const DEFAULT_SESSION_TTL_HOURS = 12;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type UserRecord = {
  username: string;
  secret: string;
  algorithm: "plain" | "sha256";
};

type SessionPayload = {
  u: string;
  exp: number;
};

function base64UrlEncodeBytes(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeBytes(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64url"));
  }
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function parseUsers(raw: string | undefined | null): UserRecord[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [username, ...rest] = entry.split(":");
      const secret = rest.join(":");
      if (!username || !secret) return null;
      if (secret.startsWith("sha256:")) {
        return {
          username: username.trim(),
          secret: secret.replace(/^sha256:/, "").trim(),
          algorithm: "sha256" as const,
        };
      }
      return {
        username: username.trim(),
        secret: secret.trim(),
        algorithm: "plain" as const,
      };
    })
    .filter(Boolean) as UserRecord[];
}

function getSessionSecret() {
  return (
    process.env.CLIPROXY_UI_SECRET ||
    process.env.CLIPROXY_MANAGEMENT_KEY ||
    ""
  );
}

function getSessionTtlHours() {
  const value =
    process.env.CLIPROXY_UI_SESSION_TTL_HOURS ??
    process.env.CLIPROXY_UI_SESSION_TTL_HR ??
    "";
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SESSION_TTL_HOURS;
  return parsed;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionTtlSeconds() {
  return Math.round(getSessionTtlHours() * 60 * 60);
}

export async function createSessionToken(username: string) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Missing CLIPROXY_UI_SECRET");
  }
  const expiresAt = Date.now() + getSessionTtlHours() * 60 * 60 * 1000;
  const payload: SessionPayload = { u: username, exp: expiresAt };
  const payloadRaw = JSON.stringify(payload);
  const payloadB64 = base64UrlEncodeBytes(textEncoder.encode(payloadRaw));
  const signature = await hmacSign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  const expected = await hmacSign(payloadB64, secret);
  if (!constantTimeEqual(signature, expected)) return null;
  try {
    const payloadRaw = textDecoder.decode(base64UrlDecodeBytes(payloadB64));
    const payload = JSON.parse(payloadRaw) as SessionPayload;
    if (!payload || typeof payload.u !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (Date.now() > payload.exp) return null;
    return payload.u;
  } catch {
    return null;
  }
}

export async function verifyUserPassword(username: string, password: string) {
  const users = parseUsers(process.env.CLIPROXY_UI_USERS);
  if (!users.length) {
    return { ok: false, error: "UI users not configured" } as const;
  }
  const record = users.find((user) => user.username === username);
  if (!record) return { ok: false, error: "Invalid credentials" } as const;
  if (record.algorithm === "plain") {
    if (constantTimeEqual(record.secret, password)) {
      return { ok: true, username: record.username } as const;
    }
    return { ok: false, error: "Invalid credentials" } as const;
  }
  const hashed = await sha256Hex(password);
  if (constantTimeEqual(record.secret, hashed)) {
    return { ok: true, username: record.username } as const;
  }
  return { ok: false, error: "Invalid credentials" } as const;
}
