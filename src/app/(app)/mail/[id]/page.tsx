import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MailDetail } from "@/components/inbox/mail-detail";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/locale.server";
import { buildInboxHref } from "@/lib/inbox-route";
import { getHydratedEmailDetail } from "@/lib/services/email-service";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    account?: string;
    starred?: string;
    search?: string;
  }>;
}

export default async function MailDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query, locale] = await Promise.all([params, searchParams, getRequestLocale()]);
  const messages = getMessages(locale);
  const detail = await getHydratedEmailDetail(id);

  if (!detail) notFound();

  const backHref = buildInboxHref({
    accountId: query.account,
    starred: query.starred === "1",
    search: query.search,
  });

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_26%)] p-4 md:p-6">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-border/70 bg-background/85 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="border-b border-border/60 px-3 py-3 md:hidden">
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {messages.common.back}
            </Link>
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <MailDetail email={detail.email} attachments={detail.attachments} />
        </div>
      </div>
    </div>
  );
}
