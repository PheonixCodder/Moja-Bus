import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getOptionalEnv } from "@moja/config";

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_client) return _client;

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

  _client = new S3Client(config);
  return _client;
}

export function isS3Configured(): boolean {
  return Boolean(
    getOptionalEnv("S3_BUCKET") &&
      getOptionalEnv("S3_REGION") &&
      getOptionalEnv("S3_ACCESS_KEY_ID") &&
      getOptionalEnv("S3_SECRET_ACCESS_KEY"),
  );
}

export async function signPutObject(params: {
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  cacheControl?: string | undefined;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
    ...(params.cacheControl ? { CacheControl: params.cacheControl } : {}),
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: 900 });
}

export async function signGetObject(params: {
  bucket: string;
  key: string;
  expiresIn?: number;
}): Promise<string> {
  const command = new GetObjectCommand({ Bucket: params.bucket, Key: params.key });
  return getSignedUrl(getS3Client(), command, {
    expiresIn: params.expiresIn ?? 300,
  });
}

export async function deleteS3Object(params: {
  bucket: string;
  key: string;
}): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({ Bucket: params.bucket, Key: params.key }),
  );
}

export function buildPublicUrl(bucket: string, key: string): string {
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
