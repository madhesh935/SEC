import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  Users,
  Images,
  Music,
  Puzzle,
  LifeBuoy,
  Settings,
  Mic,
} from "lucide-react-native";
import {
  Screen,
  Copy,
  Action,
  MenuCard,
  QueryState,
  Card,
  palette,
  useColumns,
} from "../../src/components/patient/Design";
import { CompanionOrb } from "../../src/components/companion/CompanionOrb";
import {
  usePatientProfile,
  useRecommendation,
} from "../../src/hooks/usePatient";
import { ContextAction } from "../../src/components/patient/ContextAction";
import { getTimeOfDayGreeting } from "../../src/utils/formatters";
const shortcuts = [
  {
    route: "/family",
    title: "Family",
    description: "People who love you",
    Icon: Users,
    tone: "rose",
  },
  {
    route: "/memories",
    title: "Memories",
    description: "Your special moments",
    Icon: Images,
    tone: "blue",
  },
  {
    route: "/comfort",
    title: "Comfort",
    description: "Music & calming support",
    Icon: Music,
    tone: "mint",
  },
  {
    route: "/activities",
    title: "Games",
    description: "Gentle mind activities",
    Icon: Puzzle,
    tone: "lavender",
  },
] as const;
export default function Home() {
  const router = useRouter(),
    query = usePatientProfile(),
    recommendation = useRecommendation(),
    columns = useColumns();
  const [greeting, setGreeting] = useState(getTimeOfDayGreeting());
  useEffect(() => {
    const timer = setInterval(() => setGreeting(getTimeOfDayGreeting()), 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Screen>
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        <View
          style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1 }}>
            <Copy size={21} bold>
              {greeting},
            </Copy>
            <Copy size={32} bold>
              {query.data?.preferredName}
            </Copy>
            <Copy style={{ color: palette.muted }}>I’m here with you.</Copy>
            <Copy size={17} style={{ color: palette.muted }}>
              Let’s take today one step at a time.
            </Copy>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push("/settings")}
            style={{
              height: 48,
              width: 48,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "white",
              borderRadius: 24,
            }}
          >
            <Settings color={palette.ink} size={23} />
          </Pressable>
        </View>
        <View style={{ alignItems: "center" }}>
          <CompanionOrb state="idle" size={195} />
          <Action
            label="Talk to Me"
            icon={<Mic color="white" size={23} />}
            onPress={() => router.push("/companion")}
            style={{ width: "100%", maxWidth: 340 }}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {shortcuts.map(({ route, title, description, Icon, tone }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={title}
              key={route}
              onPress={() => router.push(route)}
              style={({ pressed }) => ({
                width: columns === 1 ? "100%" : "48%",
                flexGrow: 1,
                padding: 18,
                gap: 6,
                borderRadius: 23,
                backgroundColor: palette[tone],
                borderWidth: 1,
                borderColor: palette.line,
                opacity: pressed ? 0.75 : 1,
                alignItems: "center",
              })}
            >
              <Icon color={palette.teal} size={30} />
              <Copy size={20} bold>
                {title}
              </Copy>
              <Copy
                size={15}
                style={{ textAlign: "center", color: palette.muted }}
              >
                {description}
              </Copy>
            </Pressable>
          ))}
        </View>
        <MenuCard
          title="Help"
          description="Get support anytime"
          icon={<LifeBuoy color={palette.teal} />}
          onPress={() => router.push("/help")}
        />
        {recommendation.data && !recommendation.error && (
          <Card tone="peach">
            <Copy size={21} bold>
              {recommendation.data.title}
            </Copy>
            <ContextAction action={recommendation.data.action} />
          </Card>
        )}
      </QueryState>
    </Screen>
  );
}
