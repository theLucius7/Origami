import { describe, expect, it } from "vitest";
import { encodeRuntimeError, mapRuntimeErrorToMessage } from "./runtime-errors";

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
        locale: "en",
        error: "socket hang up",
      })
    ).toBe("socket hang up");
  });
});
