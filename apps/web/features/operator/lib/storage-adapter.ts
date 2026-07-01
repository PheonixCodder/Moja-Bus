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
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (onProgress) {
          onProgress(progress);
        }
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

export const storageAdapter: StorageAdapter = new FakeUploadAdapter();
