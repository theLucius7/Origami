import { db } from "@/lib/db";
import { attachments, emails, type Email } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { buildObjectKey, uploadAttachment } from "@/lib/r2";
import { getAccountWithProvider, persistProviderCredentialsIfNeeded } from "@/lib/account-providers";
import { getEmailRecordById, listEmailAttachments } from "@/lib/queries/emails";

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

export async function hydrateEmailIfNeeded(email: Email): Promise<Email> {
  if ((email.bodyText && email.bodyText.length > 0) || (email.bodyHtml && email.bodyHtml.length > 0)) {
    return email;
  }

  if (!email.remoteId) {
    return email;
  }

  try {
    const resolved = await getAccountWithProvider(email.accountId);
    if (!resolved) return email;

    const { account, provider } = resolved;
    const fetched = await provider.fetchEmail(email.remoteId);
    if (!fetched) return email;

    await persistProviderCredentialsIfNeeded(account, provider);

    await db
      .update(emails)
      .set({
        subject: fetched.subject,
        sender: fetched.sender,
        recipients: JSON.stringify(fetched.recipients),
        snippet: fetched.snippet,
        bodyText: fetched.bodyText,
        bodyHtml: fetched.bodyHtml,
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
    console.error("Failed to hydrate email body:", error);
    return email;
  }
}

export async function getHydratedEmailDetail(emailId: string) {
  const email = await getEmailRecordById(emailId);
  if (!email) return null;

  const hydrated = await hydrateEmailIfNeeded(email);
  const emailAttachments = await listEmailAttachments(emailId);
  return { email: hydrated, attachments: emailAttachments };
}
