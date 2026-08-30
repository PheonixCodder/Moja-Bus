/** Driver compliance-document storage purposes (server registry: lib/storage/purposes.ts). */
export type DriverDocPurpose =
	| "driver-license-front"
	| "driver-license-back"
	| "driver-selfie"
	| "driver-medical-doc";

/**
 * React Native's `fetch` of a `file://` URI returns a Blob whose `.type` is
 * always an empty string, regardless of the actual file format. The server's
 * allowedMime check will reject `application/octet-stream` with a 412.
 * Derive the MIME from the file extension so the presign call succeeds.
 */
function inferMimeFromFileName(fileName: string, fallback: string): string {
	const ext = fileName.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "png":
			return "image/png";
		case "webp":
			return "image/webp";
		case "heic":
			return "image/heic";
		case "heif":
			return "image/heif";
		case "pdf":
			return "application/pdf";
		default:
			// Expo camera always produces JPEG; prefer that over octet-stream
			return fallback && fallback !== "application/octet-stream"
				? fallback
				: "image/jpeg";
	}
}

/**
 * Phase 15 (F-DV-05) — upload a camera-captured compliance document:
 * presign (server-issued, user-scoped key) → PUT the local file → return the
 * stored object key that goes into the registration payload. Returns null on
 * any failure so callers can surface an honest retry prompt instead of
 * persisting a device-local `file://` URI as a document URL.
 */
export async function uploadCapturedDocument(args: {
	presign: (input: {
		purpose: DriverDocPurpose;
		fileName: string;
		contentType: string;
		fileSize: number;
	}) => Promise<{ uploadUrl: string; objectKey: string }>;
	localUri: string;
	fileName: string;
	purpose: DriverDocPurpose;
}): Promise<string | null> {
	try {
		// Fetch the blob first so we can pass the real content-type and size
		// to the presign endpoint — the server's `presignUploadInput` schema
		// requires both fields (Phase 35 hardening). This also lets the server
		// validate MIME/size before we commit to the PUT.
		const fileResponse = await fetch(args.localUri);
		const blob = await fileResponse.blob();
		// React Native Blob.type is always "" for local file:// URIs — derive
		// the MIME from the file name extension instead.
		const contentType = inferMimeFromFileName(args.fileName, blob.type);

		const { uploadUrl, objectKey } = await args.presign({
			purpose: args.purpose,
			fileName: args.fileName,
			contentType,
			fileSize: blob.size,
		});

		const put = await fetch(uploadUrl, {
			method: "PUT",
			body: blob,
			headers: { "Content-Type": contentType },
		});
		if (!put.ok) {
			throw new Error(`Storage rejected the upload (${put.status})`);
		}
		return objectKey;
	} catch (err) {
		console.warn("[DocUpload] failed:", err);
		return null;
	}
}
