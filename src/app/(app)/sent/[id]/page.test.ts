import { beforeEach, describe, expect, it, vi } from "vitest";

const getSentMessageDetailRecordMock = vi.fn();
const buildSentHrefMock = vi.fn((account?: string) => (account ? `/sent?account=${account}` : "/sent"));
const SentDetailMock = vi.fn(() => null);
const notFoundMock = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("@/lib/queries/sent-messages", () => ({
  getSentMessageDetailRecord: getSentMessageDetailRecordMock,
}));

vi.mock("@/lib/inbox-route", () => ({
  buildSentHref: buildSentHrefMock,
}));

vi.mock("@/components/sent/sent-detail", () => ({
  SentDetail: SentDetailMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

function findElementByType(node: unknown, targetType: unknown): { type: unknown; props: Record<string, unknown> } | null {
  if (!node || typeof node !== "object") return null;

  const candidate = node as { type?: unknown; props?: Record<string, unknown> };
  if (candidate.type === targetType && candidate.props) {
    return candidate as { type: unknown; props: Record<string, unknown> };
  }

  const children = candidate.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findElementByType(child, targetType);
      if (found) return found;
    }
    return null;
  }

  return findElementByType(children, targetType);
}

describe("SentDetailPage", () => {
  beforeEach(() => {
    getSentMessageDetailRecordMock.mockReset();
    buildSentHrefMock.mockClear();
    SentDetailMock.mockClear();
    notFoundMock.mockClear();
  });

  it("preserves the account filter for the back link and detail view", async () => {
    getSentMessageDetailRecordMock.mockResolvedValue({
      message: { id: "msg_1" },
      account: { id: "acc_1" },
      attachments: [],
    });

    const { default: SentDetailPage } = await import("./page");
    const element = await SentDetailPage({
      params: Promise.resolve({ id: "msg_1" }),
      searchParams: Promise.resolve({ account: "acc_1" }),
    });

    expect(getSentMessageDetailRecordMock).toHaveBeenCalledWith("msg_1");
    expect(buildSentHrefMock).toHaveBeenCalledWith("acc_1");

    const detailElement = findElementByType(element, SentDetailMock);
    expect(detailElement?.props).toEqual({
      message: { id: "msg_1" },
      account: { id: "acc_1" },
      attachments: [],
    });
  });

  it("calls notFound when the record is missing", async () => {
    getSentMessageDetailRecordMock.mockResolvedValue(null);

    const { default: SentDetailPage } = await import("./page");

    await expect(
      SentDetailPage({
        params: Promise.resolve({ id: "missing" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
