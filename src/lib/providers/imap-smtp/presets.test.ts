import { describe, expect, it } from "vitest";
import { getMailboxPreset, listMailboxPresets, MAILBOX_PRESETS } from "./presets";

describe("MAILBOX_PRESETS", () => {
  it("includes major Chinese mailbox presets and custom", () => {
    expect(MAILBOX_PRESETS.qq.label).toBe("QQ 邮箱");
    expect(MAILBOX_PRESETS["163"].imapHost).toBe("imap.163.com");
    expect(MAILBOX_PRESETS["126"].smtpHost).toBe("smtp.126.com");
    expect(MAILBOX_PRESETS.yeah.smtpHost).toBe("smtp.yeah.net");
    expect(MAILBOX_PRESETS.custom.authType).toBe("password");
  });

  it("returns a preset by key and null for unknown keys", () => {
    expect(getMailboxPreset("qq")?.smtpPort).toBe(465);
    expect(getMailboxPreset("missing")).toBeNull();
  });

  it("lists presets for form rendering", () => {
    expect(listMailboxPresets().map((preset) => preset.key)).toEqual(
      expect.arrayContaining(["qq", "163", "126", "yeah", "custom"])
    );
  });
});
