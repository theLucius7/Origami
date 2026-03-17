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

const fetchEmailMock = vi.fn();
const getAccountWithProviderMock = vi.fn();
const persistProviderCredentialsIfNeededMock = vi.fn();
const getEmailRecordByIdMock = vi.fn();
const listEmailAttachmentsMock = vi.fn();
const uploadAttachmentMock = vi.fn();
const buildObjectKeyMock = vi.fn((accountId: string, emailId: string, filename: string) =>
  `key:${accountId}:${emailId}:${filename}`
);

const emailsTable = { name: "emails", id: "emails.id" };
const attachmentsTable = { name: "attachments" };

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "attachment-id"),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: insertMock,
    update: updateMock,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  emails: emailsTable,
  attachments: attachmentsTable,
}));

vi.mock("@/lib/account-providers", () => ({
  getAccountWithProvider: getAccountWithProviderMock,
  persistProviderCredentialsIfNeeded: persistProviderCredentialsIfNeededMock,
}));

vi.mock("@/lib/queries/emails", () => ({
  getEmailRecordById: getEmailRecordByIdMock,
  listEmailAttachments: listEmailAttachmentsMock,
}));

vi.mock("@/lib/r2", () => ({
  buildObjectKey: buildObjectKeyMock,
  uploadAttachment: uploadAttachmentMock,
}));

describe("email-service hydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertValuesMock.mockResolvedValue(undefined);
    updateWhereMock.mockResolvedValue(undefined);
    persistProviderCredentialsIfNeededMock.mockResolvedValue(undefined);
    listEmailAttachmentsMock.mockResolvedValue([]);
  });

  it("marks empty-body remote messages as hydrated instead of treating them as unhydrated forever", async () => {
    const baseEmail = {
      id: "email-1",
      accountId: "acc-1",
      remoteId: "remote-1",
      messageId: "message-1",
      subject: "Hello",
      sender: "alice@example.com",
      recipients: "[]",
      snippet: "snippet",
      bodyText: null,
      bodyHtml: null,
      hydrationStatus: "metadata",
      hydratedAt: null,
      hydrationError: null,
      isRead: 0,
      isStarred: 0,
      readWriteBackStatus: "idle",
      readWriteBackAt: null,
      readWriteBackError: null,
      starWriteBackStatus: "idle",
      starWriteBackAt: null,
      starWriteBackError: null,
      localDone: 0,
      localArchived: 0,
      localSnoozeUntil: null,
      localLabels: "[]",
      receivedAt: 1710000000,
      folder: "INBOX",
      rawHeaders: null,
      createdAt: 1710000000,
    };

    const hydratedEmail = {
      ...baseEmail,
      recipients: JSON.stringify(["bob@example.com"]),
      bodyText: "",
      bodyHtml: "",
      hydrationStatus: "hydrated",
      hydratedAt: 1710000100,
      isRead: 1,
      isStarred: 1,
    };

    fetchEmailMock.mockResolvedValue({
      remoteId: "remote-1",
      messageId: "message-1",
      subject: "Hello",
      sender: "alice@example.com",
      recipients: ["bob@example.com"],
      snippet: "snippet",
      bodyText: "",
      bodyHtml: "",
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
    });

    getAccountWithProviderMock.mockResolvedValue({
      account: { id: "acc-1" },
      provider: { fetchEmail: fetchEmailMock },
    });
    getEmailRecordByIdMock.mockResolvedValue(hydratedEmail);

    const { hydrateEmailIfNeeded } = await import("./email-service");
    const result = await hydrateEmailIfNeeded(baseEmail as never);

    expect(result).toEqual(hydratedEmail);
    expect(updateSetMock).toHaveBeenCalledWith(
      emailsTable,
      expect.objectContaining({
        hydrationStatus: "hydrating",
        hydrationError: null,
      })
    );
    expect(updateSetMock).toHaveBeenCalledWith(
      emailsTable,
      expect.objectContaining({
        remoteId: "remote-1",
        messageId: "message-1",
        bodyText: "",
        bodyHtml: "",
        hydrationStatus: "hydrated",
        hydrationError: null,
        isRead: 1,
        isStarred: 1,
      })
    );
    expect(uploadAttachmentMock).not.toHaveBeenCalled();
  });
});
