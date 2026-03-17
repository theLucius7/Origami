import { notFound } from "next/navigation";
import { getHydratedEmailDetail } from "@/lib/services/email-service";
import { MailDetail } from "@/components/inbox/mail-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buildInboxHref } from "@/lib/inbox-route";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    account?: string;
    starred?: string;
    search?: string;
  }>;
}

export default async function MailDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const detail = await getHydratedEmailDetail(id);

  if (!detail) notFound();

  const backHref = buildInboxHref({
    accountId: query.account,
    starred: query.starred === "1",
    search: query.search,
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b p-2 md:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回
          </Link>
        </Button>
      </div>
      <div className="flex-1">
        <MailDetail email={detail.email} attachments={detail.attachments} />
      </div>
    </div>
  );
}
