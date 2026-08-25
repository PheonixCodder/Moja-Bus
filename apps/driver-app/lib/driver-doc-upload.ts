/** Driver compliance-document storage purposes (server registry: lib/storage/purposes.ts). */
export type DriverDocPurpose =
	| "driver-license-front"
	| "driver-license-back"
	| "driver-selfie"
	| "driver-medical-doc";

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
	}) => Promise<{ uploadUrl: string; objectKey: string }>;
	localUri: string;
	fileName: string;
	purpose: DriverDocPurpose;
}): Promise<string | null> {
	try {
		const { uploadUrl, objectKey } = await args.presign({
			purpose: args.purpose,
			fileName: args.fileName,
		});
		const fileResponse = await fetch(args.localUri);
		const blob = await fileResponse.blob();
		const put = await fetch(uploadUrl, {
			method: "PUT",
			body: blob,
			headers: { "Content-Type": blob.type || "application/octet-stream" },
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
