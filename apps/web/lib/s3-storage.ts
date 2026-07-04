import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getOptionalEnv } from "@moja/config";
import crypto from "node:crypto";

export interface PresignedUploadInput {
  fileName: string;
  contentType: string;
  fileSize: number;
  companyId: string;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

function isS3Configured(): boolean {
  return Boolean(
    getOptionalEnv("S3_BUCKET") &&
      getOptionalEnv("S3_REGION") &&
      getOptionalEnv("S3_ACCESS_KEY_ID") &&
      getOptionalEnv("S3_SECRET_ACCESS_KEY"),
  );
}

function getS3Client(): S3Client {
  const endpoint = getOptionalEnv("S3_ENDPOINT");

  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: getOptionalEnv("S3_REGION")!,
    credentials: {
      accessKeyId: getOptionalEnv("S3_ACCESS_KEY_ID")!,
      secretAccessKey: getOptionalEnv("S3_SECRET_ACCESS_KEY")!,
    },
  };

  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle = true;
  }

  return new S3Client(config);
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildObjectKey(companyId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `uploads/${companyId}/${crypto.randomUUID()}-${safeName}`;
}

function buildPublicUrl(bucket: string, key: string): string {
  const customBase = getOptionalEnv("S3_PUBLIC_URL_BASE");
  if (customBase) {
    return `${customBase.replace(/\/$/, "")}/${key}`;
  }

  const region = getOptionalEnv("S3_REGION");
  const endpoint = getOptionalEnv("S3_ENDPOINT");

  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
  }

  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function createPresignedUpload(
  input: PresignedUploadInput,
): Promise<PresignedUploadResult> {
  if (!isS3Configured()) {
    throw new Error(
      "File storage is not configured. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.",
    );
  }

  const bucket = getOptionalEnv("S3_BUCKET")!;
  const key = buildObjectKey(input.companyId, input.fileName);
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType || "application/octet-stream",
    ContentLength: input.fileSize,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

  return {
    uploadUrl,
    fileUrl: buildPublicUrl(bucket, key),
    key,
  };
}

export function isStorageConfigured(): boolean {
  return isS3Configured();
}
