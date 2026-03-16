import { NextRequest, NextResponse } from "next/server";
import { getTokenCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  const expected = process.env.ACCESS_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getTokenCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
