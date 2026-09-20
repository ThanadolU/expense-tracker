import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

export const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

let _r2Client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

export function getR2Client(): S3Client | null {
  if (!isR2Configured()) {
    return null;
  }

  if (!_r2Client) {
    _r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  return _r2Client;
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

export function validateReceiptFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "File is empty." };
  }

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return {
      ok: false,
      error: `File is too large. Maximum size is ${MAX_RECEIPT_SIZE_BYTES / (1024 * 1024)}MB.`,
    };
  }

  const isValidType = ALLOWED_RECEIPT_MIME_TYPES.includes(
    file.type as (typeof ALLOWED_RECEIPT_MIME_TYPES)[number],
  );

  if (!isValidType) {
    return {
      ok: false,
      error: "Invalid file format. Supported formats: JPG, PNG, WebP, HEIC, and PDF.",
    };
  }

  return { ok: true };
}

export type UploadResult =
  | { ok: true; key: string; url: string }
  | { ok: false; error: string };

/**
 * Upload a receipt file to Cloudflare R2.
 */
export async function uploadReceiptToR2(
  file: File,
  userId: string,
): Promise<UploadResult> {
  const validation = validateReceiptFile(file);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  if (!isR2Configured()) {
    return {
      ok: false,
      error:
        "Cloudflare R2 storage is not configured. Please set R2 credentials in .env.",
    };
  }

  const client = getR2Client();
  if (!client) {
    return { ok: false, error: "Failed to initialize Cloudflare R2 client." };
  }

  const cleanName = sanitizeFilename(file.name || "receipt");
  const key = `receipts/${userId}/${Date.now()}-${cleanName}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      }),
    );

    // If a public domain or custom CDN domain is configured, use it directly
    const publicDomain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "");
    const url = publicDomain ? `${publicDomain}/${key}` : "";

    return { ok: true, key, url };
  } catch (error) {
    console.error("Error uploading receipt to R2:", error);
    return {
      ok: false,
      error: "Failed to upload receipt to Cloudflare storage.",
    };
  }
}

/**
 * Delete a receipt object from Cloudflare R2.
 */
export async function deleteReceiptFromR2(key: string): Promise<{ ok: boolean; error?: string }> {
  if (!key || !isR2Configured()) {
    return { ok: false };
  }

  const client = getR2Client();
  if (!client) {
    return { ok: false };
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    );
    return { ok: true };
  } catch (error) {
    console.error("Error deleting receipt from R2:", error);
    return { ok: false, error: "Failed to delete receipt from Cloudflare storage." };
  }
}

/**
 * Fetch a receipt object stream from Cloudflare R2.
 */
export async function getReceiptFromR2(key: string) {
  if (!key || !isR2Configured()) {
    return null;
  }

  const client = getR2Client();
  if (!client) {
    return null;
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    );
    return response;
  } catch (error) {
    console.error("Error fetching receipt from R2:", error);
    return null;
  }
}
