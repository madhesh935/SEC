import React from "react";
import { useRouter } from "expo-router";
import { Music, Puzzle, LifeBuoy, Settings } from "lucide-react-native";
import {
  Screen,
  MenuCard,
  Reassurance,
  palette,
} from "../../src/components/patient/Design";
export default function More() {
  const router = useRouter();
  return (
    <Screen
      title="More"
      subtitle="A little support, whenever you need it"
      back={false}
    >
      <MenuCard
        title="Comfort"
        description="Familiar music, voices and photos"
        icon={<Music color={palette.teal} />}
        onPress={() => router.push("/comfort")}
      />
      <MenuCard
        title="Joyful Games"
        description="Playful & calming mind fun"
        tone="lavender"
        icon={<Puzzle color="#7350A3" />}
        onPress={() => router.push("/activities")}
      />
      <MenuCard
        title="Help & Support"
        description="Get support anytime"
        tone="peach"
        icon={<LifeBuoy color={palette.teal} />}
        onPress={() => router.push("/help")}
      />
      <MenuCard
        title="Settings"
        description="Make yourself comfortable"
        tone="blue"
        icon={<Settings color={palette.ink} />}
        onPress={() => router.push("/settings")}
      />
      <Reassurance>You’re not alone. Help is always available.</Reassurance>
    </Screen>
  );
}
