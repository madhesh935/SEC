import React, { useState } from "react";
import { View, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Phone, Volume2 } from "lucide-react-native";
import {
  Screen,
  Copy,
  Card,
  Action,
  PatientImage,
  QueryState,
  Reassurance,
  palette,
} from "../../src/components/patient/Design";
import { useFamilyMembers } from "../../src/hooks/usePatient";
import { useAudioPlayback } from "../../src/hooks/useAudioPlayback";
export default function Family() {
  const query = useFamilyMembers(),
    router = useRouter(),
    audio = useAudioPlayback(),
    [callError, setCallError] = useState(false);
  return (
    <Screen title="Family" subtitle="People who love you">
      <QueryState
        loading={query.isPending}
        error={query.error}
        empty={!query.data?.length}
        message="Your family connections will appear here once they are added."
        retry={() => void query.refetch()}
      >
        {query.data?.map((member) => (
          <Card key={member.id}>
            <View
              style={{ flexDirection: "row", gap: 14, alignItems: "center" }}
            >
              <PatientImage
                url={member.photoUrl}
                label={member.name}
                category="family"
                height={84}
                style={{ width: 76 }}
              />
              <View style={{ flex: 1 }}>
                <Copy size={23} bold>
                  {member.name}
                </Copy>
                {member.relationship && (
                  <Copy size={18} style={{ color: palette.teal }}>
                    {member.relationship}
                  </Copy>
                )}
                {member.description && (
                  <Copy size={16}>{member.description}</Copy>
                )}
              </View>
            </View>
            <View style={{ gap: 10 }}>
              {member.phoneNumber && (
                <Action
                  label="Call"
                  icon={<Phone color="white" size={20} />}
                  onPress={() => {
                    void Linking.openURL("tel:" + member.phoneNumber).catch(
                      () => setCallError(true),
                    );
                  }}
                />
              )}
              {member.voiceMessageUrl && (
                <Action
                  label={
                    audio.currentUrl === member.voiceMessageUrl
                      ? "Stop Voice Message"
                      : "Voice Message"
                  }
                  secondary
                  icon={<Volume2 color={palette.teal} size={20} />}
                  onPress={() => audio.toggleAudio(member.voiceMessageUrl!)}
                />
              )}
              <Action
                label={"About " + member.name}
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/family/[id]",
                    params: { id: member.id },
                  })
                }
              />
            </View>
          </Card>
        ))}
      </QueryState>
      {(audio.error || callError) && (
        <Copy accessibilityRole="alert">
          {audio.error ||
            "We couldn’t open the phone. Please ask someone nearby for help."}
        </Copy>
      )}
      <Reassurance>
        Family keeps your heart close, wherever they are.
      </Reassurance>
    </Screen>
  );
}
