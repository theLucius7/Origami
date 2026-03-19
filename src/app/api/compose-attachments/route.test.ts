import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertValuesMock = vi.fn();
const buildComposeUploadKeyMock = vi.fn(() => "uploads/test-key");
const uploadAttachmentMock = vi.fn(async () => undefined);
const cleanupExpiredComposeUploadsMock = vi.fn(async () => 0);

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: insertValuesMock,
    }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  composeUploads: { name: "compose_uploads" },
}));

vi.mock("@/lib/r2", () => ({
  buildComposeUploadKey: buildComposeUploadKeyMock,
  uploadAttachment: uploadAttachmentMock,
}));
vi.mock("@/lib/compose-uploads", () => ({
  cleanupExpiredComposeUploads: cleanupExpiredComposeUploadsMock,
}));

describe("compose attachments route", () => {
  beforeEach(() => {
    insertValuesMock.mockReset();
    insertValuesMock.mockResolvedValue(undefined);
    buildComposeUploadKeyMock.mockClear();
    uploadAttachmentMock.mockReset();
    uploadAttachmentMock.mockResolvedValue(undefined);
    cleanupExpiredComposeUploadsMock.mockClear();
  });

  it("returns localized validation errors", async () => {
    const { POST } = await import("./route");

    const missingContentTypeResponse = await POST(
      new NextRequest("http://localhost/api/compose-attachments", {
        method: "POST",
        headers: { cookie: "origami_locale=en" },
      })
    );
    expect(missingContentTypeResponse.status).toBe(400);
    await expect(missingContentTypeResponse.json()).resolves.toEqual({
      error: "Missing attachment file.",
    });

    const missingResponse = await POST(
      new NextRequest("http://localhost/api/compose-attachments", {
        method: "POST",
        headers: { cookie: "origami_locale=en" },
        body: new FormData(),
      })
    );
    expect(missingResponse.status).toBe(400);
    await expect(missingResponse.json()).resolves.toEqual({
      error: "Missing attachment file.",
    });

    const largeData = new FormData();
    largeData.append(
      "file",
      new File([new Uint8Array(3 * 1024 * 1024)], "large.bin", {
        type: "application/octet-stream",
      })
    );

    const largeResponse = await POST(
      new NextRequest("http://localhost/api/compose-attachments", {
        method: "POST",
        headers: { cookie: "origami_locale=ja" },
        body: largeData,
      })
    );
    expect(largeResponse.status).toBe(400);
    await expect(largeResponse.json()).resolves.toEqual({
      error: "現在のバージョンでは、各添付ファイルは 3 MB 未満である必要があります。",
    });
  });

  it("returns a localized error when attachment storage is not configured", async () => {
    uploadAttachmentMock.mockRejectedValueOnce(new Error("Missing environment variable: R2_ENDPOINT"));

    const { POST } = await import("./route");

    const formData = new FormData();
    formData.append(
      "file",
      new File([new Uint8Array([1, 2, 3])], "note.txt", {
        type: "text/plain",
      })
    );

    const response = await POST(
      new NextRequest("http://localhost/api/compose-attachments", {
        method: "POST",
        headers: { cookie: "origami_locale=zh-CN" },
        body: formData,
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "附件存储尚未配置完成，暂时无法上传附件。",
    });
  });

  it("stores uploaded attachments when validation passes", async () => {
    const { POST } = await import("./route");

    const formData = new FormData();
    formData.append(
      "file",
      new File([new Uint8Array([1, 2, 3])], "note.txt", {
        type: "text/plain",
      })
    );

    const response = await POST(
      new NextRequest("http://localhost/api/compose-attachments", {
        method: "POST",
        body: formData,
      })
    );

    expect(response.status).toBe(200);
    expect(cleanupExpiredComposeUploadsMock).toHaveBeenCalledTimes(1);
    expect(buildComposeUploadKeyMock).toHaveBeenCalled();
    expect(uploadAttachmentMock).toHaveBeenCalledWith(
      "uploads/test-key",
      expect.any(Buffer),
      "text/plain"
    );
    expect(insertValuesMock).toHaveBeenCalledTimes(1);
  });
});
