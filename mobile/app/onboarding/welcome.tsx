import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Screen,
  Brand,
  Copy,
  Action,
  palette,
} from "../../src/components/patient/Design";
import { CompanionOrb } from "../../src/components/companion/CompanionOrb";
export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.ivory }}>
      <Screen>
        <View
          style={{
            alignItems: "center",
            paddingTop: 24,
            gap: 26,
            flex: 1,
            justifyContent: "space-around",
          }}
        >
          <Brand />
          <Copy size={32} bold style={{ textAlign: "center", maxWidth: 330 }}>
            A familiar voice for brighter days.
          </Copy>
          <Copy
            size={20}
            style={{ textAlign: "center", maxWidth: 330, color: palette.muted }}
          >
            Your personal companion for comfort, connection and support.
          </Copy>
          <CompanionOrb state="idle" size={220} />
        </View>
        <Action
          label="Connect This Device"
          onPress={() => router.push("/onboarding/pairing")}
        />
        <Action
          label="Already connected? Continue"
          secondary
          onPress={() => router.replace("/")}
        />
      </Screen>
    </SafeAreaView>
  );
}
