import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Music, Volume2, Leaf, Images, Heart } from "lucide-react-native";
import {
  Screen,
  Copy,
  MenuCard,
  Action,
  QueryState,
  Reassurance,
  palette,
} from "../../src/components/patient/Design";
import { useComfortContent } from "../../src/hooks/usePatient";
import { useAudioPlayback } from "../../src/hooks/useAudioPlayback";
const categories = [
  {
    type: "music",
    title: "Favourite Music",
    description: "Songs you love",
    Icon: Music,
    tone: "peach",
  },
  {
    type: "voice",
    title: "Family Voices",
    description: "Special messages for you",
    Icon: Volume2,
    tone: "blue",
  },
  {
    type: "audio",
    title: "Relaxing Sounds",
    description: "Nature, rain and calm",
    Icon: Leaf,
    tone: "mint",
  },
  {
    type: "memory",
    title: "Comfort Memories",
    description: "Familiar moments",
    Icon: Heart,
    tone: "lavender",
  },
  {
    type: "photo",
    title: "Familiar Photos",
    description: "Pictures to enjoy",
    Icon: Images,
    tone: "rose",
  },
] as const;
export default function Comfort() {
  const query = useComfortContent(),
    audio = useAudioPlayback(),
    router = useRouter(),
    [category, setCategory] = useState<string | null>(null);
  return (
    <Screen
      title="Comfort"
      subtitle="Familiar things that help you feel at ease."
    >
      <QueryState
        loading={query.isPending}
        error={query.error}
        empty={!query.data?.length}
        message="Your caregiver can add familiar music, voices and memories for you."
        retry={() => void query.refetch()}
      >
        {categories
          .filter((c) => query.data?.some((item) => item.type === c.type))
          .map(({ type, title, description, Icon, tone }) => (
            <View key={type} style={{ gap: 12 }}>
              <MenuCard
                title={title}
                description={description}
                tone={tone}
                icon={<Icon color={palette.teal} size={27} />}
                onPress={() => setCategory(category === type ? null : type)}
              />
              {category === type &&
                query.data
                  ?.filter((item) => item.type === type)
                  .map((item) => (
                    <View
                      key={item.id}
                      style={{
                        padding: 14,
                        borderRadius: 20,
                        backgroundColor: palette[tone],
                        gap: 10,
                      }}
                    >
                      <Copy bold>{item.title}</Copy>
                      {item.description && (
                        <Copy size={17}>{item.description}</Copy>
                      )}
                      {item.mediaUrl && (
                        <Action
                          label={
                            audio.currentUrl === item.mediaUrl
                              ? "Stop Audio"
                              : "Play"
                          }
                          onPress={() => audio.toggleAudio(item.mediaUrl!)}
                        />
                      )}
                      {item.imageUrl && (
                        <Action
                          label="View Photo"
                          secondary
                          onPress={() =>
                            router.push({
                              pathname:
                                item.type === "voice"
                                  ? "/family/[id]"
                                  : "/memory/[id]",
                              params: { id: item.resourceId },
                            })
                          }
                        />
                      )}
                    </View>
                  ))}
            </View>
          ))}
        {audio.error && <Copy accessibilityRole="alert">{audio.error}</Copy>}
      </QueryState>
      <Reassurance>A calm mind brings brighter days.</Reassurance>
    </Screen>
  );
}
