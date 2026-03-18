import { beforeEach, describe, expect, it, vi } from "vitest";

const listSentMessagesMock = vi.fn();
const SentListMock = vi.fn(() => null);

vi.mock("@/lib/queries/sent-messages", () => ({
  listSentMessages: listSentMessagesMock,
}));

vi.mock("@/components/sent/sent-list", () => ({
  SentList: SentListMock,
}));

describe("SentPage", () => {
  beforeEach(() => {
    listSentMessagesMock.mockReset();
    SentListMock.mockClear();
  });

  it("passes the account filter through to the query and list view", async () => {
    const messages = [{ id: "msg_1" }];
    listSentMessagesMock.mockResolvedValue(messages);

    const { default: SentPage } = await import("./page");
    const element = await SentPage({ searchParams: Promise.resolve({ account: "acc_1" }) });

    expect(listSentMessagesMock).toHaveBeenCalledWith("acc_1");
    expect(element.type).toBe(SentListMock);
    expect(element.props).toEqual({ messages, accountId: "acc_1" });
  });
});
