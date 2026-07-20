import "server-only";

import { getOptionalEnv } from "@moja/config";
import {
  buildPublicUrl,
  deleteS3Object,
  isS3Configured,
  signGetObject,
  signPutObject,
} from "./s3";
import { getStoragePurpose, type StorageKeyContext } from "./purposes";

export interface PresignUploadInput {
  purpose: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  keyContext: StorageKeyContext;
}

export interface PresignUploadResult {
  uploadUrl: string;
  /** Empty for private purposes (use a signed download instead). */
  fileUrl: string;
  objectKey: string;
}

/** Thrown for configuration / validation problems during signing. */
export class StorageError extends Error {}

function notConfigured(): never {
  throw new StorageError(
    "File storage is not configured. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.",
  );
}

export async function createPresignedUpload(
  input: PresignUploadInput,
): Promise<PresignUploadResult> {
  const purpose = getStoragePurpose(input.purpose);

  if (!purpose.limits.allowedMime.some((re) => re.test(input.contentType))) {
    throw new StorageError(
      `Unsupported file type "${input.contentType}" for purpose "${purpose.id}".`,
    );
  }

  if (input.fileSize > purpose.limits.maxBytes) {
    throw new StorageError(
      `File size ${(input.fileSize / 1024 / 1024).toFixed(1)}MB exceeds the ` +
        `${(purpose.limits.maxBytes / 1024 / 1024).toFixed(1)}MB limit for "${purpose.id}".`,
    );
  }

  if (!isS3Configured()) notConfigured();

  const bucket = getOptionalEnv("S3_BUCKET")!;
  const key = purpose.key({ ...input.keyContext, fileName: input.fileName });

  const uploadUrl = await signPutObject({
    bucket,
    key,
    contentType: input.contentType,
    contentLength: input.fileSize,
    cacheControl:
      purpose.visibility === "public" ? purpose.cacheControl : undefined,
  });

  const fileUrl =
    purpose.visibility === "public" ? buildPublicUrl(bucket, key) : "";

  return { uploadUrl, fileUrl, objectKey: key };
}

export async function createPresignedDownload(input: {
  purpose: string;
  objectKey: string;
}): Promise<{ downloadUrl: string }> {
  const purpose = getStoragePurpose(input.purpose);

  if (purpose.visibility !== "private") {
    throw new StorageError(
      `Purpose "${purpose.id}" is not private; no signed download is needed.`,
    );
  }

  if (!isS3Configured()) notConfigured();

  const bucket = getOptionalEnv("S3_BUCKET")!;
  const downloadUrl = await signGetObject({
    bucket,
    key: input.objectKey,
    expiresIn: 300,
  });

  return { downloadUrl };
}

/** Delete an object. Caller is responsible for IAM/ownership checks. */
export async function deleteStorageObject(input: {
  purpose: string;
  objectKey: string;
}): Promise<void> {
  getStoragePurpose(input.purpose); // validate the purpose exists
  if (!isS3Configured()) return;
  const bucket = getOptionalEnv("S3_BUCKET")!;
  await deleteS3Object({ bucket, key: input.objectKey });
}
