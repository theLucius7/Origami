export const PROVIDER_META: Record<
  string,
  {
    label: string;
    dotClass: string;
    badgeClass: string;
  }
> = {
  gmail: {
    label: "Gmail",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  outlook: {
    label: "Outlook",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  qq: {
    label: "QQ 邮箱",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  imap_smtp: {
    label: "IMAP / SMTP",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

export function getProviderMeta(provider: string) {
  return (
    PROVIDER_META[provider] ?? {
      label: provider,
      dotClass: "bg-gray-500",
      badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    }
  );
}
