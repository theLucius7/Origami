import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("googleapis", () => {
  class OAuth2 {
    credentials: Record<string, string> = {};
    setCredentials(creds: Record<string, string>) {
      this.credentials = creds;
    }
    on() {
      return undefined;
    }
  }

  return {
    google: {
      auth: { OAuth2 },
      gmail: () => ({
        users: {
          messages: {
            send: sendMock,
          },
        },
      }),
    },
  };
});

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

describe("GmailProvider.sendMail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "gmail-message-1" } });
    process.env.GMAIL_CLIENT_ID = "client-id";
    process.env.GMAIL_CLIENT_SECRET = "client-secret";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
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
      htmlBody: "<p>Hello</p>",
      attachments: [
        {
          filename: "note.txt",
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
    const payload = sendMock.mock.calls[0][0];
    expect(payload.userId).toBe("me");
    expect(payload.requestBody.raw).toEqual(expect.any(String));

    const mime = decodeBase64Url(payload.requestBody.raw as string);
    expect(mime).toContain("From: Origami <origami@example.com>");
    expect(mime).toContain("To: alice@example.com");
    expect(mime).toContain("Cc: cc@example.com");
    expect(mime).toContain("Bcc: bcc@example.com");
    expect(mime).toContain("Subject: Hello Gmail");
    expect(mime).toContain("multipart/mixed");
    expect(mime).toContain('filename="note.txt"');
    expect(mime).toContain(Buffer.from("hello").toString("base64"));
  });
});
