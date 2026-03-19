import { describe, expect, it } from "vitest";
import {
  getAccountsNotificationErrorDescription,
  getAccountsNotificationSuccessDescription,
} from "./accounts-notification-errors";
import { getMessages } from "@/i18n/messages";

describe("accounts notification descriptions", () => {
  it("maps stable OAuth error codes to localized descriptions", () => {
    const messages = getMessages("zh-CN");

    expect(getAccountsNotificationErrorDescription(messages, "invalid_oauth_state")).toBe(
      "授权状态校验失败，请重新发起授权。"
    );
    expect(getAccountsNotificationErrorDescription(messages, "oauth_callback_failed")).toBe(
      "授权回调失败，请稍后重试。"
    );
  });

  it("falls back to a generic auth failure description for unknown errors", () => {
    const messages = getMessages("en");

    expect(getAccountsNotificationErrorDescription(messages, "consent denied")).toBe(
      "Authorization did not complete. Please try again later."
    );
  });

  it("uses a generic success description for provider-tagged OAuth callbacks", () => {
    const messages = getMessages("zh-CN");

    expect(getAccountsNotificationSuccessDescription(messages, "gmail")).toBe("邮箱账号已连接。");
    expect(getAccountsNotificationSuccessDescription(messages, "2")).toBe("已连接 2 账号。");
  });
});
