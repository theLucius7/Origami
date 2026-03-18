import type { NextRequest } from "next/server";

export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none" | boolean;
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
};

function getProto(request: Request | NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return new URL(request.url).protocol.replace(":", "");
}

/**
 * Codespaces/Vercel-style HTTPS preview: in non-production, when the external URL is HTTPS,
 * cookies may need SameSite=None+Secure to survive OAuth redirects.
 */
export function withHttpsPreviewCookieCompat<T extends CookieOptions>(
  request: Request | NextRequest,
  opts: T
): T {
  if (process.env.NODE_ENV === "production") return opts;
  if (getProto(request) !== "https") return opts;

  return {
    ...opts,
    secure: true,
    sameSite: "none",
  };
}
