import React from "react";
import { View, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Home, Mic, Heart, Images, MoreHorizontal } from "lucide-react-native";
import { Copy, palette } from "../patient/Design";
const items = [
  { route: "/home", label: "Home", Icon: Home },
  { route: "/companion", label: "Companion", Icon: Mic },
  { route: "/family", label: "Family", Icon: Heart },
  { route: "/memories", label: "Memories", Icon: Images },
  { route: "/more", label: "More", Icon: MoreHorizontal },
];
export function BottomNav() {
  const router = useRouter(),
    path = usePathname();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        backgroundColor: palette.white,
        borderTopWidth: 1,
        borderColor: palette.line,
        paddingVertical: 8,
        paddingHorizontal: 4,
      }}
    >
      {items.map(({ route, label, Icon }) => {
        const selected =
          path === route ||
          (route === "/family" && path.startsWith("/family/")) ||
          (route === "/memories" && path.startsWith("/memory/")) ||
          (route === "/more" &&
            [
              "/comfort",
              "/activities",
              "/activity/",
              "/help",
              "/settings",
            ].some((p) => path.startsWith(p)));
        return (
          <Pressable
            key={route}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => router.replace(route as never)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 60,
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              borderRadius: 16,
              backgroundColor: selected
                ? palette.mint
                : pressed
                  ? palette.blue
                  : "transparent",
            })}
          >
            <Icon size={23} color={selected ? palette.teal : palette.muted} />
            <Copy
              size={12}
              bold
              style={{
                color: selected ? palette.teal : palette.muted,
                textAlign: "center",
              }}
            >
              {label}
            </Copy>
          </Pressable>
        );
      })}
    </View>
  );
}
