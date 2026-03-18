import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import { buildSentDetailHref } from "@/lib/inbox-route";
import { parseStoredStringList } from "@/lib/string-list";
import type { SentMessage } from "@/lib/db/schema";

export function SentList({
  messages,
  accountId,
}: {
  messages: SentMessage[];
  accountId?: string;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-muted-foreground">
        暂无已发送记录
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-6">
      <div>
        <h1 className="text-2xl font-semibold">已发送</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          这里展示 Origami 本地保存的已发送记录。
          {accountId ? " 当前仅显示选中账号的发信记录。" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {messages.map((message) => {
          const toRecipients = parseStoredStringList(message.toRecipients);
          return (
            <Link
              key={message.id}
              href={buildSentDetailHref(message.id, accountId)}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{message.subject || "(无主题)"}</span>
                    <Badge variant="secondary">已发送</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    To: {toRecipients.join(", ") || "-"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {message.snippet || message.bodyText || "无摘要"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(message.sentAt)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
