import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMessages } from "@/i18n/messages";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const toastMock = vi.fn();
const runMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("@/hooks/use-client-action", () => ({
  useClientAction: () => ({
    isPending: false,
    run: runMock,
  }),
  getClientActionErrorMessage: () => "error",
}));

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    locale: "en",
    messages: getMessages("en"),
  }),
}));

vi.mock("./mail-list", () => ({
  MailList: () => React.createElement("div", { "data-testid": "mail-list" }),
}));

vi.mock("./mail-detail", () => ({
  MailDetail: () => React.createElement("div", { "data-testid": "mail-detail" }),
}));

vi.mock("./snooze-dialog", () => ({
  SnoozeDialog: () => null,
}));

vi.mock("@/app/actions/email", () => ({
  getEmailDetail: vi.fn(),
  getEmails: vi.fn(),
  markArchived: vi.fn(),
  markDone: vi.fn(),
  setStarred: vi.fn(),
  snooze: vi.fn(),
}));

describe("InboxView", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    toastMock.mockReset();
    runMock.mockReset();
  });

  it("labels the clear-search icon button when a search query is present", async () => {
    const { InboxView } = await import("./inbox-view");

    const html = renderToStaticMarkup(
      React.createElement(InboxView, {
        initialEmails: [],
        accountProviders: {},
        initialSearch: "triage",
      })
    );

    expect(html).toContain('aria-label="Clear search"');
    expect(html).toContain('title="Clear search"');
  });
});
