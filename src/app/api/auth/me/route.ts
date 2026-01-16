import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieName = getSessionCookieName();
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  const token = cookie ? cookie.split("=")[1] : null;
  const username = await verifySessionToken(token);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: username });
}
