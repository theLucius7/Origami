import { NextRequest, NextResponse } from "next/server";
import { downloadAttachment } from "@/lib/r2";
import { db } from "@/lib/db";
import { attachments, sentMessageAttachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { APP_LOCALE_COOKIE, normalizeAppLocale, type AppLocale } from "@/i18n/locale";

function getRequestLocale(request: NextRequest): AppLocale {
  return normalizeAppLocale(request.cookies.get(APP_LOCALE_COOKIE)?.value);
}

function getAttachmentDownloadErrorMessage(
  kind: "storageUnavailable" | "downloadFailed",
  locale: AppLocale
) {
  switch (kind) {
    case "storageUnavailable":
      switch (locale) {
        case "zh-TW":
          return "附件儲存尚未配置完成，暫時無法下載附件。";
        case "en":
          return "Attachment storage is not configured yet, so downloads are temporarily unavailable.";
        case "ja":
          return "添付ファイル保存先がまだ設定されていないため、現在はダウンロードできません。";
        default:
          return "附件存储尚未配置完成，暂时无法下载附件。";
      }
    case "downloadFailed":
      switch (locale) {
        case "zh-TW":
          return "附件下載失敗，請稍後再試。";
        case "en":
          return "Attachment download failed. Please try again later.";
        case "ja":
          return "添付ファイルのダウンロードに失敗しました。しばらくしてからもう一度お試しください。";
        default:
          return "附件下载失败，请稍后再试。";
      }
  }
}

function isMissingR2ConfigError(error: unknown) {
  return error instanceof Error && /^Missing environment variable: R2_/.test(error.message);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const locale = getRequestLocale(request);
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);

  const inboundRows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, decodedKey));

  const inboundAttachment = inboundRows[0];

  const sentRows = inboundAttachment
    ? []
    : await db
        .select()
        .from(sentMessageAttachments)
        .where(eq(sentMessageAttachments.id, decodedKey));

  const attachment = inboundAttachment ?? sentRows[0];
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { body, contentType } = await downloadAttachment(attachment.r2ObjectKey);

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.filename ?? "file")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (isMissingR2ConfigError(error)) {
      return NextResponse.json(
        { error: getAttachmentDownloadErrorMessage("storageUnavailable", locale) },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: getAttachmentDownloadErrorMessage("downloadFailed", locale) },
      { status: 502 }
    );
  }
}
