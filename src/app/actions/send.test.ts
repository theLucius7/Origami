import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAccount = {
  id: "acc-1",
  provider: "gmail",
  email: "origami@example.com",
  displayName: "Origami",
  credentials: "encrypted-creds",
};

const insertedRows: Array<{ table: unknown; payload: unknown }> = [];
const revalidateMailboxPagesMock = vi.fn();

const schemaMock = {
  accounts: { name: "accounts", id: "accounts.id" },
  composeUploads: { name: "compose_uploads", id: "compose_uploads.id" },
  sentMessages: { name: "sent_messages" },
  sentMessageAttachments: { name: "sent_message_attachments", sentMessageId: "sent_message_attachments.sent_message_id" },
};

const providerMock = {
  getCapabilities: vi.fn(() => ({ canSend: true })),
  sendMail: vi.fn(async () => ({
    ok: true as const,
    providerMessageId: "provider-msg-1",
    sentAt: 1_763_680_000,
  })),
};

vi.mock("@/lib/db/schema", () => schemaMock);
vi.mock("@/lib/account-providers", () => ({
  getAccountWithProvider: vi.fn(async () => ({ account: mockAccount, provider: providerMock })),
  persistProviderCredentialsIfNeeded: vi.fn(async () => undefined),
}));
vi.mock("@/lib/revalidate", () => ({
  revalidateMailboxPages: revalidateMailboxPagesMock,
}));
vi.mock("@/lib/queries/sent-messages", () => ({
  getSentMessageDetailRecord: vi.fn(),
  getSentMessageRecordById: vi.fn(),
  listSentMessageAttachments: vi.fn(),
  listSentMessages: vi.fn(),
}));
vi.mock("@/lib/r2", () => ({
  downloadAttachmentBuffer: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          if (table === schemaMock.accounts) return [mockAccount];
          if (table === schemaMock.composeUploads) return [];
          return [];
        },
        orderBy: () => [],
      }),
    }),
    insert: (table: unknown) => ({
      values: async (payload: unknown) => {
        insertedRows.push({ table, payload });
      },
    }),
    update: () => ({
      set: () => ({
        where: async () => undefined,
      }),
    }),
    delete: () => ({
      where: async () => undefined,
    }),
  },
}));

describe("sendMailAction", () => {
  beforeEach(() => {
    insertedRows.length = 0;
    revalidateMailboxPagesMock.mockClear();
    providerMock.getCapabilities.mockClear();
    providerMock.sendMail.mockClear();
    providerMock.getCapabilities.mockReturnValue({ canSend: true });
    providerMock.sendMail.mockResolvedValue({
      ok: true,
      providerMessageId: "provider-msg-1",
      sentAt: 1_763_680_000,
    });
  });

  it("sends via provider and writes a local sent record", async () => {
    const { sendMailAction } = await import("./send");

    const result = await sendMailAction({
      accountId: "acc-1",
      from: "Origami <origami@example.com>",
      to: ["alice@example.com"],
      cc: ["cc@example.com"],
      bcc: ["bcc@example.com"],
      subject: "Hello",
      textBody: "This is a test message.",
      attachmentIds: [],
    });

    expect(result).toMatchObject({
      ok: true,
      providerMessageId: "provider-msg-1",
      localMessageId: expect.any(String),
    });

    expect(providerMock.sendMail).toHaveBeenCalledWith({
      from: "Origami <origami@example.com>",
      to: ["alice@example.com"],
      cc: ["cc@example.com"],
      bcc: ["bcc@example.com"],
      subject: "Hello",
      textBody: "This is a test message.",
      htmlBody: undefined,
      attachments: [],
    });

    const sentInsert = insertedRows.find((row) => row.table === schemaMock.sentMessages);
    expect(sentInsert).toBeTruthy();
    expect(sentInsert?.payload).toMatchObject({
      accountId: "acc-1",
      provider: "gmail",
      fromAddress: "Origami <origami@example.com>",
      subject: "Hello",
      providerMessageId: "provider-msg-1",
      status: "sent",
      bodyText: "This is a test message.",
      toRecipients: JSON.stringify(["alice@example.com"]),
      ccRecipients: JSON.stringify(["cc@example.com"]),
      bccRecipients: JSON.stringify(["bcc@example.com"]),
    });
    expect(revalidateMailboxPagesMock).toHaveBeenCalledTimes(1);
  });

  it("returns insufficient-scope style error when account is not send-capable", async () => {
    providerMock.getCapabilities.mockReturnValue({ canSend: false });
    const { sendMailAction } = await import("./send");

    const result = await sendMailAction({
      accountId: "acc-1",
      from: "qq@example.com",
      to: ["alice@example.com"],
      subject: "Hello",
      textBody: "body",
      attachmentIds: [],
    });

    expect(result).toEqual({
      ok: false,
      errorCode: "INSUFFICIENT_SCOPE",
      errorMessage: "当前账号未配置发送权限，请重新授权后再试。",
    });
    expect(providerMock.sendMail).not.toHaveBeenCalled();
  });
});
