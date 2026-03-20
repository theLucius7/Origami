import { beforeEach, describe, expect, it, vi } from "vitest";

const listEmailsMock = vi.fn();
const listAccountsMock = vi.fn();
const InboxViewMock = vi.fn(() => null);

vi.mock("@/lib/queries/emails", () => ({
  listEmails: listEmailsMock,
}));

vi.mock("@/lib/queries/accounts", () => ({
  listAccounts: listAccountsMock,
}));

vi.mock("@/components/inbox/inbox-view", () => ({
  InboxView: InboxViewMock,
}));

describe("InboxPage", () => {
  beforeEach(() => {
    listEmailsMock.mockReset();
    listAccountsMock.mockReset();
    InboxViewMock.mockClear();
  });

  it("maps URL search params into inbox query filters and selected mail props", async () => {
    const emails = [{ id: "mail_1" }];
    const accounts = [
      { id: "acc_1", provider: "gmail" },
      { id: "acc_2", provider: "outlook" },
    ];

    listEmailsMock.mockResolvedValue(emails);
    listAccountsMock.mockResolvedValue(accounts);

    const { default: InboxPage } = await import("./page");
    const element = await InboxPage({
      searchParams: Promise.resolve({
        account: "acc_1",
        starred: "1",
        search: "  invoice  ",
        mail: "mail_1",
      }),
    });

    expect(listEmailsMock).toHaveBeenCalledWith({
      accountId: "acc_1",
      starred: true,
      search: "invoice",
    });
    expect(listAccountsMock).toHaveBeenCalledTimes(1);
    expect(element.type).toBe("div");

    const inboxView = Array.isArray(element.props.children)
      ? element.props.children[0]
      : element.props.children;

    expect(inboxView.type).toBe(InboxViewMock);
    expect(inboxView.props).toEqual({
      initialEmails: emails,
      accountProviders: {
        acc_1: "gmail",
        acc_2: "outlook",
      },
      accountId: "acc_1",
      starred: true,
      initialSearch: "invoice",
      selectedMailId: "mail_1",
    });
  });
});
