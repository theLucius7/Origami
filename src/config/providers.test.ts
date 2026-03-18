import { describe, expect, it } from "vitest";
import { getProviderMeta } from "./providers";

describe("provider meta localization", () => {
  it("returns localized labels for mailbox providers", () => {
    expect(getProviderMeta("qq", "zh-TW").label).toBe("QQ 郵箱");
    expect(getProviderMeta("qq", "en").label).toBe("QQ Mail");
    expect(getProviderMeta("imap_smtp", "ja").label).toBe("IMAP / SMTP");
  });

  it("falls back safely for unknown providers", () => {
    expect(getProviderMeta("custom-provider", "en").label).toBe("custom-provider");
  });
});
