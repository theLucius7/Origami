"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Languages, ExternalLink } from "lucide-react";
import { APP_LOCALE_COOKIE, APP_LOCALES, getDocsLocaleHref, getLocaleDisplayName, normalizeAppLocale } from "@/i18n/locale";
import { useI18n } from "@/components/providers/i18n-provider";

function setLocaleCookie(locale: string) {
  document.cookie = `${APP_LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, messages } = useI18n();

  function handleLocaleChange(nextLocale: string) {
    const normalized = normalizeAppLocale(nextLocale);
    setLocaleCookie(normalized);

    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    const params = new URLSearchParams(currentQuery);
    params.delete("lang");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    if (nextUrl === currentUrl) {
      router.refresh();
      return;
    }

    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-background/75 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        <Languages className="h-3.5 w-3.5" />
        {messages.locale.label}
      </div>
      <select
        aria-label={messages.locale.label}
        value={locale}
        onChange={(event) => handleLocaleChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
      >
        {APP_LOCALES.map((item) => (
          <option key={item} value={item}>
            {getLocaleDisplayName(item)}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-muted-foreground">{messages.locale.helper}</p>
      <Link
        href={getDocsLocaleHref(locale)}
        target="_blank"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {messages.locale.docsLink}
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
