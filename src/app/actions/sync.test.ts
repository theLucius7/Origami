import { beforeEach, describe, expect, it, vi } from "vitest";

const runActionResultMock = vi.fn();
const syncAccountByIdMock = vi.fn();
const syncAllAccountsMock = vi.fn();
const revalidateMailboxPagesMock = vi.fn();

vi.mock("@/lib/actions", () => ({
  runActionResult: runActionResultMock,
}));

vi.mock("@/lib/services/sync-service", () => ({
  syncAccountById: syncAccountByIdMock,
  syncAllAccounts: syncAllAccountsMock,
}));

vi.mock("@/lib/revalidate", () => ({
  revalidateMailboxPages: revalidateMailboxPagesMock,
}));

describe("sync actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates mailbox pages after single-account sync succeeds", async () => {
    runActionResultMock.mockResolvedValue({ ok: true, data: { synced: 3 } });

    const { syncAccount } = await import("./sync");
    const result = await syncAccount("acc-1");

    expect(result).toEqual({ ok: true, synced: 3 });
    expect(revalidateMailboxPagesMock).toHaveBeenCalledTimes(1);
    expect(runActionResultMock).toHaveBeenCalledWith("syncAccount", expect.any(Function));
  });

  it("does not revalidate when single-account sync fails", async () => {
    runActionResultMock.mockResolvedValue({ ok: false, errorMessage: "boom" });

    const { syncAccount } = await import("./sync");
    const result = await syncAccount("acc-1");

    expect(result).toEqual({ ok: false, synced: 0, error: "boom" });
    expect(revalidateMailboxPagesMock).not.toHaveBeenCalled();
  });

  it("revalidates mailbox pages after full sync succeeds", async () => {
    runActionResultMock.mockResolvedValue({ ok: true, data: { results: [{ accountId: "acc-1", synced: 2 }] } });

    const { syncAll } = await import("./sync");
    const result = await syncAll();

    expect(result).toEqual({ ok: true, results: [{ accountId: "acc-1", synced: 2 }] });
    expect(revalidateMailboxPagesMock).toHaveBeenCalledTimes(1);
    expect(runActionResultMock).toHaveBeenCalledWith("syncAll", expect.any(Function));
  });
});
