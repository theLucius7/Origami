import { describe, expect, it } from "vitest";
import { resolveImapSmtpConfigFromAccount } from "./account-config";

describe("resolveImapSmtpConfigFromAccount", () => {
  it("resolves preset-based IMAP/SMTP config for imap_smtp accounts", () => {
    const config = resolveImapSmtpConfigFromAccount(
      {
        id: "acc-1",
        provider: "imap_smtp",
        email: "user@163.com",
        displayName: "163 Mail",
        credentials: "encrypted",
        presetKey: "163",
        authUser: null,
        imapHost: null,
        imapPort: null,
        imapSecure: 1,
        smtpHost: null,
        smtpPort: null,
        smtpSecure: 1,
        syncCursor: null,
        syncReadBack: 0,
        syncStarBack: 0,
        initialFetchLimit: 200,
        lastSyncedAt: null,
        createdAt: 0,
      },
      { authPass: "auth-code" }
    );

    expect(config).toEqual({
      label: "163 邮箱",
      email: "user@163.com",
      authUser: "user@163.com",
      authPass: "auth-code",
      imap: {
        host: "imap.163.com",
        port: 993,
        secure: true,
      },
      smtp: {
        host: "smtp.163.com",
        port: 465,
        secure: true,
      },
    });
  });

  it("supports custom overrides and legacy QQ credentials", () => {
    const config = resolveImapSmtpConfigFromAccount(
      {
        id: "acc-2",
        provider: "qq",
        email: "qq@example.com",
        displayName: "QQ",
        credentials: "encrypted",
        presetKey: null,
        authUser: null,
        imapHost: null,
        imapPort: null,
        imapSecure: 1,
        smtpHost: null,
        smtpPort: null,
        smtpSecure: 1,
        syncCursor: null,
        syncReadBack: 0,
        syncStarBack: 0,
        initialFetchLimit: 200,
        lastSyncedAt: null,
        createdAt: 0,
      },
      { email: "qq@example.com", authCode: "qq-auth" }
    );

    expect(config.label).toBe("QQ 邮箱");
    expect(config.authUser).toBe("qq@example.com");
    expect(config.authPass).toBe("qq-auth");
    expect(config.imap.host).toBe("imap.qq.com");
    expect(config.smtp.host).toBe("smtp.qq.com");
  });

  it("prefers explicit custom host and port values", () => {
    const config = resolveImapSmtpConfigFromAccount(
      {
        id: "acc-3",
        provider: "imap_smtp",
        email: "admin@example.com",
        displayName: "Custom Mail",
        credentials: "encrypted",
        presetKey: "custom",
        authUser: "mail-admin",
        imapHost: "imap.example.com",
        imapPort: 143,
        imapSecure: 0,
        smtpHost: "smtp.example.com",
        smtpPort: 587,
        smtpSecure: 0,
        syncCursor: null,
        syncReadBack: 0,
        syncStarBack: 0,
        initialFetchLimit: 200,
        lastSyncedAt: null,
        createdAt: 0,
      },
      { authPass: "password" }
    );

    expect(config).toEqual({
      label: "自定义 IMAP/SMTP",
      email: "admin@example.com",
      authUser: "mail-admin",
      authPass: "password",
      imap: {
        host: "imap.example.com",
        port: 143,
        secure: false,
      },
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
      },
    });
  });
});
