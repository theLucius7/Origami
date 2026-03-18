import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertValuesMock = vi.fn();
const buildComposeUploadKeyMock = vi.fn(() => "uploads/test-key");
const uploadAttachmentMock = vi.fn(async () => undefined);

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

describe("compose attachments route", () => {
  beforeEach(() => {
    insertValuesMock.mockReset();
    buildComposeUploadKeyMock.mockClear();
    uploadAttachmentMock.mockClear();
  });

  it("returns localized validation errors", async () => {
    const { POST } = await import("./route");

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
    expect(buildComposeUploadKeyMock).toHaveBeenCalled();
    expect(uploadAttachmentMock).toHaveBeenCalledWith(
      "uploads/test-key",
      expect.any(Buffer),
      "text/plain"
    );
    expect(insertValuesMock).toHaveBeenCalledTimes(1);
  });
});
