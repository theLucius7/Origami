import { beforeEach, describe, expect, it, vi } from "vitest";

const updateWhereMock = vi.fn();
const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
const updateMock = vi.fn(() => ({ set: updateSetMock }));
const selectWhereMock = vi.fn();
const selectInnerJoinMock = vi.fn(() => ({ where: selectWhereMock }));
const selectFromMock = vi.fn(() => ({ innerJoin: selectInnerJoinMock }));
const selectMock = vi.fn(() => ({ from: selectFromMock }));
const writeBackReadMock = vi.fn();
const writeBackStarMock = vi.fn();
const revalidateMailboxPagesMock = vi.fn();

const emailsTable = {
  id: "emails.id",
  accountId: "emails.account_id",
  remoteId: "emails.remote_id",
  isRead: "emails.is_read",
  isStarred: "emails.is_starred",
};
const accountsTable = { id: "accounts.id" };

vi.mock("@/lib/db", () => ({
  db: {
    update: updateMock,
    select: selectMock,
    run: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  emails: emailsTable,
  accounts: accountsTable,
}));

vi.mock("@/lib/providers/writeBack", () => ({
  writeBackRead: writeBackReadMock,
  writeBackStar: writeBackStarMock,
}));

vi.mock("@/lib/queries/emails", () => ({
  countUnreadEmails: vi.fn(),
  getEmailRecordById: vi.fn(),
  listEmailAttachments: vi.fn(),
  listEmails: vi.fn(),
}));

vi.mock("@/lib/services/email-service", () => ({
  getHydratedEmailDetail: vi.fn(),
  hydrateEmailIfNeeded: vi.fn(),
}));

vi.mock("@/lib/revalidate", () => ({
  revalidateMailboxPages: revalidateMailboxPagesMock,
}));

describe("email actions write-back integration", () => {
  beforeEach(() => {
    updateWhereMock.mockReset();
    updateWhereMock.mockResolvedValue(undefined);
    updateSetMock.mockClear();
    updateMock.mockClear();
    selectWhereMock.mockReset();
    selectFromMock.mockClear();
    selectInnerJoinMock.mockClear();
    selectMock.mockClear();
    writeBackReadMock.mockReset();
    writeBackStarMock.mockReset();
    revalidateMailboxPagesMock.mockClear();
  });

  it("markRead does not await remote write-back", async () => {
    let release: () => void = () => undefined;
    writeBackReadMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ success: true, skipped: false });
        })
    );
    selectWhereMock.mockResolvedValue([
      {
        email: { remoteId: "gmail-remote-1" },
        account: { id: "acc-1", provider: "gmail", email: "user@example.com", syncReadBack: 1 },
      },
    ]);

    const { markRead } = await import("./email");

    await expect(markRead("email-1")).resolves.toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(emailsTable);

    await Promise.resolve();
    await Promise.resolve();

    expect(writeBackReadMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "gmail", syncReadBack: 1 }),
      "gmail-remote-1"
    );
    expect(revalidateMailboxPagesMock).toHaveBeenCalledTimes(1);

    release();
  });

  it("setStarred still resolves when async write-back later rejects", async () => {
    writeBackStarMock.mockRejectedValue(new Error("timeout"));
    selectWhereMock.mockResolvedValue([
      {
        email: { remoteId: "qq-uid-1" },
        account: { id: "acc-2", provider: "qq", email: "qq@example.com", syncStarBack: 1 },
      },
    ]);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { setStarred } = await import("./email");

    await expect(setStarred(["email-2"], true)).resolves.toBeUndefined();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(writeBackStarMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "qq", syncStarBack: 1 }),
      "qq-uid-1",
      true
    );
    expect(revalidateMailboxPagesMock).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });
});
