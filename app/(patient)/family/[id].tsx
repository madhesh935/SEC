import React, { useState } from "react";
import { Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Screen,
  Copy,
  Action,
  PatientImage,
  QueryState,
  MenuCard,
  palette,
} from "../../../src/components/patient/Design";
import { Images } from "lucide-react-native";
import { useFamilyMember, useMemories } from "../../../src/hooks/usePatient";
import { useAudioPlayback } from "../../../src/hooks/useAudioPlayback";
export default function FamilyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    query = useFamilyMember(id),
    memories = useMemories(),
    router = useRouter(),
    audio = useAudioPlayback();
  const [callError, setCallError] = useState(false),
    member = query.data;
  const shared = memories.data?.filter((memory) =>
    memory.people.some((person) => person.id === id),
  );
  return (
    <Screen title="Family" subtitle="Someone familiar">
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {member && (
          <>
            <PatientImage
              url={member.photoUrl}
              label={member.name}
              height={280}
            />
            <Copy size={30} bold style={{ textAlign: "center" }}>
              {member.name}
            </Copy>
            {member.relationship && (
              <Copy
                size={22}
                style={{ textAlign: "center", color: palette.teal }}
              >
                {member.relationship}
              </Copy>
            )}
            {member.description && <Copy>{member.description}</Copy>}
            {member.voiceMessageUrl && (
              <Action
                label={
                  audio.currentUrl ? "Stop Voice Message" : "Hear Their Voice"
                }
                onPress={() => audio.toggleAudio(member.voiceMessageUrl!)}
              />
            )}
            {member.phoneNumber && (
              <Action
                label="Call"
                secondary
                onPress={() => {
                  void Linking.openURL("tel:" + member.phoneNumber).catch(() =>
                    setCallError(true),
                  );
                }}
              />
            )}
            {!!shared?.length && (
              <Copy size={22} bold>
                Shared Memories
              </Copy>
            )}
            {shared?.map((memory) => (
              <MenuCard
                key={memory.id}
                title={memory.title}
                icon={<Images color={palette.teal} />}
                onPress={() =>
                  router.push({
                    pathname: "/memory/[id]",
                    params: { id: memory.id },
                  })
                }
              />
            ))}
            {memories.error && (
              <>
                <Copy>We couldn’t check shared memories right now.</Copy>
                <Action
                  label="Try Again"
                  secondary
                  onPress={() => void memories.refetch()}
                />
              </>
            )}
            {(audio.error || callError) && (
              <Copy accessibilityRole="alert">
                {audio.error || "We couldn’t open the phone right now."}
              </Copy>
            )}
          </>
        )}
      </QueryState>
    </Screen>
  );
}
