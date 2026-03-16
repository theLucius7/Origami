import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { composeUploads } from "@/lib/db/schema";
import { buildComposeUploadKey, uploadAttachment } from "@/lib/r2";
import { nanoid } from "nanoid";

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  if (file.size >= MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      { error: "当前版本单个附件需小于 3 MB。" },
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
