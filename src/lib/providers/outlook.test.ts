import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();
const patchMock = vi.fn();

vi.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    init: () => ({
      api: (path: string) => ({
        post: (body: unknown) => postMock(path, body),
        patch: (body: unknown) => patchMock(path, body),
      }),
    }),
  },
}));

describe("OutlookProvider", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.OUTLOOK_CLIENT_ID = "outlook-client";
    process.env.OUTLOOK_CLIENT_SECRET = "outlook-secret";
    postMock.mockReset();
    patchMock.mockReset();
    postMock.mockResolvedValue(undefined);
    patchMock.mockResolvedValue(undefined);
  });

  it("builds Graph sendMail JSON payload with recipients and attachments", async () => {
    const { OutlookProvider } = await import("./outlook");

    const provider = new OutlookProvider({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["Mail.Send"],
    });

    const result = await provider.sendMail({
      from: "Origami <origami@example.com>",
      to: ["alice@example.com"],
      cc: ["cc@example.com"],
      bcc: ["bcc@example.com"],
      subject: "Hello Outlook",
      textBody: "Plain text body",
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
      providerMessageId: null,
      sentAt: expect.any(Number),
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    const [path, body] = postMock.mock.calls[0];
    expect(path).toBe("/me/sendMail");
    expect(body).toEqual({
      message: {
        subject: "Hello Outlook",
        body: {
          contentType: "Text",
          content: "Plain text body",
        },
        toRecipients: [{ emailAddress: { address: "alice@example.com" } }],
        ccRecipients: [{ emailAddress: { address: "cc@example.com" } }],
        bccRecipients: [{ emailAddress: { address: "bcc@example.com" } }],
        attachments: [
          {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: "note.txt",
            contentType: "text/plain",
            contentBytes: Buffer.from("hello").toString("base64"),
          },
        ],
      },
      saveToSentItems: true,
    });
  });

  it("writes read/star state through Graph message patch API", async () => {
    const { OutlookProvider } = await import("./outlook");

    const provider = new OutlookProvider({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["Mail.ReadWrite"],
    });

    await provider.markMessageRead("outlook-msg-1");
    await provider.setMessageStarred("outlook-msg-1", true);
    await provider.setMessageStarred("outlook-msg-1", false);

    expect(patchMock).toHaveBeenNthCalledWith(1, "/me/messages/outlook-msg-1", {
      isRead: true,
    });
    expect(patchMock).toHaveBeenNthCalledWith(2, "/me/messages/outlook-msg-1", {
      flag: { flagStatus: "flagged" },
    });
    expect(patchMock).toHaveBeenNthCalledWith(3, "/me/messages/outlook-msg-1", {
      flag: { flagStatus: "notFlagged" },
    });
  });
});
