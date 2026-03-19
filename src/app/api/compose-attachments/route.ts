import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { composeUploads } from "@/lib/db/schema";
import { buildComposeUploadKey, uploadAttachment } from "@/lib/r2";
import { cleanupExpiredComposeUploads } from "@/lib/compose-uploads";
import { APP_LOCALE_COOKIE, normalizeAppLocale, type AppLocale } from "@/i18n/locale";

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

function getRequestLocale(request: NextRequest): AppLocale {
  return normalizeAppLocale(request.cookies.get(APP_LOCALE_COOKIE)?.value);
}

function getAttachmentUploadErrorMessage(
  kind: "missing" | "empty" | "tooLarge" | "storageUnavailable" | "uploadFailed",
  locale: AppLocale
) {
  switch (kind) {
    case "missing":
      switch (locale) {
        case "zh-TW":
          return "缺少附件檔案。";
        case "en":
          return "Missing attachment file.";
        case "ja":
          return "添付ファイルが指定されていません。";
        default:
          return "缺少附件文件。";
      }
    case "empty":
      switch (locale) {
        case "zh-TW":
          return "附件檔案不能為空。";
        case "en":
          return "The attachment file cannot be empty.";
        case "ja":
          return "添付ファイルは空にできません。";
        default:
          return "附件文件不能为空。";
      }
    case "tooLarge":
      switch (locale) {
        case "zh-TW":
          return "目前版本單個附件需小於 3 MB。";
        case "en":
          return "Each attachment must currently be smaller than 3 MB.";
        case "ja":
          return "現在のバージョンでは、各添付ファイルは 3 MB 未満である必要があります。";
        default:
          return "当前版本单个附件需小于 3 MB。";
      }
    case "storageUnavailable":
      switch (locale) {
        case "zh-TW":
          return "附件儲存尚未配置完成，暫時無法上傳附件。";
        case "en":
          return "Attachment storage is not configured yet, so uploads are temporarily unavailable.";
        case "ja":
          return "添付ファイル保存先がまだ設定されていないため、現在はアップロードできません。";
        default:
          return "附件存储尚未配置完成，暂时无法上传附件。";
      }
    case "uploadFailed":
      switch (locale) {
        case "zh-TW":
          return "附件上傳失敗，請稍後再試。";
        case "en":
          return "Attachment upload failed. Please try again later.";
        case "ja":
          return "添付ファイルのアップロードに失敗しました。しばらくしてからもう一度お試しください。";
        default:
          return "附件上传失败，请稍后再试。";
      }
  }
}

function isInvalidFormDataRequest(error: unknown) {
  return (
    error instanceof TypeError &&
    error.message.includes('Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded"')
  );
}

function isMissingR2ConfigError(error: unknown) {
  return error instanceof Error && /^Missing environment variable: R2_/.test(error.message);
}

export async function POST(request: NextRequest) {
  const locale = getRequestLocale(request);
  await cleanupExpiredComposeUploads();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    if (isInvalidFormDataRequest(error)) {
      return NextResponse.json({ error: getAttachmentUploadErrorMessage("missing", locale) }, { status: 400 });
    }
    throw error;
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: getAttachmentUploadErrorMessage("missing", locale) }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: getAttachmentUploadErrorMessage("empty", locale) }, { status: 400 });
  }

  if (file.size >= MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      { error: getAttachmentUploadErrorMessage("tooLarge", locale) },
      { status: 400 }
    );
  }

  const uploadId = nanoid();
  const key = buildComposeUploadKey(uploadId, file.name || "attachment");
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadAttachment(key, buffer, file.type || "application/octet-stream");
  } catch (error) {
    if (isMissingR2ConfigError(error)) {
      return NextResponse.json(
        { error: getAttachmentUploadErrorMessage("storageUnavailable", locale) },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: getAttachmentUploadErrorMessage("uploadFailed", locale) },
      { status: 502 }
    );
  }

  await db.insert(composeUploads).values({
    id: uploadId,
    filename: file.name || "attachment",
    contentType: file.type || "application/octet-stream",
    size: file.size,
    r2ObjectKey: key,
  });

  return NextResponse.json({
    id: uploadId,
    filename: file.name || "attachment",
    contentType: file.type || "application/octet-stream",
    size: file.size,
  });
}
