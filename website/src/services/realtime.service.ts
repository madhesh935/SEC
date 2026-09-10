import { LiveCompanionStatus, Alert } from "@/types";

export type RealtimeCallback<T> = (data: T) => void;
export type UnsubscribeFn = () => void;

/**
 * Realtime Service abstraction backed by native WebSocket endpoints on the
 * GeriCare backend (see app/api/v1/realtime.py). Browsers can't attach a
 * custom Authorization header to a WebSocket handshake, so the Firebase ID
 * token travels as a `token` query parameter instead - the backend verifies
 * it the same way as any other request before accepting the connection.
 * In development without NEXT_PUBLIC_WS_BASE_URL or a stored token, it
 * registers listeners safely and cleans up without generating fake
 * synthetic events.
 */
export const realtimeService = {
  /**
   * Subscribe to live companion events for a specific patient.
   */
  subscribeToLiveStatus(
    patientId: string,
    callback: RealtimeCallback<LiveCompanionStatus>
  ): UnsubscribeFn {
    const wsUrl = process.env.NEXT_PUBLIC_WS_BASE_URL;
    const token = typeof window !== "undefined" ? localStorage.getItem("gericare_token") : null;
    if (!wsUrl || !token || typeof window === "undefined") {
      // In offline/passive mode, return noop unsubscription
      return () => {};
    }

    try {
      const socket = new WebSocket(
        `${wsUrl}/api/v1/patients/${patientId}/live-ws?token=${encodeURIComponent(token)}`
      );

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          callback(payload);
        } catch {
          // Ignore malformed payloads
        }
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch {
      return () => {};
    }
  },

  /**
   * Subscribe to incoming urgent/high alerts.
   */
  subscribeToAlerts(callback: RealtimeCallback<Alert>): UnsubscribeFn {
    const wsUrl = process.env.NEXT_PUBLIC_WS_BASE_URL;
    const token = typeof window !== "undefined" ? localStorage.getItem("gericare_token") : null;
    if (!wsUrl || !token || typeof window === "undefined") {
      return () => {};
    }

    try {
      const socket = new WebSocket(`${wsUrl}/api/v1/alerts-ws?token=${encodeURIComponent(token)}`);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          callback(payload);
        } catch {
          // Ignore malformed payloads
        }
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch {
      return () => {};
    }
  },
};
