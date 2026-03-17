import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getR2Config } from "@/config/r2";

let _s3: S3Client | null = null;

function getS3() {
  if (!_s3) {
    const config = getR2Config();
    _s3 = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: config.credentials,
    });
  }
  return _s3;
}

function getBucket() {
  return getR2Config().bucketName;
}

export async function uploadAttachment(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function downloadAttachment(
  key: string
): Promise<{ body: ReadableStream; contentType: string }> {
  const res = await getS3().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key })
  );
  return {
    body: res.Body!.transformToWebStream(),
    contentType: res.ContentType ?? "application/octet-stream",
  };
}

export async function downloadAttachmentBuffer(
  key: string
): Promise<{ content: Buffer; contentType: string }> {
  const res = await getS3().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key })
  );

  const bytes = await res.Body!.transformToByteArray();
  return {
    content: Buffer.from(bytes),
    contentType: res.ContentType ?? "application/octet-stream",
  };
}

export async function deleteAttachment(key: string): Promise<void> {
  await getS3().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

export function buildObjectKey(
  accountId: string,
  emailId: string,
  filename: string
): string {
  return `${accountId}/${emailId}/${filename}`;
}

export function buildComposeUploadKey(uploadId: string, filename: string): string {
  return `compose/${uploadId}/${filename}`;
}
