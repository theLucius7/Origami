import { getSentMessages } from "@/actions/send";
import { SentList } from "@/components/sent-list";

interface PageProps {
  searchParams: Promise<{ account?: string }>;
}

export default async function SentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const messages = await getSentMessages(params.account);

  return <SentList messages={messages} />;
}
