import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getCronSecretMock = vi.fn();
const syncAllAccountsMock = vi.fn();

vi.mock("@/lib/secrets", () => ({
  getCronSecret: getCronSecretMock,
}));

vi.mock("@/lib/services/sync-service", () => ({
  syncAllAccounts: syncAllAccountsMock,
}));

describe("GET /api/cron/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCronSecretMock.mockResolvedValue("test-secret");
  });

  it("returns 401 when authorization is invalid", async () => {
    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/cron/sync");

    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns sync results without exposing unknown raw errors", async () => {
    syncAllAccountsMock.mockResolvedValue({
      results: [
        {
          email: "tester@example.com",
          synced: 0,
          error: "Sync failed",
          errorCode: "UNKNOWN",
        },
      ],
    });

    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: { authorization: "Bearer test-secret" },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      results: [
        {
          email: "tester@example.com",
          synced: 0,
          error: "Sync failed",
          errorCode: "UNKNOWN",
        },
      ],
    });
  });
});
