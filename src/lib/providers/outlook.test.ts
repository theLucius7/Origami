import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();

vi.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    init: () => ({
      api: (path: string) => ({
        post: (body: unknown) => postMock(path, body),
      }),
    }),
  },
}));

describe("OutlookProvider.sendMail", () => {
  beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue(undefined);
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
});
