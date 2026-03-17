import { afterEach, describe, expect, it } from "vitest";
import { decodeSession, encodeSession } from "@/lib/session";

const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET;
const ORIGINAL_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

afterEach(() => {
  process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET;
  process.env.ENCRYPTION_KEY = ORIGINAL_ENCRYPTION_KEY;
});

describe("session", () => {
  it("encodes and decodes a signed session", async () => {
    process.env.AUTH_SECRET = "test-auth-secret";

    const encoded = await encodeSession({
      githubId: "123",
      githubLogin: "lucius7",
      githubName: "Lucius7",
      githubAvatarUrl: "https://example.com/avatar.png",
      setupComplete: true,
    });

    await expect(decodeSession(encoded)).resolves.toEqual({
      githubId: "123",
      githubLogin: "lucius7",
      githubName: "Lucius7",
      githubAvatarUrl: "https://example.com/avatar.png",
      setupComplete: true,
    });
  });

  it("rejects a tampered session", async () => {
    process.env.AUTH_SECRET = "test-auth-secret";

    const encoded = await encodeSession({
      githubId: "123",
      githubLogin: "lucius7",
      githubName: null,
      githubAvatarUrl: null,
      setupComplete: false,
    });

    const tampered = `${encoded.slice(0, -1)}${encoded.endsWith("a") ? "b" : "a"}`;
    await expect(decodeSession(tampered)).resolves.toBeNull();
  });
});
