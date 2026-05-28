import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsCredentials } from "@/lib/aws-credentials";

export const S3_BUCKET =
  process.env.NEXT_PUBLIC_AWS_S3_BUCKET ?? process.env.S3_BUCKET ?? "";
export const AWS_REGION =
  process.env.NEXT_PUBLIC_AWS_REGION ?? process.env.AWS_REGION ?? "us-east-1";
export const s3Configured = Boolean(S3_BUCKET);

let _s3: S3Client | null = null;
function s3(): S3Client {
  if (!_s3) _s3 = new S3Client({ region: AWS_REGION, credentials: awsCredentials() });
  return _s3;
}

/** Presigned PUT URL the browser uses to upload a file directly to S3. */
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

/** Presigned GET URL for downloading/previewing an object. */
export async function presignDownload(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn },
  );
}

/** Delete an object from S3 (best-effort; no-op when S3 isn't configured). */
export async function deleteObject(key: string): Promise<void> {
  if (!s3Configured) return;
  await s3().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

/** Server-side upload (no browser CORS needed). */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** Split a `data:<type>;base64,<payload>` URL into its content type + bytes. */
export function parseDataUrl(
  dataUrl: string,
): { contentType: string; buffer: Buffer } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!m) return null;
  return { contentType: m[1], buffer: Buffer.from(m[2], "base64") };
}

/**
 * Persist a workspace logo. Uploads to S3 when configured (returns the object
 * key to store on the workspace) and otherwise hands back the data URL to keep
 * inline (demo / no-S3 mode — callers should pass a downscaled, compact one).
 */
export async function storeWorkspaceLogo(
  workspaceId: string,
  dataUrl: string,
): Promise<{ logoKey?: string; logo?: string }> {
  const parsed = parseDataUrl(dataUrl);
  if (s3Configured && parsed) {
    const ext = (parsed.contentType.split("/")[1] ?? "img").replace(/[^\w]/g, "");
    const objectKey = `workspaces/${workspaceId}/branding/logo-${crypto
      .randomUUID()
      .slice(0, 8)}.${ext}`;
    await putObject(objectKey, parsed.buffer, parsed.contentType);
    return { logoKey: objectKey };
  }
  return { logo: dataUrl };
}

/** A long-lived (7-day) presigned URL for displaying a stored logo. */
export async function logoDisplayUrl(logoKey: string): Promise<string> {
  return presignDownload(logoKey, 604800);
}
