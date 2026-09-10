import axios from "axios";

export interface AppError {
  message: string;
  isNetworkError: boolean;
  statusCode?: number;
}

export function sanitizePatientErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to connect right now.",
): string {
  if (axios.isAxiosError(error)) {
    if (
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.message.includes("Network Error")
    ) {
      return "Unable to connect right now. Please check your internet connection.";
    }
    const status = error.response.status;
    if (status === 401) {
      return "This device is no longer paired. Please set up the device again.";
    }
    if (status === 404) {
      return "Information is not available at the moment.";
    }
    if (status >= 500) {
      return "Our care companion service is momentarily resting. Please try again soon.";
    }
    // Check if backend returned an understandable patient-safe message
    if (
      error.response.data &&
      typeof error.response.data.message === "string"
    ) {
      const serverMsg = error.response.data.message;
      // Strip technical terms
      if (
        !serverMsg.toLowerCase().includes("database") &&
        !serverMsg.toLowerCase().includes("sql") &&
        !serverMsg.toLowerCase().includes("fastapi") &&
        !serverMsg.toLowerCase().includes("firestore") &&
        !serverMsg.toLowerCase().includes("exception") &&
        !serverMsg.toLowerCase().includes("token") &&
        !serverMsg.toLowerCase().includes("auth")
      ) {
        return serverMsg;
      }
    }
  }

  if (error instanceof Error) {
    if (
      error.message.includes("Network") ||
      error.message.includes("network")
    ) {
      return "Unable to connect right now.";
    }
  }

  return fallbackMessage;
}
