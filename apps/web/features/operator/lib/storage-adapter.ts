export interface StorageAdapter {
  uploadFile(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<string>;
}

export class FakeUploadAdapter implements StorageAdapter {
  async uploadFile(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    const fileId = crypto.randomUUID();
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        onProgress?.(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve(
            `https://moja-ride-bucket.s3.amazonaws.com/uploads/${fileId}-${file.name}`,
          );
        }
      }, 150);
    });
  }
}

export interface PresignedUploadRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
}

export class S3UploadAdapter implements StorageAdapter {
  constructor(
    private requestPresignedUpload: (
      input: PresignedUploadRequest,
    ) => Promise<PresignedUploadResponse>,
  ) {}

  async uploadFile(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    const { uploadUrl, fileUrl } = await this.requestPresignedUpload({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
    });

    await uploadWithProgress(uploadUrl, file, onProgress);
    return fileUrl;
  }
}

function uploadWithProgress(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export function createStorageAdapter(
  requestPresignedUpload?: (
    input: PresignedUploadRequest,
  ) => Promise<PresignedUploadResponse>,
): StorageAdapter {
  if (requestPresignedUpload) {
    return new S3UploadAdapter(requestPresignedUpload);
  }

  return new FakeUploadAdapter();
}

/** @deprecated Use createStorageAdapter with a presigned upload callback in client components. */
export const storageAdapter: StorageAdapter = new FakeUploadAdapter();
