import { useState } from "react";
import { mediaService, MediaUploadResponse } from "@/services/media.service";
import { validateImageFile, validateAudioFile } from "@/utils/validation";

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    file: File,
    patientId?: string
  ): Promise<MediaUploadResponse | null> => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid image file");
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const response = await mediaService.uploadMedia(
        file,
        "photo",
        patientId,
        (percent) => setProgress(percent)
      );
      return response;
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Failed to upload image.";
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAudio = async (
    file: File,
    patientId?: string
  ): Promise<MediaUploadResponse | null> => {
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid audio file");
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const response = await mediaService.uploadMedia(
        file,
        "audio",
        patientId,
        (percent) => setProgress(percent)
      );
      return response;
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Failed to upload audio.";
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    progress,
    error,
    uploadImage,
    uploadAudio,
    clearError: () => setError(null),
  };
}
