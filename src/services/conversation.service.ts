import { conversationSchema } from "./contracts";
import { Platform } from "react-native";
import { apiClient } from "./api";
import {
  VoiceConversationPayload,
  VoiceConversationResponse,
} from "../types/conversation";

export const conversationService = {
  async sendVoiceConversation(
    payload: VoiceConversationPayload,
  ): Promise<VoiceConversationResponse> {
    const formData = new FormData();

    const uri = payload.audioUri;
    const filename = uri.split("/").pop()?.split("?")[0] || "recording.m4a";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : "audio/m4a";

    if (Platform.OS === "web") {
      // On web, `uri` is a blob: URL from the recorder - the browser's real
      // FormData needs an actual Blob/File object, not the React Native
      // {uri, name, type} convention below (which silently serializes to a
      // useless string on web, producing an unparseable multipart body).
      const blob = await fetch(uri).then((r) => r.blob());
      formData.append("audio", blob, filename);
    } else {
      // React Native FormData expects an object with uri, name, type
      // @ts-expect-error React Native multipart format
      formData.append("audio", { uri, name: filename, type });
    }

    formData.append("patientId", payload.patientId);
    if (payload.conversationId) {
      formData.append("conversationId", payload.conversationId);
    }

    // apiClient sets a default 'Content-Type: application/json' header on
    // every request. For a multipart body that must be overridden - the
    // browser/React Native needs to set its own Content-Type with the
    // multipart boundary, or the server can't parse the body at all
    // (surfaces as a 422 with every field "missing"). Explicitly clearing
    // it here (rather than relying on axios's FormData auto-detection)
    // guarantees this works the same way on web and native.
    const response = await apiClient.post<VoiceConversationResponse>(
      "/api/v1/conversations/voice",
      formData,
      {
        headers: { "Content-Type": undefined },
        signal: payload.signal,
        timeout: 120000,
        onUploadProgress: (event) => {
          if (event.total && event.loaded >= event.total)
            payload.onUploaded?.();
        },
      },
    );

    return conversationSchema.parse(response.data);
  },
};
