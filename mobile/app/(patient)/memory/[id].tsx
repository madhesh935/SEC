import React, { useState } from "react";
import { Modal, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Screen,
  Copy,
  Action,
  PatientImage,
  QueryState,
  MenuCard,
  Reassurance,
  palette,
} from "../../../src/components/patient/Design";
import { Heart } from "lucide-react-native";
import { useMemory } from "../../../src/hooks/usePatient";
import { useAudioPlayback } from "../../../src/hooks/useAudioPlayback";
export default function MemoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    query = useMemory(id),
    router = useRouter(),
    audio = useAudioPlayback();
  const [photos, setPhotos] = useState(false),
    memory = query.data;
  const images = [
    ...new Set(
      [memory?.imageUrl, ...(memory?.photoUrls || [])].filter(
        (u): u is string => !!u,
      ),
    ),
  ];
  return (
    <Screen title="Memories" subtitle="A special moment to cherish">
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {memory && (
          <>
            <PatientImage
              url={memory.imageUrl}
              label={memory.title}
              height={250}
            />
            <Copy size={28} bold>
              {memory.title}
            </Copy>
            {memory.displayDate && (
              <Copy size={17} style={{ color: palette.muted }}>
                {memory.displayDate}
              </Copy>
            )}
            {memory.description && <Copy size={21}>{memory.description}</Copy>}
            {!!memory.people.length && (
              <Copy size={21} bold>
                People in this Memory
              </Copy>
            )}
            {memory.people.map((person) => (
              <MenuCard
                key={person.id}
                title={person.name}
                description={person.relationship || undefined}
                icon={<Heart color={palette.teal} />}
                onPress={() =>
                  router.push({
                    pathname: "/family/[id]",
                    params: { id: person.id },
                  })
                }
              />
            ))}
            {memory.audioUrl && (
              <Action
                label={
                  audio.currentUrl === memory.audioUrl
                    ? "Stop Story"
                    : "Play Story"
                }
                onPress={() => audio.toggleAudio(memory.audioUrl!)}
              />
            )}
            {memory.people
              .filter((p) => p.voiceMessageUrl)
              .map((person) => (
                <Action
                  key={person.id}
                  label={
                    audio.currentUrl === person.voiceMessageUrl
                      ? "Stop Voice Message"
                      : "Hear " + person.name + "’s Voice"
                  }
                  secondary
                  onPress={() => audio.toggleAudio(person.voiceMessageUrl!)}
                />
              ))}
            {!!images.length && (
              <Action
                label="View Photos"
                secondary
                onPress={() => setPhotos(true)}
              />
            )}
            {audio.error && (
              <Copy accessibilityRole="alert">{audio.error}</Copy>
            )}
            <Reassurance>A special memory to cherish.</Reassurance>
          </>
        )}
      </QueryState>
      <Modal
        visible={photos}
        onRequestClose={() => setPhotos(false)}
        animationType="none"
      >
        <View
          style={{ flex: 1, paddingTop: 40, backgroundColor: palette.ivory }}
        >
          <Screen title={memory?.title} onBack={() => setPhotos(false)}>
            {images.map((url) => (
              <PatientImage
                key={url}
                url={url}
                label={memory?.title || "Memory photo"}
                height={330}
              />
            ))}
            <Action label="Close Photos" onPress={() => setPhotos(false)} />
          </Screen>
        </View>
      </Modal>
    </Screen>
  );
}
