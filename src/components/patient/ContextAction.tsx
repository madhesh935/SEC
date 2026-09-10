import React, { useState } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { Action, Copy } from "./Design";
import { PatientAction } from "../../services/contracts";
import { familyService } from "../../services/family.service";
import { comfortService } from "../../services/comfort.service";
import { helpService } from "../../services/help.service";
import { useSessionStore } from "../../store/session.store";
import { useAudioPlayback } from "../../hooks/useAudioPlayback";
export function ContextAction({ action }: { action: PatientAction }) {
  const router = useRouter(),
    id = useSessionStore((s) => s.session?.patientId),
    audio = useAudioPlayback();
  const [error, setError] = useState(false),
    [busy, setBusy] = useState(false);
  async function run() {
    if (!id) return;
    setBusy(true);
    setError(false);
    try {
      switch (action.type) {
        case "SHOW_MEMORY":
          if (action.resourceId)
            router.push({
              pathname: "/memory/[id]",
              params: { id: action.resourceId },
            });
          break;
        case "OPEN_FAMILY":
          router.push("/family");
          break;
        case "OPEN_COMFORT":
          router.push("/comfort");
          break;
        case "PLAY_FAMILY_VOICE": {
          const member = await familyService.getFamilyMember(
            id,
            action.resourceId!,
          );
          if (!member.voiceMessageUrl) throw new Error("Unavailable");
          audio.toggleAudio(member.voiceMessageUrl);
          break;
        }
        case "PLAY_COMFORT_AUDIO": {
          const item = (await comfortService.getComfortContent(id)).find(
            (c) =>
              c.resourceId === action.resourceId || c.id === action.resourceId,
          );
          if (!item?.mediaUrl) throw new Error("Unavailable");
          audio.toggleAudio(item.mediaUrl);
          break;
        }
        case "CALL_CAREGIVER": {
          const contacts = await helpService.getHelpContacts(id);
          if (!contacts.caregiverPhone) throw new Error("Unavailable");
          await Linking.openURL("tel:" + contacts.caregiverPhone);
          break;
        }
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Action
        label={audio.currentUrl ? "Stop Audio" : action.label}
        secondary
        loading={busy}
        onPress={() => void run()}
      />
      {(error || audio.error) && (
        <Copy accessibilityRole="alert">
          This isn’t available right now. Please try again.
        </Copy>
      )}
    </>
  );
}
