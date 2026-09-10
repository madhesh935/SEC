import React from "react";
import { useRouter } from "expo-router";
import {
  Users,
  Lightbulb,
  ListOrdered,
  Images,
  Music,
} from "lucide-react-native";
import {
  Screen,
  MenuCard,
  QueryState,
  Reassurance,
  palette,
} from "../../src/components/patient/Design";
import { useRecommendedActivities } from "../../src/hooks/usePatient";
const icons = {
  family_recognition: Users,
  life_memory_recall: Lightbulb,
  daily_routine_sequencing: ListOrdered,
  photo_recognition: Images,
  music_memory: Music,
};
export default function Activities() {
  const query = useRecommendedActivities(),
    router = useRouter();
  return (
    <Screen
      title="Mind & Memory"
      subtitle="Gentle activities for focus, memory and connection."
    >
      <QueryState
        loading={query.isPending}
        error={query.error}
        empty={!query.data?.length}
        message="No activities are available right now."
        retry={() => void query.refetch()}
      >
        {query.data?.map((item) => {
          const Icon = icons[item.type];
          return (
            <MenuCard
              key={item.id}
              title={item.title}
              description={item.description}
              tone={
                item.type === "family_recognition"
                  ? "lavender"
                  : item.type === "music_memory"
                    ? "rose"
                    : "mint"
              }
              icon={<Icon color={palette.teal} size={28} />}
              onPress={() =>
                router.push({
                  pathname: "/activity/[id]",
                  params: { id: item.id },
                })
              }
            />
          );
        })}
      </QueryState>
      <Reassurance />
    </Screen>
  );
}
