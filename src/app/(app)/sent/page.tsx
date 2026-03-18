import { listSentMessages } from "@/lib/queries/sent-messages";
import { SentList } from "@/components/sent/sent-list";

interface PageProps {
  searchParams: Promise<{ account?: string }>;
}

export default async function SentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const accountId = params.account;
  const messages = await listSentMessages(accountId);

  return <SentList messages={messages} accountId={accountId} />;
}
