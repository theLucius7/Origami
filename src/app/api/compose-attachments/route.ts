import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { composeUploads } from "@/lib/db/schema";
import { buildComposeUploadKey, uploadAttachment } from "@/lib/r2";
import { APP_LOCALE_COOKIE, normalizeAppLocale, type AppLocale } from "@/i18n/locale";

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

function getRequestLocale(request: NextRequest): AppLocale {
  return normalizeAppLocale(request.cookies.get(APP_LOCALE_COOKIE)?.value);
}

function getAttachmentUploadErrorMessage(
  kind: "missing" | "empty" | "tooLarge",
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
  }
}

export async function POST(request: NextRequest) {
  const locale = getRequestLocale(request);
  const formData = await request.formData();
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

  await uploadAttachment(key, buffer, file.type || "application/octet-stream");
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
