"use client";

import { useRef, type ReactNode } from "react";
import { Loader2, UploadCloud, CheckCircle2, X } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import {
  useStorageUpload,
  type UploadResult,
} from "@/lib/storage-client";
import type { StoragePurposeId } from "@/lib/storage/purposes";

interface ImageUploadFieldProps {
  purpose: StoragePurposeId;
  /** Current public URL to preview (if any). */
  value?: string | null;
  onUploaded: (result: UploadResult) => void;
  label?: string;
  hint?: string;
  /** square = rounded box (logo/blog), circle = avatar. */
  shape?: "square" | "circle";
  previewClassName?: string;
  disabled?: boolean;
  /** Optional custom preview node rendered instead of the default <img>. */
  renderPreview?: (value: string) => ReactNode;
}

export function ImageUploadField({
  purpose,
  value,
  onUploaded,
  label = "Upload image",
  hint,
  shape = "square",
  previewClassName,
  disabled,
  renderPreview,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress, error } = useStorageUpload(purpose);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const result = await upload(file);
      onUploaded(result);
    } catch {
      // error surfaced via `error` below
    }
  };

  const radius = shape === "circle" ? "rounded-full" : "rounded-lg";

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden border border-border bg-bg-elevated text-muted-foreground",
          radius,
          previewClassName ?? "h-20 w-20",
          uploading && "opacity-70",
        )}
      >
        {value ? (
          renderPreview ? (
            renderPreview(value)
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className={cn("h-full w-full object-cover", radius)}
            />
          )
        ) : (
          <UploadCloud className="h-6 w-6" />
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="mt-1 text-[10px] font-semibold">{progress}%</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {value ? "Replace" : label}
          </Button>
          {value && (
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
          )}
        </div>
        {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
        {error && (
          <p className="text-[10px] text-destructive">{error.message}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

interface ImageRemoveButtonProps {
  onRemove: () => void;
  disabled?: boolean;
  label?: string;
}

export function ImageRemoveButton({
  onRemove,
  disabled,
  label = "Remove",
}: ImageRemoveButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={onRemove}
      className="text-destructive"
    >
      <X className="mr-1.5 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
