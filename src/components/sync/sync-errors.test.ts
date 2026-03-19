import { describe, expect, it } from "vitest";
import { getSyncFailureMessage } from "./sync-errors";

describe("getSyncFailureMessage", () => {
  it("localizes unknown runtime sync failures to a generic user-facing message", () => {
    expect(
      getSyncFailureMessage("zh-CN", {
        error: "getaddrinfo ENOTFOUND imap.example.com",
        errorCode: "UNKNOWN",
      })
    ).toBe("操作失败，请稍后重试。");
  });

  it("preserves raw text when no error code is available", () => {
    expect(getSyncFailureMessage("en", { error: "plain failure" })).toBe("plain failure");
  });
});
