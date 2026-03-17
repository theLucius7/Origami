import { beforeEach, describe, expect, it, vi } from "vitest";

const updateWhereMock = vi.fn();
const updateSetMock = vi.fn((values: unknown) => ({ where: (whereClause: unknown) => updateWhereMock(values, whereClause) }));
const updateMock = vi.fn(() => ({ set: updateSetMock }));

const getAccountRecordByIdMock = vi.fn();
const listAccountsMock = vi.fn();
const getAccountWriteBackAvailabilityMock = vi.fn();
const revalidateAccountPagesMock = vi.fn();

vi.mock("@/lib/actions", () => ({
  runLoggedAction: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
}));

vi.mock("@/lib/db", () => ({
  db: {
    update: updateMock,
    insert: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  accounts: { id: "accounts.id" },
  attachments: {},
  emails: { accountId: "emails.accountId" },
}));

vi.mock("@/lib/queries/accounts", () => ({
  getAccountRecordById: getAccountRecordByIdMock,
  listAccounts: listAccountsMock,
}));

vi.mock("@/lib/providers/writeBack", () => ({
  getAccountWriteBackAvailability: getAccountWriteBackAvailabilityMock,
}));

vi.mock("@/lib/account-providers", () => ({
  listSendCapableAccounts: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn(),
  encrypt: vi.fn(),
}));

vi.mock("@/lib/providers/imap-smtp/presets", () => ({
  getMailboxPreset: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({
  deleteAttachment: vi.fn(),
}));

vi.mock("@/lib/revalidate", () => ({
  revalidateAccountPages: revalidateAccountPagesMock,
}));

vi.mock("nanoid", () => ({ nanoid: vi.fn(() => "id") }));

describe("account write-back settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateWhereMock.mockResolvedValue(undefined);
  });

  it("skips enabling per-account write-back when capability is missing", async () => {
    getAccountRecordByIdMock.mockResolvedValue({ id: "acc-1", provider: "gmail" });
    getAccountWriteBackAvailabilityMock.mockReturnValue({
      canWriteBackRead: false,
      canWriteBackStar: false,
      readBackNotice: "missing scope",
      starBackNotice: "missing scope",
    });

    const { updateAccountWriteBackSettings } = await import("./account");
    const result = await updateAccountWriteBackSettings("acc-1", { syncReadBack: true });

    expect(result).toEqual({ updated: false, skipped: true });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("still allows disabling per-account write-back even when capability is missing", async () => {
    getAccountRecordByIdMock.mockResolvedValue({ id: "acc-1", provider: "gmail" });
    getAccountWriteBackAvailabilityMock.mockReturnValue({
      canWriteBackRead: false,
      canWriteBackStar: false,
      readBackNotice: "missing scope",
      starBackNotice: "missing scope",
    });

    const { updateAccountWriteBackSettings } = await import("./account");
    const result = await updateAccountWriteBackSettings("acc-1", { syncReadBack: false });

    expect(result).toEqual({ updated: true, skipped: false });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateSetMock).toHaveBeenCalledWith({ syncReadBack: 0 });
    expect(revalidateAccountPagesMock).toHaveBeenCalledTimes(1);
  });

  it("globally enables write-back only for eligible accounts", async () => {
    listAccountsMock.mockResolvedValue([
      { id: "acc-1", provider: "imap_smtp" },
      { id: "acc-2", provider: "gmail" },
      { id: "acc-3", provider: "outlook" },
    ]);
    getAccountWriteBackAvailabilityMock
      .mockReturnValueOnce({
        canWriteBackRead: true,
        canWriteBackStar: true,
        readBackNotice: null,
        starBackNotice: null,
      })
      .mockReturnValueOnce({
        canWriteBackRead: false,
        canWriteBackStar: false,
        readBackNotice: "missing scope",
        starBackNotice: "missing scope",
      })
      .mockReturnValueOnce({
        canWriteBackRead: true,
        canWriteBackStar: false,
        readBackNotice: null,
        starBackNotice: "missing scope",
      });

    const { updateAllAccountsWriteBackSettings } = await import("./account");
    const result = await updateAllAccountsWriteBackSettings({ syncReadBack: true, syncStarBack: true });

    expect(result).toEqual({ updated: 2, skipped: 1 });
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(updateSetMock).toHaveBeenNthCalledWith(1, { syncReadBack: 1, syncStarBack: 1 });
    expect(updateSetMock).toHaveBeenNthCalledWith(2, { syncReadBack: 1 });
    expect(revalidateAccountPagesMock).toHaveBeenCalledTimes(1);
  });
});
