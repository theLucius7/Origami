import { beforeEach, describe, expect, it, vi } from "vitest";

const insertValuesMock = vi.fn();
const insertMock = vi.fn((table: unknown) => ({
  values: (values: unknown) => insertValuesMock(table, values),
}));

const updateWhereMock = vi.fn();
const updateSetMock = vi.fn((table: unknown, values: unknown) => ({
  where: (whereClause: unknown) => updateWhereMock(table, values, whereClause),
}));
const updateMock = vi.fn((table: unknown) => ({
  set: (values: unknown) => updateSetMock(table, values),
}));

const selectLimitMock = vi.fn();
const selectWhereMock = vi.fn(() => ({
  limit: (value: number) => selectLimitMock(value),
}));
const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));
const selectMock = vi.fn(() => ({ from: selectFromMock }));

const syncEmailsMock = vi.fn();
const getAccountWithProviderMock = vi.fn();
const persistProviderCredentialsIfNeededMock = vi.fn();
const uploadAttachmentMock = vi.fn();
const buildObjectKeyMock = vi.fn((accountId: string, emailId: string, filename: string) =>
  `key:${accountId}:${emailId}:${filename}`
);

const emailsTable = {
  name: "emails",
  id: "emails.id",
  accountId: "emails.accountId",
  messageId: "emails.messageId",
  remoteId: "emails.remoteId",
};
const attachmentsTable = { name: "attachments" };
const accountsTable = { name: "accounts", id: "accounts.id" };

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "generated-id"),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: insertMock,
    update: updateMock,
    select: selectMock,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  emails: emailsTable,
  attachments: attachmentsTable,
  accounts: accountsTable,
}));

vi.mock("@/lib/account-providers", () => ({
  getAccountWithProvider: getAccountWithProviderMock,
  persistProviderCredentialsIfNeeded: persistProviderCredentialsIfNeededMock,
}));

vi.mock("@/lib/r2", () => ({
  buildObjectKey: buildObjectKeyMock,
  uploadAttachment: uploadAttachmentMock,
}));

vi.mock("@/lib/queries/accounts", () => ({
  getAccountRecordById: vi.fn(),
  listAccounts: vi.fn(),
}));

