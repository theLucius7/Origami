"use server";

import { inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  accounts,
  composeUploads,
  sentMessages,
  sentMessageAttachments,
} from "@/lib/db/schema";
import { downloadAttachmentBuffer } from "@/lib/r2";
import type { SendMailResult, SyncedAttachment } from "@/lib/providers/types";
import {
  getAccountWithProvider,
  persistProviderCredentialsIfNeeded,
} from "@/lib/account-providers";
import {
  getSentMessageDetailRecord,
  getSentMessageRecordById,
  listSentMessageAttachments,
  listSentMessages,
} from "@/lib/queries/sent-messages";

const MAX_OUTLOOK_SAFE_ATTACHMENT_BYTES = 3 * 1024 * 1024;

export interface SendMailActionInput {
  accountId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  textBody: string;
  htmlBody?: string | null;
  attachmentIds?: string[];
}

export type SendMailActionResult = SendMailResult & {
  localMessageId?: string;
};

function buildSnippet(textBody: string, htmlBody?: string | null): string {
  const source = textBody || htmlBody?.replace(/<[^>]+>/g, " ") || "";
  return source.replace(/\s+/g, " ").trim().slice(0, 160);
}

function normalizeAddressList(values?: string[]): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

async function loadComposeAttachments(attachmentIds: string[]): Promise<Array<{
  id: string;
  filename: string;
  contentType: string;
  size: number;
  r2ObjectKey: string;
  content: Buffer;
}>> {
  if (attachmentIds.length === 0) return [];

  const rows = await db
    .select()
    .from(composeUploads)
    .where(inArray(composeUploads.id, attachmentIds));

  const byId = new Map(rows.map((row) => [row.id, row]));
  const orderedRows = attachmentIds.map((id) => byId.get(id)).filter(Boolean);

  if (orderedRows.length !== attachmentIds.length) {
    throw new Error("部分附件不存在或已失效，请重新上传。");
  }

  return Promise.all(
    orderedRows.map(async (row) => {
      const { content } = await downloadAttachmentBuffer(row!.r2ObjectKey);
      return {
        id: row!.id,
        filename: row!.filename,
        contentType: row!.contentType,
        size: row!.size,
        r2ObjectKey: row!.r2ObjectKey,
        content,
      };
    })
  );
}

async function persistSentMessage(
  account: typeof accounts.$inferSelect,
  input: SendMailActionInput,
  providerMessageId: string | null,
  sentAt: number,
  uploadedAttachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
    r2ObjectKey: string;
  }>
): Promise<string> {
  const id = nanoid();

  await db.insert(sentMessages).values({
    id,
    accountId: account.id,
    provider: account.provider,
    fromAddress: input.from,
    toRecipients: JSON.stringify(normalizeAddressList(input.to)),
    ccRecipients: JSON.stringify(normalizeAddressList(input.cc)),
    bccRecipients: JSON.stringify(normalizeAddressList(input.bcc)),
    subject: input.subject || "(无主题)",
    snippet: buildSnippet(input.textBody, input.htmlBody),
    bodyText: input.textBody,
    bodyHtml: input.htmlBody ?? null,
    providerMessageId,
    status: "sent",
    sentAt,
  });

  if (uploadedAttachments.length > 0) {
    await db.insert(sentMessageAttachments).values(
      uploadedAttachments.map((attachment) => ({
        id: nanoid(),
        sentMessageId: id,
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        r2ObjectKey: attachment.r2ObjectKey,
      }))
    );

    await db
      .delete(composeUploads)
      .where(inArray(composeUploads.id, uploadedAttachments.map((item) => item.id)));
  }

  return id;
}

export async function sendMailAction(input: SendMailActionInput): Promise<SendMailActionResult> {
  const to = normalizeAddressList(input.to);
  const cc = normalizeAddressList(input.cc);
  const bcc = normalizeAddressList(input.bcc);

  if (to.length === 0) {
    return {
      ok: false,
      errorCode: "VALIDATION",
      errorMessage: "至少填写一个 To 收件人。",
    };
  }

  if (!input.subject.trim() && !input.textBody.trim() && !input.htmlBody?.trim()) {
    return {
      ok: false,
      errorCode: "VALIDATION",
      errorMessage: "主题和正文至少填写一项。",
    };
  }

  const resolved = await getAccountWithProvider(input.accountId);
  if (!resolved) {
    return {
      ok: false,
      errorCode: "VALIDATION",
      errorMessage: "发件账号不存在。",
    };
  }

  const { account, provider } = resolved;

  if (!provider.getCapabilities().canSend) {
    return {
      ok: false,
      errorCode: "INSUFFICIENT_SCOPE",
      errorMessage: "当前账号未配置发送权限，请重新授权后再试。",
    };
  }

  const uploadedAttachments = await loadComposeAttachments(input.attachmentIds ?? []);

  if (
    account.provider === "outlook" &&
    uploadedAttachments.some((attachment) => attachment.size >= MAX_OUTLOOK_SAFE_ATTACHMENT_BYTES)
  ) {
    return {
      ok: false,
      errorCode: "VALIDATION",
      errorMessage: "Outlook 直发模式暂只支持小于 3 MB 的单个附件。",
    };
  }

  const sendAttachments: SyncedAttachment[] = uploadedAttachments.map((attachment) => ({
    filename: attachment.filename,
    contentType: attachment.contentType,
    size: attachment.size,
    content: attachment.content,
  }));

  const result = await provider.sendMail({
    from: input.from,
    to,
    cc,
    bcc,
    subject: input.subject,
    textBody: input.textBody,
    htmlBody: input.htmlBody,
    attachments: sendAttachments,
  });

  await persistProviderCredentialsIfNeeded(account, provider);

  if (!result.ok) {
    return result;
  }

  const localMessageId = await persistSentMessage(
    account,
    { ...input, to, cc, bcc },
    result.providerMessageId,
    result.sentAt,
    uploadedAttachments
  );

  return {
    ...result,
    localMessageId,
  };
}

export async function getSentMessages(accountId?: string) {
  return listSentMessages(accountId);
}

export async function getSentMessageById(id: string) {
  return getSentMessageRecordById(id);
}

export async function getSentMessageAttachments(sentMessageId: string) {
  return listSentMessageAttachments(sentMessageId);
}

export async function getSentMessageDetail(id: string) {
  return getSentMessageDetailRecord(id);
}
