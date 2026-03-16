import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let _s3: S3Client | null = null;

function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

function getBucket() {
  return process.env.R2_BUCKET_NAME!;
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
