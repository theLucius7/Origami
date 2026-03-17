import { listSentMessages } from "@/lib/queries/sent-messages";
import { SentList } from "@/components/sent/sent-list";

interface PageProps {
  searchParams: Promise<{ account?: string }>;
}

export default async function SentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const messages = await listSentMessages(params.account);

  return <SentList messages={messages} />;
}
