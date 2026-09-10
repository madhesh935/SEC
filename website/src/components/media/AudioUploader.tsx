"use client";

import * as React from "react";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Mic, X, Volume2, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export interface AudioUploaderProps {
  onSuccess?: (url: string) => void;
  patientId?: string;
  className?: string;
}

export function AudioUploader({
  onSuccess,
  patientId,
  className,
}: AudioUploaderProps) {
  const { uploadAudio, isUploading, progress, error, clearError } = useMediaUpload();
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const result = await uploadAudio(file, patientId);
    if (result && onSuccess) {
      onSuccess(result.url);
    }
  };

  const handleClear = () => {
    setFileName(null);
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
        accept="audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/webm"
        onChange={handleFileChange}
        className="hidden"
        id="audio-uploader-input"
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {fileName ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-4 w-4 text-teal-700" />
            <span className="text-xs font-semibold text-slate-800 truncate max-w-xs">
              {fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="audio-uploader-input"
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/20 transition-all"
        >
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Mic className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-slate-800">
            Upload voice note or calming audio
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            MP3, WAV, M4A, WebM up to 15MB
          </span>
        </label>
      )}

      {isUploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Uploading audio clip...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
