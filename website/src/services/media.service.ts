import apiClient from "./api";

export interface MediaUploadResponse {
  url: string;
  mediaType: "image" | "audio" | "video";
  fileName: string;
  sizeBytes: number;
}

export const mediaService = {
  /**
   * Upload media file (photo or audio recording) to backend or storage provider.
   */
  async uploadMedia(
    file: File,
    type: "photo" | "audio" | "memory",
    patientId?: string,
    onProgress?: (progressPercent: number) => void
  ): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (patientId) formData.append("patientId", patientId);

    const response = await apiClient.post<MediaUploadResponse>(
      "/api/v1/media/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percent);
          }
        },
      }
    );

    return response.data;
  },
};
