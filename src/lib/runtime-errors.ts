import type { AppLocale } from "@/i18n/locale";

const RUNTIME_ERROR_PREFIX = "origami-runtime:";

type RuntimeErrorCode =
  | "HYDRATION_ACCOUNT_UNAVAILABLE"
  | "HYDRATION_REMOTE_NOT_FOUND"
  | "WRITEBACK_MISSING_REMOTE_ID"
  | "WRITEBACK_INVALID_REMOTE_ID"
  | "WRITEBACK_INVALID_CREDENTIALS"
  | "WRITEBACK_GMAIL_SCOPE_MISSING"
  | "WRITEBACK_OUTLOOK_SCOPE_MISSING"
  | "WRITEBACK_UNSUPPORTED_PROVIDER";

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
    case "WRITEBACK_INVALID_REMOTE_ID":
      switch (locale) {
        case "zh-TW":
          return "遠端郵件 ID 無效，無法回寫。";
        case "en":
          return "The remote message ID is invalid, so write-back could not run.";
        case "ja":
          return "リモートのメッセージ ID が無効なため、書き戻しを実行できません。";
        default:
          return "远端邮件 ID 无效，无法回写。";
      }
    case "WRITEBACK_INVALID_CREDENTIALS":
      switch (locale) {
        case "zh-TW":
          return "目前帳號憑證無效或無法解析，無法回寫。";
        case "en":
          return "The current account credentials are invalid or unreadable, so write-back could not run.";
        case "ja":
          return "現在のアカウント認証情報が無効、または解析できないため、書き戻しを実行できません。";
        default:
          return "当前账号凭据无效或无法解析，无法回写。";
      }
    case "WRITEBACK_GMAIL_SCOPE_MISSING":
      switch (locale) {
        case "zh-TW":
          return "目前帳號缺少 Gmail modify 權限，無法回寫。";
        case "en":
          return "This account is missing Gmail modify permission, so write-back could not run.";
        case "ja":
          return "このアカウントには Gmail modify 権限がないため、書き戻しを実行できません。";
        default:
          return "当前账号缺少 Gmail modify 权限，无法回写。";
      }
    case "WRITEBACK_OUTLOOK_SCOPE_MISSING":
      switch (locale) {
        case "zh-TW":
          return "目前帳號缺少 Outlook delegated 寫回權限，無法回寫。";
        case "en":
          return "This account is missing Outlook delegated write-back permission, so write-back could not run.";
        case "ja":
          return "このアカウントには Outlook delegated の書き戻し権限がないため、書き戻しを実行できません。";
        default:
          return "当前账号缺少 Outlook delegated 写回权限，无法回写。";
      }
    case "WRITEBACK_UNSUPPORTED_PROVIDER":
      switch (locale) {
        case "zh-TW":
          return "目前 provider 不支援這個回寫操作。";
        case "en":
          return "The current provider does not support this write-back operation.";
        case "ja":
          return "現在の provider はこの書き戻し操作に対応していません。";
        default:
          return "当前 provider 不支持这个写回操作。";
      }
  }
}

function parseRuntimeError(error: string): { code: RuntimeErrorCode } | null {
  if (error.startsWith(RUNTIME_ERROR_PREFIX)) {
    const code = error.slice(RUNTIME_ERROR_PREFIX.length) as RuntimeErrorCode;
    if (
      code === "HYDRATION_ACCOUNT_UNAVAILABLE" ||
      code === "HYDRATION_REMOTE_NOT_FOUND" ||
      code === "WRITEBACK_MISSING_REMOTE_ID" ||
      code === "WRITEBACK_INVALID_REMOTE_ID" ||
      code === "WRITEBACK_INVALID_CREDENTIALS" ||
      code === "WRITEBACK_GMAIL_SCOPE_MISSING" ||
      code === "WRITEBACK_OUTLOOK_SCOPE_MISSING" ||
      code === "WRITEBACK_UNSUPPORTED_PROVIDER"
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
    case "missing remoteMessageId":
      return { code: "WRITEBACK_MISSING_REMOTE_ID" };
    case "invalid credentials":
      return { code: "WRITEBACK_INVALID_CREDENTIALS" };
    case "missing scope https://www.googleapis.com/auth/gmail.modify":
      return { code: "WRITEBACK_GMAIL_SCOPE_MISSING" };
    case "missing scope mail.readwrite":
      return { code: "WRITEBACK_OUTLOOK_SCOPE_MISSING" };
    case "unsupported provider":
      return { code: "WRITEBACK_UNSUPPORTED_PROVIDER" };
    default:
      if (error.startsWith("Invalid remote id:")) {
        return { code: "WRITEBACK_INVALID_REMOTE_ID" };
      }
      if (error.startsWith("unsupported provider:")) {
        return { code: "WRITEBACK_UNSUPPORTED_PROVIDER" };
      }
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

export function getSafeRuntimeErrorMessage(params: {
  locale: AppLocale;
  error: string | null | undefined;
  fallback?: string | null;
}) {
  const { locale, error, fallback = null } = params;
  if (!error) return fallback;

  const mapped = mapRuntimeErrorToMessage({ locale, error });
  if (!mapped || mapped === error) {
    return fallback;
  }

  return mapped;
}
