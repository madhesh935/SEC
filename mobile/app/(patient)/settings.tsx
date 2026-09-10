import React, { useEffect, useState } from "react";
import { Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Card,
  Action,
  QueryState,
  palette,
} from "../../src/components/patient/Design";
import {
  usePatientSettings,
  usePatientProfile,
} from "../../src/hooks/usePatient";
import { useSettingsStore } from "../../src/store/settings.store";
import { useSessionStore } from "../../src/store/session.store";
import { experienceService } from "../../src/services/experience.service";
import { PatientSettings } from "../../src/services/contracts";
export default function Settings() {
  const query = usePatientSettings(),
    profile = usePatientProfile(),
    router = useRouter(),
    client = useQueryClient();
  const [draft, setDraft] = useState<PatientSettings | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    if (query.data) {
      setDraft(query.data);
      useSettingsStore.setState(query.data);
    }
  }, [query.data]);
  async function save() {
    const id = useSessionStore.getState().session?.patientId;
    if (!draft || !id) return;
    setBusy(true);
    setError(false);
    try {
      const value = await experienceService.saveSettings(id, draft);
      useSettingsStore.setState(value);
      client.setQueryData(["settings", id, undefined], value);
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Settings" subtitle="Make yourself comfortable">
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {draft && (
          <>
            <Card>
              <Copy size={22} bold>
                Text Size
              </Copy>
              {(["normal", "large", "extra-large"] as const).map((size) => (
                <Action
                  key={size}
                  label={
                    size === "extra-large"
                      ? "Extra Large"
                      : size === "large"
                        ? "Large"
                        : "Standard"
                  }
                  secondary={draft.textSize !== size}
                  onPress={() => {
                    setDraft({ ...draft, textSize: size });
                    setSaved(false);
                  }}
                />
              ))}
            </Card>
            <Card>
              {[
                { key: "reducedMotion", label: "Gentle, still visuals" },
                { key: "replayVoiceResponse", label: "Play replies aloud" },
              ].map(({ key, label }) => (
                <View
                  key={key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 52,
                  }}
                >
                  <Copy style={{ flex: 1 }}>{label}</Copy>
                  <Switch
                    accessibilityLabel={label}
                    value={
                      draft[key as "reducedMotion" | "replayVoiceResponse"]
                    }
                    onValueChange={(value) => {
                      setDraft({ ...draft, [key]: value });
                      setSaved(false);
                    }}
                    trackColor={{ true: palette.teal }}
                  />
                </View>
              ))}
            </Card>
            <Card>
              <Copy bold>Voice Volume</Copy>
              {[
                { value: 0.5, label: "Soft" },
                { value: 0.75, label: "Medium" },
                { value: 1, label: "Louder" },
              ].map((v) => (
                <Action
                  key={v.value}
                  label={v.label}
                  secondary={draft.voiceVolume !== v.value}
                  onPress={() => {
                    setDraft({ ...draft, voiceVolume: v.value });
                    setSaved(false);
                  }}
                />
              ))}
            </Card>
            {profile.data?.preferredLanguage && (
              <Copy>Language: {profile.data.preferredLanguage}</Copy>
            )}
            <Action
              label="Save Settings"
              loading={busy}
              onPress={() => void save()}
            />
            {saved && (
              <Copy accessibilityLiveRegion="polite">
                Your settings are saved.
              </Copy>
            )}
            {error && (
              <Copy accessibilityRole="alert">
                We couldn’t save your settings. Please try again.
              </Copy>
            )}
          </>
        )}
      </QueryState>
      <Action
        label="Disconnect This Device"
        secondary
        onPress={() => {
          void useSessionStore
            .getState()
            .clearSession()
            .then(() => {
              client.clear();
              router.replace("/onboarding/welcome");
            });
        }}
      />
    </Screen>
  );
}
