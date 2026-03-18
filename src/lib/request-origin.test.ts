import { describe, expect, it, vi, afterEach } from "vitest";
import { getPublicOrigin, toPublicUrl, withHttpsPreviewCookieCompat } from "@/lib/request-origin";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("request-origin", () => {
  it("strips an explicit port from the request host", () => {
    const req = new Request("https://sturdy-fiesta-xyz-3000.app.github.dev:3000/api/auth/github/callback");

    expect(getPublicOrigin(req)).toBe("https://sturdy-fiesta-xyz-3000.app.github.dev");
    expect(toPublicUrl(req, "/login?error=github_callback").toString()).toBe(
      "https://sturdy-fiesta-xyz-3000.app.github.dev/login?error=github_callback"
    );
  });

  it("uses forwarded host for local proxy requests", () => {
    const req = new Request("http://localhost:3000/api/auth/github/callback", {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "preview.example.com",
      },
    });

    expect(getPublicOrigin(req)).toBe("https://preview.example.com");
  });

  it("ignores a mismatched forwarded host on public requests", () => {
    const req = new Request("https://origami.example.com/api/auth/github/callback", {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "evil.example.com",
      },
    });

    expect(getPublicOrigin(req)).toBe("https://origami.example.com");
    expect(toPublicUrl(req, "/login").toString()).toBe("https://origami.example.com/login");
  });
});

describe("withHttpsPreviewCookieCompat", () => {
  it("sets SameSite=None + Secure for HTTPS preview requests outside production", () => {
    vi.stubEnv("NODE_ENV", "development");

    const req = new Request("https://preview.example.com/api/auth/github/start", {
      headers: {
        "x-forwarded-proto": "https",
      },
    });

    expect(
      withHttpsPreviewCookieCompat(req, {
        httpOnly: true,
        secure: false,
        sameSite: "lax" as const,
        path: "/",
        maxAge: 600,
      })
    ).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 600,
    });
  });

  it("keeps default cookie settings in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const req = new Request("https://preview.example.com/api/auth/github/start", {
      headers: {
        "x-forwarded-proto": "https",
      },
    });

    expect(
      withHttpsPreviewCookieCompat(req, {
        secure: true,
        sameSite: "lax" as const,
      })
    ).toEqual({
      secure: true,
      sameSite: "lax",
    });
  });
});
