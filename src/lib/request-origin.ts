import type { NextRequest } from "next/server";

function stripPort(host: string): string {
  // Only strip explicit :port suffix. Keep IPv6 bracket form intact.
  // Codespaces port domains already encode the port in the hostname (e.g. -3000.app.github.dev),
  // so an additional :3000 can break redirects.
  return host.replace(/:(\d+)$/, "");
}

export function getPublicOrigin(request: NextRequest | Request): string {
  const headers = "headers" in request ? request.headers : new Headers();

  // Prefer forwarded headers set by proxies (Codespaces/Vercel/Cloudflare/etc.)
  const proto = headers.get("x-forwarded-proto") ?? (request as any).nextUrl?.protocol?.replace(":", "") ?? "https";
  const host = headers.get("x-forwarded-host") ?? (request as any).nextUrl?.host ?? new URL((request as any).url).host;

  return `${proto}://${stripPort(host)}`;
}

export function toPublicUrl(request: NextRequest | Request, path: string): URL {
  return new URL(path, getPublicOrigin(request));
}
