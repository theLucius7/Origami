import { afterEach, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./crypto";

const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;

afterEach(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
});

describe("crypto", () => {
  it("round-trips encrypted text", () => {
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const plaintext = "hello origami";
    const encrypted = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("throws when ENCRYPTION_KEY is invalid", () => {
    process.env.ENCRYPTION_KEY = "short";

    expect(() => encrypt("test")).toThrow(/ENCRYPTION_KEY/);
  });

  it("throws when ENCRYPTION_KEY contains non-hex characters", () => {
    process.env.ENCRYPTION_KEY = "g123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde";

    expect(() => encrypt("test")).toThrow(/ENCRYPTION_KEY/);
  });
});
