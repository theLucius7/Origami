import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    locale: "en",
    messages: { common: { actionFailed: "Action failed" } },
  }),
}));

describe("getClientActionErrorMessage", () => {
  it("localizes serialized action errors", async () => {
    const { getClientActionErrorMessage } = await import("./use-client-action");
    const { ActionError, serializeActionError } = await import("@/lib/actions");

    const error = new Error(
      serializeActionError(new ActionError("ACCOUNT_NOT_FOUND", "Account not found"))
    );

    expect(getClientActionErrorMessage(error, undefined, "en")).toBe(
      "The account could not be found."
    );
  });

  it("falls back for non-serialized runtime errors instead of leaking raw messages", async () => {
    const { getClientActionErrorMessage } = await import("./use-client-action");
    expect(getClientActionErrorMessage(new Error("plain error"), undefined, "en")).toBe(
      "Action failed. Please try again later."
    );
  });

  it("localizes encoded runtime errors", async () => {
    const { getClientActionErrorMessage } = await import("./use-client-action");
    const { encodeRuntimeError } = await import("@/lib/runtime-errors");

    expect(getClientActionErrorMessage(new Error(encodeRuntimeError("HYDRATION_REMOTE_NOT_FOUND")), undefined, "zh-CN")).toBe(
      "远端未找到这封邮件，可能已被删除或移动。"
    );
  });

  it("falls back for serialized unknown errors instead of leaking raw messages", async () => {
    const { getClientActionErrorMessage } = await import("./use-client-action");
    const { ActionError, serializeActionError } = await import("@/lib/actions");

    const error = new Error(
      serializeActionError(new ActionError("UNKNOWN", "dial tcp imap.example.com:993: connect: connection refused"))
    );

    expect(getClientActionErrorMessage(error, undefined, "en")).toBe(
      "Action failed. Please try again later."
    );
  });
});
