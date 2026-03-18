import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const modifyMock = vi.fn();
const listHistoryMock = vi.fn();
const getMessageMock = vi.fn();
const getProfileMock = vi.fn();

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: class {
        credentials: Record<string, string> = {};
        setCredentials(tokens: Record<string, string>) {
          this.credentials = tokens;
        }
        on() {
          return undefined;
        }
      },
    },
    gmail: () => ({
      users: {
        messages: {
          send: (args: unknown) => sendMock(args),
          modify: (args: unknown) => modifyMock(args),
          get: (args: unknown) => getMessageMock(args),
        },
        history: {
          list: (args: unknown) => listHistoryMock(args),
        },
        getProfile: (args: unknown) => getProfileMock(args),
      },
    }),
  },
}));

describe("GmailProvider", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.GMAIL_CLIENT_ID = "gmail-client";
    process.env.GMAIL_CLIENT_SECRET = "gmail-secret";
    sendMock.mockReset();
    modifyMock.mockReset();
    listHistoryMock.mockReset();
    getMessageMock.mockReset();
    getProfileMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "gmail-message-1" } });
  });

  it("builds RFC 2822 MIME raw payload and sends it via Gmail API", async () => {
    const { GmailProvider } = await import("./gmail");

    const provider = new GmailProvider({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
    });

    const result = await provider.sendMail({
      from: "Origami <origami@example.com>",
      to: ["alice@example.com"],
      cc: ["cc@example.com"],
      bcc: ["bcc@example.com"],
      subject: "Hello Gmail",
      textBody: "Plain text body",
      htmlBody: "<p>Hello <strong>HTML</strong></p>",
      attachments: [
        {
          filename: "hello.txt",
          contentType: "text/plain",
          size: 5,
          content: Buffer.from("hello"),
        },
      ],
    });

    expect(result).toEqual({
      ok: true,
      providerMessageId: "gmail-message-1",
      sentAt: expect.any(Number),
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0] as {
      userId: string;
      requestBody: { raw: string };
    };
    expect(call.userId).toBe("me");

    const decoded = Buffer.from(
      call.requestBody.raw.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");

    expect(decoded).toContain("From: Origami <origami@example.com>");
    expect(decoded).toContain("To: alice@example.com");
    expect(decoded).toContain("Cc: cc@example.com");
    expect(decoded).toContain("Bcc: bcc@example.com");
    expect(decoded).toContain("Subject: Hello Gmail");
    expect(decoded).toContain('Content-Type: multipart/mixed;');
    expect(decoded).toContain('Content-Type: multipart/alternative;');
    expect(decoded).toContain('Content-Type: text/plain; charset=\"UTF-8\"');
    expect(decoded).toContain('Content-Type: text/html; charset=\"UTF-8\"');
    expect(decoded).toContain('Content-Type: text/plain; name=\"hello.txt\"');
    expect(decoded).toContain(Buffer.from("Plain text body").toString("base64"));
    expect(decoded).toContain(Buffer.from("<p>Hello <strong>HTML</strong></p>").toString("base64"));
    expect(decoded).toContain(Buffer.from("hello").toString("base64"));
  });

  it("localizes write-back capability notices", async () => {
    const { GmailProvider, GMAIL_MODIFY_SCOPE } = await import("./gmail");

    const provider = new GmailProvider({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
    });

    expect(provider.getCapabilities("en").readWriteBackNotice).toBe(
      `Reauthorization is required to enable write-back (requires Gmail modify scope: ${GMAIL_MODIFY_SCOPE}).`
    );
    expect(provider.getCapabilities("ja").starWriteBackNotice).toBe(
      `書き戻しを有効にするには再認可が必要です（Gmail modify scope が必要です: ${GMAIL_MODIFY_SCOPE}）。`
    );
  });
});
