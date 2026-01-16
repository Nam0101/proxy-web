import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionTtlSeconds,
  verifyUserPassword,
} from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const username = typeof payload?.username === "string" ? payload.username.trim() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 },
    );
  }

  const result = await verifyUserPassword(username, password);
  if (!result.ok) {
    const status = result.error === "UI users not configured" ? 500 : 401;
    return NextResponse.json({ error: result.error }, { status });
  }

  const token = await createSessionToken(result.username);
  const response = NextResponse.json({ ok: true, user: result.username });

  response.cookies.set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: getSessionTtlSeconds(),
  });

  return response;
}
