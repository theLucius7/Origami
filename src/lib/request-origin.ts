import type { NextRequest } from "next/server";

function getRequestUrl(request: NextRequest | Request): URL {
  return "nextUrl" in request ? request.nextUrl : new URL(request.url);
}

function stripExplicitPort(host: string): string {
  return host.replace(/:(\d+)$/, "");
}

function normalizeHost(host: string, hostname?: string): string {
  if (!host) return host;
  const resolvedHostname =
    hostname ??
    (() => {
      try {
        return new URL(`https://${host}`).hostname;
      } catch {
        return stripExplicitPort(host);
      }
    })();

  if (isLocalHostname(resolvedHostname)) {
    return host;
  }

  return stripExplicitPort(host);
}

function getRequestProto(request: NextRequest | Request): string {
  const headerProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (headerProto) return headerProto;
  return getRequestUrl(request).protocol.replace(":", "");
}

function getRequestHost(request: NextRequest | Request): string {
  const requestUrl = getRequestUrl(request);
  return normalizeHost(requestUrl.host, requestUrl.hostname);
}

function normalizeForwardedHost(host: string | null): string | null {
  if (!host) return null;

  const firstHost = host.split(",")[0]?.trim();
  if (!firstHost || firstHost.includes("/") || firstHost.includes("@")) {
    return null;
  }

  try {
    const parsed = new URL(`https://${firstHost}`);
    return normalizeHost(parsed.host, parsed.hostname);
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function getPublicOrigin(request: NextRequest | Request): string {
  const requestUrl = getRequestUrl(request);
  const requestHost = getRequestHost(request);
  const requestProto = requestUrl.protocol.replace(":", "");

  const forwardedHost = normalizeForwardedHost(request.headers.get("x-forwarded-host"));
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedHost && forwardedProto) {
    const sameHost = forwardedHost === requestHost;
    const localProxy = isLocalHostname(requestUrl.hostname);

    if (sameHost || localProxy) {
      return `${forwardedProto}://${forwardedHost}`;
    }
  }

  return `${getRequestProto(request)}://${requestHost}`;
}

export function toPublicUrl(request: NextRequest | Request, path: string): URL {
  return new URL(path, getPublicOrigin(request));
}

// Back-compat re-export: cookie compat logic is centralized in src/lib/cookie-compat.ts
export { withHttpsPreviewCookieCompat } from "@/lib/cookie-compat";
