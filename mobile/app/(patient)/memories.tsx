import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  Screen,
  Copy,
  PatientImage,
  QueryState,
  palette,
  useColumns,
  styles,
} from "../../src/components/patient/Design";
import { useMemories } from "../../src/hooks/usePatient";
export default function Memories() {
  const query = useMemories(),
    router = useRouter(),
    columns = useColumns(),
    [category, setCategory] = useState("All");
  const categories = [
    "All",
    ...new Set(query.data?.map((m) => m.category) || []),
  ];
  const selected = categories.includes(category) ? category : "All";
  const rows = query.data?.filter(
    (m) => selected === "All" || m.category === selected,
  );
  return (
    <Screen title="Memories" subtitle="Stories, places and cherished moments">
      <QueryState
        loading={query.isPending}
        error={query.error}
        empty={!query.data?.length}
        message="Your memories will appear here once they are added by your family or caregiver."
        retry={() => void query.refetch()}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {categories.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityState={{ selected: c === selected }}
              onPress={() => setCategory(c)}
              style={{
                padding: 12,
                minHeight: 48,
                borderRadius: 24,
                backgroundColor: c === selected ? palette.teal : palette.white,
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <Copy
                size={16}
                style={{ color: c === selected ? "white" : palette.ink }}
              >
                {c === "All"
                  ? "All"
                  : c
                      .toLowerCase()
                      .replace(/_/g, " ")
                      .replace(/^./, (v) => v.toUpperCase())}
              </Copy>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
          {rows?.map((memory) => (
            <Pressable
              key={memory.id}
              accessibilityRole="button"
              accessibilityLabel={memory.title}
              onPress={() =>
                router.push({
                  pathname: "/memory/[id]",
                  params: { id: memory.id },
                })
              }
              style={({ pressed }) => [
                styles.card,
                {
                  width: columns === 1 ? "100%" : "47%",
                  flexGrow: 1,
                  padding: 8,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <PatientImage
                url={memory.imageUrl}
                label={memory.title}
                category={memory.category}
                height={columns === 1 ? 200 : 145}
              />
              <View style={{ padding: 6, gap: 5 }}>
                <Copy size={20} bold>
                  {memory.title}
                </Copy>
                {memory.description && (
                  <Copy
                    size={16}
                    numberOfLines={3}
                    style={{ color: palette.muted }}
                  >
                    {memory.description}
                  </Copy>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </QueryState>
    </Screen>
  );
}
