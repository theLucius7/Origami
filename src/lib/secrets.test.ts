import { afterEach, describe, expect, it } from "vitest";
import { getAuthSecret, hasGitHubOAuthConfig } from "@/lib/secrets";

const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET;
const ORIGINAL_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ORIGINAL_GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const ORIGINAL_GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET;
  process.env.ENCRYPTION_KEY = ORIGINAL_ENCRYPTION_KEY;
  process.env.GITHUB_CLIENT_ID = ORIGINAL_GITHUB_CLIENT_ID;
  process.env.GITHUB_CLIENT_SECRET = ORIGINAL_GITHUB_CLIENT_SECRET;
  process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("secrets", () => {
  it("falls back to ENCRYPTION_KEY when AUTH_SECRET is missing", () => {
    process.env.AUTH_SECRET = "";
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    expect(getAuthSecret()).toBe(process.env.ENCRYPTION_KEY);
  });

  it("detects GitHub OAuth config", () => {
    process.env.GITHUB_CLIENT_ID = "github-client";
    process.env.GITHUB_CLIENT_SECRET = "github-secret";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(hasGitHubOAuthConfig()).toBe(true);
  });
});
