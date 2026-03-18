import type { NextRequest } from "next/server";

type CookieCompatOptions = {
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none" | boolean;
};

function getRequestUrl(request: NextRequest | Request): URL {
  return "nextUrl" in request ? request.nextUrl : new URL(request.url);
}

function stripExplicitPort(host: string): string {
  return host.replace(/:(\d+)$/, "");
}

function getRequestProto(request: NextRequest | Request): string {
  const headerProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (headerProto) return headerProto;
  return getRequestUrl(request).protocol.replace(":", "");
}

function getRequestHost(request: NextRequest | Request): string {
  return stripExplicitPort(getRequestUrl(request).host);
}

function normalizeForwardedHost(host: string | null): string | null {
  if (!host) return null;

  const firstHost = host.split(",")[0]?.trim();
  if (!firstHost || firstHost.includes("/") || firstHost.includes("@")) {
    return null;
  }

  try {
    return stripExplicitPort(new URL(`https://${firstHost}`).host);
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

export function withHttpsPreviewCookieCompat<T extends CookieCompatOptions>(
  request: NextRequest | Request,
  options: T
): T {
  const proto = getRequestProto(request);
  if (process.env.NODE_ENV !== "production" && proto === "https") {
    return {
      ...options,
      secure: true,
      sameSite: "none",
    } as T;
  }

  return options;
}
