import React from "react";
import { View, Pressable } from "react-native";
import { Mic, Square, Volume2 } from "lucide-react-native";
import {
  Screen,
  Copy,
  Card,
  Action,
  palette,
} from "../../src/components/patient/Design";
import { CompanionOrb } from "../../src/components/companion/CompanionOrb";
import { ContextAction } from "../../src/components/patient/ContextAction";
import { useCompanionVoice } from "../../src/hooks/useCompanionVoice";
import { useNetwork } from "../../src/hooks/useNetwork";
import { PatientAction } from "../../src/services/contracts";
export default function Companion() {
  const voice = useCompanionVoice(),
    { isOffline } = useNetwork(),
    comfort = voice.uiMode === "comfort";
  const prompt = isOffline
    ? "We can’t connect right now"
    : voice.isRecording
      ? "I’m listening"
      : voice.isProcessing
        ? "Just a moment"
        : voice.isSpeaking
          ? "I’m here with you"
          : comfort
            ? "You’re not alone."
            : "Tap when you’re ready";
  return (
    <Screen
      title="Companion"
      subtitle="Your personal voice companion"
      warm={comfort}
    >
      <View style={{ alignItems: "center", gap: 18, paddingTop: 12 }}>
        <Copy
          size={comfort ? 28 : 25}
          bold
          accessibilityLiveRegion="polite"
          style={{ textAlign: "center" }}
        >
          {prompt}
        </Copy>
        <CompanionOrb
          state={isOffline ? "offline" : voice.state}
          uiMode={voice.uiMode}
          size={225}
        />
        {comfort && (
          <Copy size={24} style={{ textAlign: "center" }}>
            I’m here with you.
          </Copy>
        )}
      </View>
      {voice.response?.responseText && (
        <Card tone={comfort ? "peach" : "blue"}>
          <Copy size={comfort ? 26 : 23}>{voice.response.responseText}</Copy>
        </Card>
      )}
      {!!voice.errorMessage && (
        <Copy accessibilityRole="alert" style={{ color: palette.red }}>
          {voice.errorMessage}
        </Copy>
      )}
      <View style={{ alignItems: "center", gap: 12 }}>
        <Pressable
          disabled={isOffline || voice.isProcessing || voice.isSpeaking}
          accessibilityRole="button"
          accessibilityLabel={
            voice.isRecording ? "Finish speaking" : "Tap to talk"
          }
          accessibilityState={{
            disabled: isOffline || voice.isProcessing || voice.isSpeaking,
          }}
          onPress={voice.toggleVoice}
          style={({ pressed }) => ({
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: palette.teal,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 8,
            borderColor: "#CCF3EB",
            opacity: pressed ? 0.8 : isOffline || voice.isProcessing ? 0.5 : 1,
          })}
        >
          {voice.isRecording ? (
            <Square color="white" size={35} />
          ) : (
            <Mic color="white" size={42} />
          )}
        </Pressable>
        <Copy size={20} bold>
          {voice.isRecording ? "Tap to finish" : "Tap to Talk"}
        </Copy>
      </View>
      {(voice.isRecording || voice.isProcessing || voice.isSpeaking) && (
        <Action
          label={voice.isSpeaking ? "Stop Speaking" : "Cancel"}
          secondary
          onPress={voice.cancel}
        />
      )}
      {voice.response?.responseText && (
        <Action
          label="Replay Response"
          disabled={isOffline || voice.isRecording || voice.isProcessing}
          secondary
          icon={<Volume2 color={palette.teal} size={22} />}
          onPress={voice.replay}
        />
      )}
      {voice.response?.actions.map((action: PatientAction, index: number) => (
        <ContextAction key={action.type + index} action={action} />
      ))}
      {!comfort && !!voice.response?.transcript && (
        <Copy size={16} style={{ color: palette.muted }}>
          You said: {voice.response.transcript}
        </Copy>
      )}
    </Screen>
  );
}
