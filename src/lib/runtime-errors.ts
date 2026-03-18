import type { AppLocale } from "@/i18n/locale";

const RUNTIME_ERROR_PREFIX = "origami-runtime:";

type RuntimeErrorCode =
  | "HYDRATION_ACCOUNT_UNAVAILABLE"
  | "HYDRATION_REMOTE_NOT_FOUND"
  | "WRITEBACK_MISSING_REMOTE_ID";

function getRuntimeErrorMessage(locale: AppLocale, code: RuntimeErrorCode) {
  switch (code) {
    case "HYDRATION_ACCOUNT_UNAVAILABLE":
      switch (locale) {
        case "zh-TW":
          return "帳號不存在，或 provider 初始化失敗。";
        case "en":
          return "The account could not be found, or the provider failed to initialize.";
        case "ja":
          return "アカウントが見つからないか、provider の初期化に失敗しました。";
        default:
          return "账号不存在，或 provider 初始化失败。";
      }
    case "HYDRATION_REMOTE_NOT_FOUND":
      switch (locale) {
        case "zh-TW":
          return "遠端未找到這封郵件，可能已被刪除或移動。";
        case "en":
          return "The remote message could not be found. It may have been deleted or moved.";
        case "ja":
          return "リモート側でこのメールが見つかりませんでした。削除または移動された可能性があります。";
        default:
          return "远端未找到这封邮件，可能已被删除或移动。";
      }
    case "WRITEBACK_MISSING_REMOTE_ID":
      switch (locale) {
        case "zh-TW":
          return "缺少遠端郵件 ID，無法回寫。";
        case "en":
          return "The remote message ID is missing, so write-back could not run.";
        case "ja":
          return "リモートのメッセージ ID がないため、書き戻しを実行できません。";
        default:
          return "缺少远端邮件 ID，无法回写。";
      }
  }
}

function parseRuntimeError(error: string): { code: RuntimeErrorCode } | null {
  if (error.startsWith(RUNTIME_ERROR_PREFIX)) {
    const code = error.slice(RUNTIME_ERROR_PREFIX.length) as RuntimeErrorCode;
    if (
      code === "HYDRATION_ACCOUNT_UNAVAILABLE" ||
      code === "HYDRATION_REMOTE_NOT_FOUND" ||
      code === "WRITEBACK_MISSING_REMOTE_ID"
    ) {
      return { code };
    }
  }

  switch (error) {
    case "账号不存在或 provider 初始化失败。":
    case "账号不存在，或 provider 初始化失败。":
      return { code: "HYDRATION_ACCOUNT_UNAVAILABLE" };
    case "远端未找到这封邮件，可能已被删除或移动。":
      return { code: "HYDRATION_REMOTE_NOT_FOUND" };
    case "missing remote message id":
      return { code: "WRITEBACK_MISSING_REMOTE_ID" };
    default:
      return null;
  }
}

export function encodeRuntimeError(code: RuntimeErrorCode) {
  return `${RUNTIME_ERROR_PREFIX}${code}`;
}

export function mapRuntimeErrorToMessage(params: {
  locale: AppLocale;
  error: string | null | undefined;
}) {
  const { locale, error } = params;
  if (!error) return null;

  const parsed = parseRuntimeError(error);
  if (!parsed) return error;
  return getRuntimeErrorMessage(locale, parsed.code);
}
