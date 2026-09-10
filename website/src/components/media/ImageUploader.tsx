"use client";

import * as React from "react";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export interface ImageUploaderProps {
  onSuccess?: (url: string) => void;
  patientId?: string;
  className?: string;
  initialPreviewUrl?: string;
}

export function ImageUploader({
  onSuccess,
  patientId,
  className,
  initialPreviewUrl,
}: ImageUploaderProps) {
  const { uploadImage, isUploading, progress, error, clearError } = useMediaUpload();
  const [preview, setPreview] = React.useState<string | null>(initialPreviewUrl || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const result = await uploadImage(file, patientId);
    if (result && onSuccess) {
      onSuccess(result.url);
    }
  };

  const handleClear = () => {
    setPreview(null);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileChange}
        className="hidden"
        id="image-uploader-input"
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <img
            src={preview}
            alt="Upload preview"
            className="h-48 w-full object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 rounded-full bg-slate-900/70 p-1.5 text-white hover:bg-slate-900 transition-colors"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-xs text-white p-4">
              <span className="text-xs font-semibold mb-2">Uploading image...</span>
              <div className="h-2 w-48 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] mt-1">{progress}%</span>
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor="image-uploader-input"
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/20 transition-all"
        >
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ImageIcon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-slate-800">
            Click to upload photograph
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            JPEG, PNG, WebP up to 5MB
          </span>
        </label>
      )}
    </div>
  );
}
