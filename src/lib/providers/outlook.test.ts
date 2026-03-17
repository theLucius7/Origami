import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();
const patchMock = vi.fn();
const getMock = vi.fn();

vi.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    init: () => ({
      api: (path: string) => {
        const request = {
          select: vi.fn(() => request),
          expand: vi.fn(() => request),
          get: () => getMock(path),
          post: (body: unknown) => postMock(path, body),
          patch: (body: unknown) => patchMock(path, body),
        };
        return request;
      },
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
    getMock.mockReset();
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

  it("bootstraps a delta cursor during initial sync and maps remote state", async () => {
    const { OutlookProvider } = await import("./outlook");

    getMock.mockImplementation(async (path: string) => {
      if (path.startsWith("/me/mailFolders/inbox/messages?%24orderby=receivedDateTime+desc")) {
        return {
          value: [
            {
              id: "msg-1",
              internetMessageId: "internet-1",
              subject: "Newest",
              from: { emailAddress: { address: "alice@example.com" } },
              toRecipients: [{ emailAddress: { address: "bob@example.com" } }],
              receivedDateTime: "2026-03-17T13:00:00.000Z",
              bodyPreview: "preview-1",
              isRead: false,
              flag: { flagStatus: "flagged" },
            },
            {
              id: "msg-2",
              internetMessageId: "internet-2",
              subject: "Older",
              from: { emailAddress: { address: "carol@example.com" } },
              toRecipients: [{ emailAddress: { address: "dave@example.com" } }],
              receivedDateTime: "2026-03-16T13:00:00.000Z",
              bodyPreview: "preview-2",
              isRead: true,
              flag: { flagStatus: "notFlagged" },
            },
          ],
        };
      }

      if (path.startsWith("/me/mailFolders/inbox/messages/delta?")) {
        expect(path).toContain("%24filter=receivedDateTime+ge+2026-03-16T13%3A00%3A00.000Z");
        return {
          value: [],
          "@odata.deltaLink": "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=seed-1",
        };
      }

      throw new Error(`Unexpected GET ${path}`);
    });

    const provider = new OutlookProvider({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["Mail.Read"],
    });

    const result = await provider.syncEmails(null, { limit: 2, metadataOnly: true });

    expect(result.newCursor).toBe(
      "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=seed-1"
    );
    expect(result.removedRemoteIds).toEqual([]);
    expect(result.emails).toEqual([
      expect.objectContaining({
        remoteId: "msg-1",
        messageId: "internet-1",
        isRead: false,
        isStarred: true,
        bodyText: null,
      }),
      expect.objectContaining({
        remoteId: "msg-2",
        messageId: "internet-2",
        isRead: true,
        isStarred: false,
        bodyText: null,
      }),
    ]);
  });

  it("uses deltaLink for incremental sync and ignores removed tombstones", async () => {
    const { OutlookProvider } = await import("./outlook");

    getMock.mockResolvedValue({
      value: [
        {
          id: "msg-3",
          internetMessageId: "internet-3",
          subject: "Changed",
          from: { emailAddress: { address: "eve@example.com" } },
          toRecipients: [{ emailAddress: { address: "frank@example.com" } }],
          receivedDateTime: "2026-03-17T15:00:00.000Z",
          bodyPreview: "preview-3",
          isRead: true,
          flag: { flagStatus: "flagged" },
        },
        {
          id: "msg-deleted",
          "@removed": { reason: "deleted" },
        },
      ],
      "@odata.deltaLink": "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=seed-2",
    });

    const provider = new OutlookProvider({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["Mail.Read"],
    });

    const result = await provider.syncEmails(
      "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=seed-1",
      { metadataOnly: true }
    );

    expect(getMock).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=seed-1"
    );
    expect(result).toEqual({
      emails: [
        expect.objectContaining({
          remoteId: "msg-3",
          messageId: "internet-3",
          isRead: true,
          isStarred: true,
        }),
      ],
      removedRemoteIds: ["msg-deleted"],
      newCursor: "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=seed-2",
    });
  });
});
