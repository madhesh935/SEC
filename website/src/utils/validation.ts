export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_MEDIA_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
  "audio/mp4",
  "audio/webm",
];

export function validateImageFile(file: File): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed formats: JPEG, PNG, WebP, AVIF.`,
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 5MB limit. Please upload a smaller image.`,
    };
  }
  return { valid: true };
}

export function validateAudioFile(file: File): FileValidationResult {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid audio format. Allowed formats: MP3, WAV, OGG, M4A, WebM.`,
    };
  }
  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Audio file size exceeds the 15MB limit.`,
    };
  }
  return { valid: true };
}
