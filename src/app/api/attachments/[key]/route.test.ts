import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const downloadAttachmentMock = vi.fn();
const attachmentsTable = { name: "attachments" };
const sentMessageAttachmentsTable = { name: "sent_message_attachments" };
let inboundRows: Array<{ id: string; filename: string; r2ObjectKey: string }> = [];
let sentRows: Array<{ id: string; filename: string; r2ObjectKey: string }> = [];

vi.mock("@/lib/r2", () => ({
  downloadAttachment: downloadAttachmentMock,
}));

vi.mock("@/lib/db/schema", () => ({
  attachments: attachmentsTable,
  sentMessageAttachments: sentMessageAttachmentsTable,
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => Symbol("eq")),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        where: async () => (table === attachmentsTable ? inboundRows : sentRows),
      }),
    }),
  },
}));

describe("attachment download route", () => {
  beforeEach(() => {
    inboundRows = [];
    sentRows = [];
    downloadAttachmentMock.mockReset();
  });

  it("returns 404 when the attachment does not exist", async () => {
    const { GET } = await import("./route");

    const response = await GET(new NextRequest("http://localhost/api/attachments/missing"), {
      params: Promise.resolve({ key: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("returns a localized 503 when storage is unavailable for sent attachments", async () => {
    sentRows = [{ id: "att-1", filename: "note.txt", r2ObjectKey: "compose/att-1/note.txt" }];
    downloadAttachmentMock.mockRejectedValueOnce(new Error("Missing environment variable: R2_ENDPOINT"));

    const { GET } = await import("./route");

    const response = await GET(
      new NextRequest("http://localhost/api/attachments/att-1", {
        headers: { cookie: "origami_locale=zh-CN" },
      }),
      { params: Promise.resolve({ key: "att-1" }) }
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "附件存储尚未配置完成，暂时无法下载附件。",
    });
  });
});
