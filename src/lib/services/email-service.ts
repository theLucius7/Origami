import { db } from "@/lib/db";
import { attachments, emails, type Email } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { buildObjectKey, uploadAttachment } from "@/lib/r2";
import { getAccountWithProvider, persistProviderCredentialsIfNeeded } from "@/lib/account-providers";
import { getEmailRecordById, listEmailAttachments } from "@/lib/queries/emails";

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

async function persistAttachment(
  accountId: string,
  emailId: string,
  att: {
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }
) {
  if (!att.content || att.content.length === 0) {
    return;
  }

  const attId = nanoid();
  const key = buildObjectKey(accountId, emailId, att.filename);

  await uploadAttachment(key, att.content, att.contentType);
  await db.insert(attachments).values({
    id: attId,
    emailId,
    filename: att.filename,
    contentType: att.contentType,
    size: att.size,
    r2ObjectKey: key,
  });
}

async function setHydrationState(
  emailId: string,
  patch: {
    hydrationStatus: string;
    hydratedAt?: number | null;
    hydrationError?: string | null;
  }
) {
  await db.update(emails).set(patch).where(eq(emails.id, emailId));
}

export async function hydrateEmailIfNeeded(email: Email): Promise<Email> {
  if (email.hydrationStatus === "hydrated") {
    return email;
  }

  if (!email.remoteId) {
    return email;
  }

  await setHydrationState(email.id, {
    hydrationStatus: "hydrating",
    hydrationError: null,
  });

  try {
    const resolved = await getAccountWithProvider(email.accountId);
    if (!resolved) {
      await setHydrationState(email.id, {
        hydrationStatus: "failed",
        hydratedAt: nowUnix(),
        hydrationError: "账号不存在或 provider 初始化失败。",
      });
      return (await getEmailRecordById(email.id)) ?? email;
    }

    const { account, provider } = resolved;
    const fetched = await provider.fetchEmail(email.remoteId);
    if (!fetched) {
      await setHydrationState(email.id, {
        hydrationStatus: "failed",
        hydratedAt: nowUnix(),
        hydrationError: "远端未找到这封邮件，可能已被删除或移动。",
      });
      return (await getEmailRecordById(email.id)) ?? email;
    }

    await persistProviderCredentialsIfNeeded(account, provider);

    await db
      .update(emails)
      .set({
        remoteId: fetched.remoteId,
        messageId: fetched.messageId,
        subject: fetched.subject,
        sender: fetched.sender,
        recipients: JSON.stringify(fetched.recipients),
        snippet: fetched.snippet,
        bodyText: fetched.bodyText,
        bodyHtml: fetched.bodyHtml,
        hydrationStatus: "hydrated",
        hydratedAt: nowUnix(),
        hydrationError: null,
        isRead: fetched.isRead ? 1 : 0,
        isStarred: fetched.isStarred ? 1 : 0,
        receivedAt: fetched.receivedAt,
        folder: fetched.folder,
      })
      .where(eq(emails.id, email.id));

    const existingAttachments = await listEmailAttachments(email.id);
    if (existingAttachments.length === 0) {
      for (const att of fetched.attachments) {
        await persistAttachment(email.accountId, email.id, att);
      }
    }

    return (await getEmailRecordById(email.id)) ?? email;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to hydrate email body:", error);
    await setHydrationState(email.id, {
      hydrationStatus: "failed",
      hydratedAt: nowUnix(),
      hydrationError: message,
    });
    return (await getEmailRecordById(email.id)) ?? email;
  }
}

export async function getHydratedEmailDetail(emailId: string) {
  const email = await getEmailRecordById(emailId);
  if (!email) return null;

  const hydrated = await hydrateEmailIfNeeded(email);
  const emailAttachments = await listEmailAttachments(emailId);
  return { email: hydrated, attachments: emailAttachments };
}
