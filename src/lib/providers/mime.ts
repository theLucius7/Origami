import { randomBytes } from "crypto";
import type { SendMailParams, SyncedAttachment } from "./types";

function encodeHeader(value: string): string {
  return /[^\x20-\x7E]/.test(value)
    ? `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
    : value;
}

function escapeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function wrapBase64(value: Buffer | string): string {
  const base64 = (Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8")).toString("base64");
  return base64.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function buildTextPart(contentType: "text/plain" | "text/html", body: string): string {
  return [
    `Content-Type: ${contentType}; charset=\"UTF-8\"`,
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(body),
  ].join("\r\n");
}

function buildAttachmentPart(attachment: SyncedAttachment): string {
  const filename = escapeHeader(attachment.filename || "attachment");
  return [
    `Content-Type: ${attachment.contentType || "application/octet-stream"}; name=\"${filename}\"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename=\"${filename}\"`,
    "",
    wrapBase64(attachment.content),
  ].join("\r\n");
}

export function buildMimeMessage(params: SendMailParams): string {
  const mixedBoundary = `mix_${randomBytes(12).toString("hex")}`;
  const alternativeBoundary = `alt_${randomBytes(12).toString("hex")}`;
  const hasAttachments = (params.attachments?.length ?? 0) > 0;
  const hasHtml = Boolean(params.htmlBody);

  const headers = [
    `From: ${escapeHeader(params.from)}`,
    `To: ${params.to.map(escapeHeader).join(", ")}`,
    ...(params.cc?.length ? [`Cc: ${params.cc.map(escapeHeader).join(", ")}`] : []),
    ...(params.bcc?.length ? [`Bcc: ${params.bcc.map(escapeHeader).join(", ")}`] : []),
    `Subject: ${encodeHeader(escapeHeader(params.subject || "(无主题)"))}`,
    "MIME-Version: 1.0",
  ];

  if (!hasAttachments && !hasHtml) {
    return [
      ...headers,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      wrapBase64(params.textBody || ""),
      "",
    ].join("\r\n");
  }

  if (!hasAttachments && hasHtml) {
    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary=\"${alternativeBoundary}\"`,
      "",
      `--${alternativeBoundary}`,
      buildTextPart("text/plain", params.textBody || ""),
      `--${alternativeBoundary}`,
      buildTextPart("text/html", params.htmlBody || ""),
      `--${alternativeBoundary}--`,
      "",
    ].join("\r\n");
  }

  const parts: string[] = [];

  if (hasHtml) {
    parts.push(
      [
        `--${mixedBoundary}`,
        `Content-Type: multipart/alternative; boundary=\"${alternativeBoundary}\"`,
        "",
        `--${alternativeBoundary}`,
        buildTextPart("text/plain", params.textBody || ""),
        `--${alternativeBoundary}`,
        buildTextPart("text/html", params.htmlBody || ""),
        `--${alternativeBoundary}--`,
        "",
      ].join("\r\n")
    );
  } else {
    parts.push([`--${mixedBoundary}`, buildTextPart("text/plain", params.textBody || ""), ""].join("\r\n"));
  }

  for (const attachment of params.attachments ?? []) {
    parts.push([`--${mixedBoundary}`, buildAttachmentPart(attachment), ""].join("\r\n"));
  }

  parts.push(`--${mixedBoundary}--`);

  return [
    ...headers,
    `Content-Type: multipart/mixed; boundary=\"${mixedBoundary}\"`,
    "",
    ...parts,
    "",
  ].join("\r\n");
}

export function encodeMimeMessageBase64Url(message: string): string {
  return Buffer.from(message, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
