import { describe, expect, it } from "vitest";
import { mapSendErrorToMessage } from "./send-errors";

describe("mapSendErrorToMessage", () => {
  it("localizes structured send error keys", () => {
    expect(
      mapSendErrorToMessage({
        locale: "en",
        errorCode: "INSUFFICIENT_SCOPE",
        errorKey: "SEND_NOT_ALLOWED",
        errorMessage: "This account is not configured to send mail",
      })
    ).toBe("This account is not configured to send mail yet. Reauthorize it and try again.");

    expect(
      mapSendErrorToMessage({
        locale: "ja",
        errorCode: "AUTH_EXPIRED",
        errorKey: "IMAP_AUTH_INVALID",
        errorDetails: "QQ メール",
        errorMessage: "QQ Mail credential rejected",
      })
    ).toBe("QQ メール の認証コードまたはパスワードが無効です。ログイン情報を再確認してください。");
  });

  it("falls back to generic localized messages by error code", () => {
    expect(
      mapSendErrorToMessage({
        locale: "zh-TW",
        errorCode: "NETWORK",
        errorMessage: "network down",
      })
    ).toBe("寄送失敗：網路異常，請稍後再試。");
  });
});
