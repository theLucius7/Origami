import { beforeEach, describe, expect, it, vi } from "vitest";

const getHydratedEmailDetailMock = vi.fn();
const buildInboxHrefMock = vi.fn(() => "/?account=acc_1&search=invoice&starred=1");
const getRequestLocaleMock = vi.fn();
const MailDetailMock = vi.fn(() => null);
const notFoundMock = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("@/lib/services/email-service", () => ({
  getHydratedEmailDetail: getHydratedEmailDetailMock,
}));

vi.mock("@/lib/inbox-route", () => ({
  buildInboxHref: buildInboxHrefMock,
}));

vi.mock("@/i18n/locale.server", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

vi.mock("@/components/inbox/mail-detail", () => ({
  MailDetail: MailDetailMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: unknown }) => ({ type: "a", props: { href, children } }),
}));

function findAnchor(node: unknown): { href: string; text: string } | null {
  if (!node || typeof node !== "object") return null;

  const candidate = node as {
    props?: { href?: string; children?: unknown };
  };

  if (candidate.props?.href) {
    return {
      href: candidate.props.href,
      text: collectText(candidate.props.children).trim(),
    };
  }

  const children = candidate.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findAnchor(child);
      if (found) return found;
    }
    return null;
  }

  return findAnchor(children);
}

function collectText(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  if (typeof node !== "object") return "";

  const candidate = node as { props?: { children?: unknown } };
  return collectText(candidate.props?.children);
}

describe("MailDetailPage", () => {
  beforeEach(() => {
    getHydratedEmailDetailMock.mockReset();
    buildInboxHrefMock.mockClear();
    getRequestLocaleMock.mockReset();
    MailDetailMock.mockClear();
    notFoundMock.mockClear();
  });

  it("renders a localized back label and preserves inbox filters", async () => {
    getHydratedEmailDetailMock.mockResolvedValue({ email: { id: "mail_1" }, attachments: [] });
    getRequestLocaleMock.mockResolvedValue("en");

    const { default: MailDetailPage } = await import("./page");
    const element = await MailDetailPage({
      params: Promise.resolve({ id: "mail_1" }),
      searchParams: Promise.resolve({ account: "acc_1", starred: "1", search: "invoice" }),
    });

    expect(buildInboxHrefMock).toHaveBeenCalledWith({
      accountId: "acc_1",
      starred: true,
      search: "invoice",
    });

    const anchor = findAnchor(element);
    expect(anchor).toEqual({
      href: "/?account=acc_1&search=invoice&starred=1",
      text: "Back",
    });

    expect(collectText(element)).toContain("Back");
  });

  it("calls notFound when the email detail is missing", async () => {
    getHydratedEmailDetailMock.mockResolvedValue(null);
    getRequestLocaleMock.mockResolvedValue("zh-CN");

    const { default: MailDetailPage } = await import("./page");

    await expect(
      MailDetailPage({
        params: Promise.resolve({ id: "missing" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
