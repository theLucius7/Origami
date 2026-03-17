import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const getMailboxLockMock = vi.fn();
const logoutMock = vi.fn();
const messageFlagsAddMock = vi.fn();
const messageFlagsRemoveMock = vi.fn();
const smtpSendMailMock = vi.fn();
const smtpCloseMock = vi.fn();
const createTransportMock = vi.fn(() => ({
  sendMail: smtpSendMailMock,
  close: smtpCloseMock,
}));

vi.mock("imapflow", () => ({
  ImapFlow: class ImapFlow {
    connect = connectMock;
    getMailboxLock = getMailboxLockMock;
    logout = logoutMock;
    messageFlagsAdd = messageFlagsAddMock;
    messageFlagsRemove = messageFlagsRemoveMock;
  },
}));

vi.mock("mailparser", () => ({
  simpleParser: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

describe("ImapSmtpProvider", () => {
  beforeEach(() => {
    connectMock.mockReset();
    getMailboxLockMock.mockReset();
    logoutMock.mockReset();
    messageFlagsAddMock.mockReset();
    messageFlagsRemoveMock.mockReset();
    smtpSendMailMock.mockReset();
    smtpCloseMock.mockReset();
    createTransportMock.mockClear();

    connectMock.mockResolvedValue(undefined);
    getMailboxLockMock.mockResolvedValue({ release: vi.fn() });
    logoutMock.mockResolvedValue(undefined);
    messageFlagsAddMock.mockResolvedValue(true);
    messageFlagsRemoveMock.mockResolvedValue(true);
    smtpSendMailMock.mockResolvedValue({ messageId: "smtp-msg-1" });
    smtpCloseMock.mockResolvedValue(undefined);
  });

  it("uses provided runtime config for SMTP sending", async () => {
    const { ImapSmtpProvider } = await import("./provider");

    const provider = new ImapSmtpProvider({
      label: "163 邮箱",
      email: "user@163.com",
      authUser: "smtp-user",
      authPass: "auth-code",
      imap: { host: "imap.163.com", port: 993, secure: true },
      smtp: { host: "smtp.163.com", port: 465, secure: true },
    });

    const result = await provider.sendMail({
      from: "Origami <user@163.com>",
      to: ["alice@example.com"],
      subject: "Hello 163",
      textBody: "Plain text body",
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.163.com",
      port: 465,
      secure: true,
      auth: {
        user: "smtp-user",
        pass: "auth-code",
      },
    });
    expect(result).toEqual({
      ok: true,
      providerMessageId: "smtp-msg-1",
      sentAt: expect.any(Number),
    });
  });

  it("uses IMAP flags for read and star write-back", async () => {
    const { ImapSmtpProvider } = await import("./provider");

    const provider = new ImapSmtpProvider({
      label: "自定义邮箱",
      email: "admin@example.com",
      authUser: "admin",
      authPass: "password",
      imap: { host: "imap.example.com", port: 143, secure: false },
      smtp: { host: "smtp.example.com", port: 587, secure: false },
    });

    await provider.markMessageRead("123");
    await provider.setMessageStarred("123", true);
    await provider.setMessageStarred("123", false);

    expect(messageFlagsAddMock).toHaveBeenNthCalledWith(1, 123, ["\\Seen"], {
      uid: true,
      silent: true,
    });
    expect(messageFlagsAddMock).toHaveBeenNthCalledWith(2, 123, ["\\Flagged"], {
      uid: true,
      silent: true,
    });
    expect(messageFlagsRemoveMock).toHaveBeenCalledWith(123, ["\\Flagged"], {
      uid: true,
      silent: true,
    });
  });
});
