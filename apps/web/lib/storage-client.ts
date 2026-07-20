"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  getStoragePurpose,
  type StorageKeyContext,
  type StoragePurposeId,
} from "@/lib/storage/purposes";

export interface UploadResult {
  fileUrl: string;
  objectKey: string;
}

/**
 * Browser-side resize + WebP re-encode. Used for image purposes so we never
 * upload a raw multi-MP phone photo for a tiny avatar/logo. Falls back to the
 * original file if the browser can't decode it.
 */
export async function resizeImageToWebp(
  file: File,
  maxDim: number,
  quality: number,
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", quality),
    );
    if (!blob) return file;

    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

function putWithProgress(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

/**
 * Unified client upload hook. Always talks to `storage.presignUpload`; the
 * server resolves IAM + object key from the session. For image purposes the
 * file is resized/re-encoded to WebP before the presigned PUT.
 */
export function useStorageUpload(
  purposeId: StoragePurposeId,
  defaultKeyContext?: StorageKeyContext,
) {
  const trpc = useTRPC();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const presignMutation = useMutation(
    trpc.storage.presignUpload.mutationOptions(),
  );

  const upload = useCallback(
    async (
      file: File,
      keyContext?: StorageKeyContext,
    ): Promise<UploadResult> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        const purpose = getStoragePurpose(purposeId);

        let toUpload: File = file;
        let contentType = file.type || "application/octet-stream";

        if (purpose.image && file.type.startsWith("image/")) {
          toUpload = await resizeImageToWebp(
            file,
            purpose.image.maxDim,
            purpose.image.quality,
          );
          contentType = "image/webp";
        }

        if (toUpload.size > purpose.limits.maxBytes) {
          throw new Error(
            `File is too large (max ${(purpose.limits.maxBytes / 1024 / 1024).toFixed(0)}MB).`,
          );
        }

        const res = await presignMutation.mutateAsync({
          purpose: purposeId,
          fileName: file.name,
          contentType,
          fileSize: toUpload.size,
          keyContext: { ...defaultKeyContext, ...keyContext },
        });

        await putWithProgress(res.uploadUrl, toUpload, contentType, setProgress);

        return { fileUrl: res.fileUrl, objectKey: res.objectKey };
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Upload failed");
        setError(err);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [purposeId, presignMutation, defaultKeyContext],
  );

  return { upload, uploading, progress, error };
}