describe("sync-service", () => {
  const account = {
    id: "acc-1",
    provider: "gmail",
    email: "user@example.com",
    displayName: null,
    credentials: "encrypted",
    oauthAppId: null,
    presetKey: null,
    authUser: null,
    imapHost: null,
    imapPort: null,
    imapSecure: 1,
    smtpHost: null,
    smtpPort: null,
    smtpSecure: 1,
    syncCursor: "cursor-1",
    syncReadBack: 0,
    syncStarBack: 0,
    initialFetchLimit: 50,
    lastSyncedAt: null,
    createdAt: 0,
  };

  const provider = {
    syncEmails: syncEmailsMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getAccountWithProviderMock.mockResolvedValue({ account, provider });
    persistProviderCredentialsIfNeededMock.mockResolvedValue(undefined);
    uploadAttachmentMock.mockResolvedValue(undefined);
    selectLimitMock.mockResolvedValue([]);
    updateWhereMock.mockResolvedValue(undefined);
    insertValuesMock.mockImplementation(async () => undefined);
  });

  it("updates remote read/star state without wiping hydrated bodies on duplicate metadata sync", async () => {
    syncEmailsMock.mockResolvedValue({
      emails: [
        {
          remoteId: "remote-1",
          messageId: "message-1",
          subject: "Hello",
          sender: "alice@example.com",
          recipients: ["bob@example.com"],
          snippet: "snippet",
          bodyText: null,
          bodyHtml: null,
          isRead: true,
          isStarred: true,
          receivedAt: 1710000000,
          folder: "INBOX",
          attachments: [
            {
              filename: "empty.txt",
              contentType: "text/plain",
              size: 0,
              content: Buffer.alloc(0),
            },
          ],
        },
      ],
      removedRemoteIds: [],
      newCursor: "cursor-2",
    });

    insertValuesMock.mockImplementation(async (table: { name: string }) => {
      if (table.name === "emails") {
        throw new Error("UNIQUE constraint failed: emails.account_id, emails.message_id");
      }
      return undefined;
    });
    selectLimitMock.mockResolvedValue([{ id: "email-existing" }]);

    const { syncSingleAccount } = await import("./sync-service");
    const result = await syncSingleAccount(account as never);

    expect(result).toEqual({ synced: 0 });
    expect(syncEmailsMock).toHaveBeenCalledWith("cursor-1", {
      limit: 50,
      metadataOnly: true,
    });

    const emailUpdate = updateSetMock.mock.calls.find(([table]) => table === emailsTable);
    expect(emailUpdate).toBeTruthy();
    expect(emailUpdate?.[1]).toMatchObject({
      accountId: "acc-1",
      remoteId: "remote-1",
      messageId: "message-1",
      subject: "Hello",
      sender: "alice@example.com",
      recipients: JSON.stringify(["bob@example.com"]),
      snippet: "snippet",
      isRead: 1,
      isStarred: 1,
      receivedAt: 1710000000,
      folder: "INBOX",
    });
    expect(emailUpdate?.[1]).not.toHaveProperty("bodyText");
    expect(emailUpdate?.[1]).not.toHaveProperty("bodyHtml");

    const accountUpdate = updateSetMock.mock.calls.find(([table]) => table === accountsTable);
    expect(accountUpdate?.[1]).toMatchObject({ syncCursor: "cursor-2" });
    expect(typeof (accountUpdate?.[1] as { lastSyncedAt: unknown }).lastSyncedAt).toBe("number");

    expect(uploadAttachmentMock).not.toHaveBeenCalled();
    expect(persistProviderCredentialsIfNeededMock).toHaveBeenCalledWith(account, provider);
  });

  it("inserts new emails with remote flags and uploads non-empty attachments", async () => {
    syncEmailsMock.mockResolvedValue({
      emails: [
        {
          remoteId: "remote-2",
          messageId: "message-2",
          subject: "World",
          sender: "carol@example.com",
          recipients: ["dave@example.com"],
          snippet: "preview",
          bodyText: "plain body",
          bodyHtml: "<p>plain body</p>",
          isRead: false,
          isStarred: true,
          receivedAt: 1710000100,
          folder: "INBOX",
          attachments: [
            {
              filename: "note.txt",
              contentType: "text/plain",
              size: 5,
              content: Buffer.from("hello"),
            },
          ],
        },
      ],
      removedRemoteIds: [],
      newCursor: "cursor-3",
    });

    const { syncSingleAccount } = await import("./sync-service");
    const result = await syncSingleAccount(account as never);

    expect(result).toEqual({ synced: 1 });

    expect(insertValuesMock).toHaveBeenCalledWith(
      emailsTable,
      expect.objectContaining({
        id: "generated-id",
        accountId: "acc-1",
        remoteId: "remote-2",
        messageId: "message-2",
        bodyText: "plain body",
        bodyHtml: "<p>plain body</p>",
        isRead: 0,
        isStarred: 1,
      })
    );

    expect(buildObjectKeyMock).toHaveBeenCalledWith("acc-1", "generated-id", "note.txt");
    expect(uploadAttachmentMock).toHaveBeenCalledWith(
      "key:acc-1:generated-id:note.txt",
      Buffer.from("hello"),
      "text/plain"
    );
    expect(insertValuesMock).toHaveBeenCalledWith(
      attachmentsTable,
      expect.objectContaining({
        emailId: "generated-id",
        filename: "note.txt",
        contentType: "text/plain",
        size: 5,
        r2ObjectKey: "key:acc-1:generated-id:note.txt",
      })
    );
  });

  it("marks tombstoned remote messages as removed from inbox", async () => {
    syncEmailsMock.mockResolvedValue({
      emails: [],
      removedRemoteIds: ["remote-deleted-1", "remote-deleted-2"],
      newCursor: "cursor-4",
    });

    const { syncSingleAccount } = await import("./sync-service");
    const result = await syncSingleAccount(account as never);

    expect(result).toEqual({ synced: 0 });

    const tombstoneUpdate = updateSetMock.mock.calls.find(
      ([table, values]) =>
        table === emailsTable &&
        (values as { folder?: string }).folder === "REMOTE_REMOVED"
    );
    expect(tombstoneUpdate).toBeTruthy();
  });
});
