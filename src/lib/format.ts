import type { AppLocale } from "@/i18n/locale";

function getIntlLocale(locale: AppLocale) {
  switch (locale) {
    case "zh-CN":
      return "zh-CN";
    case "zh-TW":
      return "zh-TW";
    case "en":
      return "en-US";
    case "ja":
      return "ja-JP";
  }
}

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: AppLocale, sameYear: boolean) {
  const cacheKey = `${locale}:${sameYear ? "current" : "historical"}`;
  let formatter = dateFormatterCache.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(
      getIntlLocale(locale),
      sameYear
        ? { month: "short", day: "numeric" }
        : { year: "numeric", month: "short", day: "numeric" }
    );
    dateFormatterCache.set(cacheKey, formatter);
  }

  return formatter;
}

export function formatRelativeTime(unixTimestamp: number, locale: AppLocale = "zh-CN"): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixTimestamp;

  if (diff < 60) {
    switch (locale) {
      case "zh-TW":
        return "剛剛";
      case "en":
        return "Just now";
      case "ja":
        return "たった今";
      default:
        return "刚刚";
    }
  }

  if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    switch (locale) {
      case "zh-TW":
        return `${minutes} 分鐘前`;
      case "en":
        return `${minutes} min ago`;
      case "ja":
        return `${minutes} 分前`;
      default:
        return `${minutes} 分钟前`;
    }
  }

  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    switch (locale) {
      case "zh-TW":
        return `${hours} 小時前`;
      case "en":
        return `${hours} hr ago`;
      case "ja":
        return `${hours} 時間前`;
      default:
        return `${hours} 小时前`;
    }
  }

  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    switch (locale) {
      case "zh-TW":
        return `${days} 天前`;
      case "en":
        return `${days} day${days === 1 ? "" : "s"} ago`;
      case "ja":
        return `${days} 日前`;
      default:
        return `${days} 天前`;
    }
  }

  const date = new Date(unixTimestamp * 1000);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return getDateFormatter(locale, sameYear).format(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
