import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSentMessageDetailRecord } from "@/lib/queries/sent-messages";
import { SentDetail } from "@/components/sent/sent-detail";
import { Button } from "@/components/ui/button";
import { buildSentHref } from "@/lib/inbox-route";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ account?: string }>;
}

export default async function SentDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const detail = await getSentMessageDetailRecord(id);

  if (!detail) notFound();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="border-b p-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={buildSentHref(query.account)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回已发送
          </Link>
        </Button>
      </div>
      <SentDetail
        message={detail.message}
        account={detail.account}
        attachments={detail.attachments}
      />
    </div>
  );
}
