import { describe, expect, it } from "vitest";
import {
  encodeRuntimeError,
  getSafeRuntimeErrorMessage,
  mapRuntimeErrorToMessage,
  normalizeRuntimeError,
} from "./runtime-errors";

describe("runtime error mapping", () => {
  it("localizes structured runtime errors", () => {
    expect(
      mapRuntimeErrorToMessage({
        locale: "en",
        error: encodeRuntimeError("HYDRATION_REMOTE_NOT_FOUND"),
      })
    ).toBe("The remote message could not be found. It may have been deleted or moved.");

    expect(
      mapRuntimeErrorToMessage({
        locale: "ja",
        error: encodeRuntimeError("WRITEBACK_MISSING_REMOTE_ID"),
      })
    ).toBe("リモートのメッセージ ID がないため、書き戻しを実行できません。");

    expect(
      mapRuntimeErrorToMessage({
        locale: "en",
        error: encodeRuntimeError("WRITEBACK_INVALID_CREDENTIALS"),
      })
    ).toBe("The current account credentials are invalid or unreadable, so write-back could not run.");
  });

  it("maps legacy hard-coded runtime errors for backward compatibility", () => {
    expect(
      mapRuntimeErrorToMessage({
        locale: "zh-TW",
        error: "账号不存在或 provider 初始化失败。",
      })
    ).toBe("帳號不存在，或 provider 初始化失敗。");

    expect(
      mapRuntimeErrorToMessage({
        locale: "en",
        error: "missing remote message id",
      })
    ).toBe("The remote message ID is missing, so write-back could not run.");

    expect(
      mapRuntimeErrorToMessage({
        locale: "zh-CN",
        error: "missing scope mail.readwrite",
      })
    ).toBe("当前账号缺少 Outlook delegated 写回权限，无法回写。");

    expect(
      mapRuntimeErrorToMessage({
        locale: "en",
        error: "socket hang up",
      })
    ).toBe("socket hang up");

    expect(
      mapRuntimeErrorToMessage({
        locale: "zh-CN",
        error: "Invalid remote id: remote-3",
      })
    ).toBe("远端邮件 ID 无效，无法回写。");
  });

  it("falls back safely for unknown runtime errors", () => {
    expect(
      getSafeRuntimeErrorMessage({
        locale: "en",
        error: "socket hang up",
        fallback: "Action failed",
      })
    ).toBe("Action failed");

    expect(
      getSafeRuntimeErrorMessage({
        locale: "zh-CN",
        error: "Invalid remote id: remote-3",
        fallback: "操作失败",
      })
    ).toBe("远端邮件 ID 无效，无法回写。");
  });

  it("normalizes runtime errors for storage", () => {
    expect(normalizeRuntimeError(new Error("Invalid remote id: remote-3"), "WRITEBACK_UNKNOWN")).toBe(
      encodeRuntimeError("WRITEBACK_INVALID_REMOTE_ID")
    );

    expect(normalizeRuntimeError(new Error("socket hang up"), "WRITEBACK_UNKNOWN")).toBe(
      encodeRuntimeError("WRITEBACK_UNKNOWN")
    );

    expect(normalizeRuntimeError(new Error("timeout"), "HYDRATION_UNKNOWN")).toBe(
      encodeRuntimeError("HYDRATION_UNKNOWN")
    );
  });
});
