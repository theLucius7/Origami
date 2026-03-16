import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAccount = {
  id: "acc-1",
  provider: "gmail",
  email: "origami@example.com",
  displayName: "Origami",
  credentials: "encrypted-creds",
};

const insertedRows: Array<{ table: unknown; payload: unknown }> = [];

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
vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn(() => JSON.stringify({ accessToken: "a", refreshToken: "r", scopes: ["https://www.googleapis.com/auth/gmail.send"] })),
}));
vi.mock("@/lib/providers/factory", () => ({
  createEmailProvider: vi.fn(() => providerMock),
  getUpdatedProviderCredentials: vi.fn(() => undefined),
}));
vi.mock("@/lib/r2", () => ({
  downloadAttachmentBuffer: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
    providerMock.getCapabilities.mockClear();
    providerMock.sendMail.mockClear();
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
  });
});
