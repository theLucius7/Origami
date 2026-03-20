import type { AppLocale } from "@/i18n/locale";
import type { SendMailErrorCode } from "@/lib/providers/types";

function getDefaultSendFailure(locale: AppLocale) {
  switch (locale) {
    case "zh-TW":
      return "寄送失敗，請稍後再試。";
    case "en":
      return "Sending failed. Please try again later.";
    case "ja":
      return "送信に失敗しました。しばらくしてからもう一度お試しください。";
    default:
      return "发送失败，请稍后重试。";
  }
}

export function mapSendErrorToMessage(params: {
  locale: AppLocale;
  errorCode?: SendMailErrorCode;
  errorKey?: string;
  errorMessage?: string;
  errorDetails?: string;
}) {
  const { locale, errorCode, errorKey, errorMessage, errorDetails } = params;

  switch (errorKey) {
    case "ATTACHMENTS_MISSING":
      switch (locale) {
        case "zh-TW": return "部分附件不存在或已失效，請重新上傳。";
        case "en": return "Some attachments are missing or expired. Please upload them again.";
        case "ja": return "一部の添付ファイルが見つからないか、有効期限が切れています。再度アップロードしてください。";
        default: return "部分附件不存在或已失效，请重新上传。";
      }
    case "TO_REQUIRED":
      switch (locale) {
        case "zh-TW": return "至少填寫一個 To 收件人。";
        case "en": return "Please provide at least one To recipient.";
        case "ja": return "To の宛先を少なくとも 1 件入力してください。";
        default: return "至少填写一个 To 收件人。";
      }
    case "CONTENT_REQUIRED":
      switch (locale) {
        case "zh-TW": return "主旨和正文至少填寫一項。";
        case "en": return "Please provide at least a subject or a message body.";
        case "ja": return "件名または本文のいずれかは必須です。";
        default: return "主题和正文至少填写一项。";
      }
    case "ACCOUNT_NOT_FOUND":
      switch (locale) {
        case "zh-TW": return "找不到發件帳號。";
        case "en": return "The sending account could not be found.";
        case "ja": return "送信アカウントが見つかりません。";
        default: return "发件账号不存在。";
      }
    case "SEND_NOT_ALLOWED":
      switch (locale) {
        case "zh-TW": return "目前帳號尚未配置發信權限，請重新授權後再試。";
        case "en": return "This account is not configured to send mail yet. Reauthorize it and try again.";
        case "ja": return "このアカウントにはまだ送信権限がありません。再認可してからお試しください。";
        default: return "当前账号未配置发送权限，请重新授权后再试。";
      }
    case "OUTLOOK_ATTACHMENT_TOO_LARGE":
      switch (locale) {
        case "zh-TW": return "Outlook 直發模式目前只支援小於 3 MB 的單個附件。";
        case "en": return "Outlook direct-send currently supports only individual attachments smaller than 3 MB.";
        case "ja": return "Outlook の直接送信モードでは、現在 3 MB 未満の単一添付ファイルのみ対応しています。";
        default: return "Outlook 直发模式暂只支持小于 3 MB 的单个附件。";
      }
    case "GMAIL_SEND_SCOPE_REQUIRED":
      switch (locale) {
        case "zh-TW": return "目前 Gmail 帳號沒有發信權限，請重新授權並包含 gmail.send / gmail.modify。";
        case "en": return "This Gmail account does not have send permission. Reauthorize it with gmail.send / gmail.modify.";
        case "ja": return "この Gmail アカウントには送信権限がありません。gmail.send / gmail.modify を含めて再認可してください。";
        default: return "当前 Gmail 账号没有发送权限，请重新授权并包含 gmail.send/gmail.modify。";
      }
    case "GMAIL_AUTH_EXPIRED":
      switch (locale) {
        case "zh-TW": return "Gmail 登入已過期，請重新授權。";
        case "en": return "Gmail authorization has expired. Please reauthorize the account.";
        case "ja": return "Gmail の認可期限が切れています。再認可してください。";
        default: return "Gmail 登录已过期，请重新授权。";
      }
    case "GMAIL_POLICY_RESTRICTED":
      switch (locale) {
        case "zh-TW": return "Gmail 帳號缺少發信權限，或目前受到策略限制。";
        case "en": return "The Gmail account is missing send permission or is currently restricted by policy.";
        case "ja": return "Gmail アカウントに送信権限がないか、現在ポリシー制限を受けています。";
        default: return "Gmail 账号缺少发送权限或当前被策略限制。";
      }
    case "GMAIL_RATE_LIMITED":
      switch (locale) {
        case "zh-TW": return "Gmail 目前觸發了發信頻率限制，請稍後再試。";
        case "en": return "Gmail is currently rate-limited for sending. Please try again later.";
        case "ja": return "Gmail で現在送信レート制限が発生しています。しばらくしてからお試しください。";
        default: return "Gmail 当前触发了发送频率限制，请稍后重试。";
      }
    case "GMAIL_SEND_FAILED":
      switch (locale) {
        case "zh-TW": return "Gmail 發信失敗。";
        case "en": return "Gmail failed to send the message.";
        case "ja": return "Gmail での送信に失敗しました。";
        default: return "Gmail 发信失败。";
      }
    case "OUTLOOK_SEND_SCOPE_REQUIRED":
      switch (locale) {
        case "zh-TW": return "目前 Outlook 帳號沒有 Mail.Send 權限，請重新授權。";
        case "en": return "This Outlook account does not have Mail.Send permission. Please reauthorize it.";
        case "ja": return "この Outlook アカウントには Mail.Send 権限がありません。再認可してください。";
        default: return "当前 Outlook 账号没有 Mail.Send 权限，请重新授权。";
      }
    case "OUTLOOK_AUTH_EXPIRED":
      switch (locale) {
        case "zh-TW": return "Outlook 登入已過期，請重新授權。";
        case "en": return "Outlook authorization has expired. Please reauthorize the account.";
        case "ja": return "Outlook の認可期限が切れています。再認可してください。";
        default: return "Outlook 登录已过期，请重新授权。";
      }
    case "OUTLOOK_POLICY_RESTRICTED":
      switch (locale) {
        case "zh-TW": return "Outlook 帳號缺少 Mail.Send 權限，或目前受到策略限制。";
        case "en": return "The Outlook account is missing Mail.Send permission or is currently restricted by policy.";
        case "ja": return "Outlook アカウントに Mail.Send 権限がないか、現在ポリシー制限を受けています。";
        default: return "Outlook 账号缺少 Mail.Send 权限或当前被策略限制。";
      }
    case "OUTLOOK_PAYLOAD_TOO_LARGE":
      switch (locale) {
        case "zh-TW": return "附件或郵件內容過大，目前 Outlook 路徑不支援更大的請求體。";
        case "en": return "The attachments or message body are too large for the current Outlook sending path.";
        case "ja": return "添付ファイルまたはメール内容が大きすぎるため、現在の Outlook 送信経路では処理できません。";
        default: return "附件或邮件内容过大，当前 Outlook 路径不支持更大的请求体。";
      }
    case "OUTLOOK_RATE_LIMITED":
      switch (locale) {
        case "zh-TW": return "Outlook 目前觸發了發信頻率限制，請稍後再試。";
        case "en": return "Outlook is currently rate-limited for sending. Please try again later.";
        case "ja": return "Outlook で現在送信レート制限が発生しています。しばらくしてからお試しください。";
        default: return "Outlook 当前触发了发送频率限制，请稍后重试。";
      }
    case "OUTLOOK_SEND_FAILED":
      switch (locale) {
        case "zh-TW": return "Outlook 發信失敗。";
        case "en": return "Outlook failed to send the message.";
        case "ja": return "Outlook での送信に失敗しました。";
        default: return "Outlook 发信失败。";
      }
    case "IMAP_AUTH_INVALID": {
      const label = errorDetails || (locale === "en" ? "This mailbox" : locale === "ja" ? "このメールボックス" : locale === "zh-TW" ? "這個信箱" : "该邮箱");
      switch (locale) {
        case "zh-TW": return `${label} 的授權碼或密碼無效，請重新檢查登入憑證。`;
        case "en": return `${label} rejected the app password or password. Please check the login credential again.`;
        case "ja": return `${label} の認証コードまたはパスワードが無効です。ログイン情報を再確認してください。`;
        default: return `${label}授权码或密码无效，请重新检查登录凭据。`;
      }
    }
    case "IMAP_RATE_LIMITED": {
      const label = errorDetails || (locale === "en" ? "This mailbox" : locale === "ja" ? "このメールボックス" : locale === "zh-TW" ? "這個信箱" : "该邮箱");
      switch (locale) {
        case "zh-TW": return `${label} 目前觸發了頻率或暫時性限制，請稍後再試。`;
        case "en": return `${label} is currently rate-limited or temporarily restricted. Please try again later.`;
        case "ja": return `${label} で現在レート制限または一時的な制限が発生しています。しばらくしてからお試しください。`;
        default: return `${label}当前触发了频率或临时限制，请稍后重试。`;
      }
    }
    case "IMAP_NETWORK": {
      const label = errorDetails || (locale === "en" ? "this mailbox" : locale === "ja" ? "このメールボックス" : locale === "zh-TW" ? "這個信箱" : "该邮箱");
      switch (locale) {
        case "zh-TW": return `連線到 ${label} 的 SMTP 服務失敗，請稍後再試。`;
        case "en": return `Failed to connect to the SMTP service for ${label}. Please try again later.`;
        case "ja": return `${label} の SMTP サービスへの接続に失敗しました。しばらくしてからお試しください。`;
        default: return `连接 ${label} SMTP 服务失败，请稍后重试。`;
      }
    }
    case "IMAP_SEND_FAILED": {
      const label = errorDetails || (locale === "en" ? "This mailbox" : locale === "ja" ? "このメールボックス" : locale === "zh-TW" ? "這個信箱" : "该邮箱");
      switch (locale) {
        case "zh-TW": return `${label} 發信失敗。`;
        case "en": return `${label} failed to send the message.`;
        case "ja": return `${label} での送信に失敗しました。`;
        default: return `${label}发信失败。`;
      }
    }
  }

  switch (errorCode) {
    case "AUTH_EXPIRED":
      switch (locale) {
        case "zh-TW": return "寄送失敗：帳號登入已過期，請重新授權。";
        case "en": return "Sending failed: the account authorization has expired. Please reauthorize it.";
        case "ja": return "送信に失敗しました。アカウント認可の期限が切れています。再認可してください。";
        default: return "发送失败：账号登录已过期，请重新授权。";
      }
    case "INSUFFICIENT_SCOPE":
      switch (locale) {
        case "zh-TW": return "寄送失敗：目前帳號沒有發信權限，請重新授權。";
        case "en": return "Sending failed: this account does not have sending permission. Please reauthorize it.";
        case "ja": return "送信に失敗しました。このアカウントには送信権限がありません。再認可してください。";
        default: return "发送失败：当前账号没有发送权限，请重新授权。";
      }
    case "RATE_LIMITED":
      switch (locale) {
        case "zh-TW": return "寄送失敗：目前觸發了頻率限制，請稍後再試。";
        case "en": return "Sending failed: a rate limit was hit. Please try again later.";
        case "ja": return "送信に失敗しました。現在レート制限がかかっています。しばらくしてからお試しください。";
        default: return "发送失败：当前触发了频率限制，请稍后重试。";
      }
    case "NETWORK":
      switch (locale) {
        case "zh-TW": return "寄送失敗：網路異常，請稍後再試。";
        case "en": return "Sending failed: a network error occurred. Please try again later.";
        case "ja": return "送信に失敗しました。ネットワークエラーが発生しました。しばらくしてからお試しください。";
        default: return "发送失败：网络异常，请稍后再试。";
      }
    case "UNSUPPORTED":
      switch (locale) {
        case "zh-TW": return "寄送失敗：目前信箱暫不支援發信。";
        case "en": return "Sending failed: this mailbox does not support sending right now.";
        case "ja": return "送信に失敗しました。このメールボックスは現在送信に対応していません。";
        default: return "发送失败：当前邮箱暂不支持发信。";
      }
    case "PROVIDER_ERROR":
      return getDefaultSendFailure(locale);
    case "VALIDATION":
      return errorMessage || getDefaultSendFailure(locale);
    default:
      return getDefaultSendFailure(locale);
  }
}
