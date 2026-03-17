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

describe("QQProvider", () => {
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
    smtpSendMailMock.mockResolvedValue({ messageId: "qq-smtp-msg-1" });
    smtpCloseMock.mockResolvedValue(undefined);
  });

  it("sends mail through QQ SMTP using the same auth code", async () => {
    const { QQProvider } = await import("./qq");

    const provider = new QQProvider({
      email: "qq@example.com",
      authCode: "auth-code",
    });

    const result = await provider.sendMail({
      from: "Origami <qq@example.com>",
      to: ["alice@example.com"],
      cc: ["cc@example.com"],
      bcc: ["bcc@example.com"],
      subject: "Hello QQ",
      textBody: "Plain text body",
      htmlBody: "<p>Hello QQ</p>",
      attachments: [
        {
          filename: "note.txt",
          contentType: "text/plain",
          size: 5,
          content: Buffer.from("hello"),
        },
      ],
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.qq.com",
      port: 465,
      secure: true,
      auth: {
        user: "qq@example.com",
        pass: "auth-code",
      },
    });
    expect(smtpSendMailMock).toHaveBeenCalledWith({
      from: "Origami <qq@example.com>",
      to: ["alice@example.com"],
      cc: ["cc@example.com"],
      bcc: ["bcc@example.com"],
      subject: "Hello QQ",
      text: "Plain text body",
      html: "<p>Hello QQ</p>",
      attachments: [
        {
          filename: "note.txt",
          contentType: "text/plain",
          content: Buffer.from("hello"),
        },
      ],
    });
    expect(result).toEqual({
      ok: true,
      providerMessageId: "qq-smtp-msg-1",
      sentAt: expect.any(Number),
    });
    expect(smtpCloseMock).toHaveBeenCalledTimes(1);
  });

  it("maps invalid QQ auth code to auth-expired send error", async () => {
    smtpSendMailMock.mockRejectedValue({
      responseCode: 535,
      code: "EAUTH",
      response: "535 Error: authentication failed",
      message: "Invalid login",
    });
    const { QQProvider } = await import("./qq");

    const provider = new QQProvider({
      email: "qq@example.com",
      authCode: "expired-auth-code",
    });

    const result = await provider.sendMail({
      from: "qq@example.com",
      to: ["alice@example.com"],
      subject: "Hello QQ",
      textBody: "body",
    });

    expect(result).toEqual({
      ok: false,
      errorCode: "AUTH_EXPIRED",
      errorMessage: "QQ 邮箱授权码或密码无效，请重新检查登录凭据。",
      providerRawError: expect.any(String),
    });
  });

  it("marks a QQ message as read using IMAP \\Seen flag with uid mode", async () => {
    const { QQProvider } = await import("./qq");

    const provider = new QQProvider({
      email: "qq@example.com",
      authCode: "auth-code",
    });

    await provider.markMessageRead("123");

    expect(getMailboxLockMock).toHaveBeenCalledWith("INBOX");
    expect(messageFlagsAddMock).toHaveBeenCalledWith(123, ["\\Seen"], {
      uid: true,
      silent: true,
    });
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("toggles QQ star state with IMAP \\Flagged flag", async () => {
    const { QQProvider } = await import("./qq");

    const provider = new QQProvider({
      email: "qq@example.com",
      authCode: "auth-code",
    });

    await provider.setMessageStarred("456", true);
    await provider.setMessageStarred("456", false);

    expect(messageFlagsAddMock).toHaveBeenCalledWith(456, ["\\Flagged"], {
      uid: true,
      silent: true,
    });
    expect(messageFlagsRemoveMock).toHaveBeenCalledWith(456, ["\\Flagged"], {
      uid: true,
      silent: true,
    });
  });
});
