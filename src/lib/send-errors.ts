import type { SendMailErrorCode } from "@/lib/providers/types";

export function mapSendErrorToMessage(errorCode: SendMailErrorCode | undefined, fallback: string) {
  switch (errorCode) {
    case "AUTH_EXPIRED":
      return "发送失败：账号登录已过期，请重新授权。";
    case "INSUFFICIENT_SCOPE":
      return "发送失败：当前账号没有发送权限，请重新授权。";
    case "RATE_LIMITED":
      return "发送失败：当前触发了频率限制，请稍后重试。";
    case "NETWORK":
      return "发送失败：网络异常，请稍后再试。";
    case "UNSUPPORTED":
      return "发送失败：当前邮箱暂不支持发信。";
    case "VALIDATION":
      return fallback;
    default:
      return fallback || "发送失败，请稍后重试。";
  }
}
