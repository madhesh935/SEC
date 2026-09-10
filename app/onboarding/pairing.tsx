import React, { useRef, useState } from "react";
import { View, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { QrCode, Keyboard } from "lucide-react-native";
import { useRouter } from "expo-router";
import {
  Screen,
  Copy,
  Action,
  Card,
  palette,
  Reassurance,
} from "../../src/components/patient/Design";
import { pairingService } from "../../src/services/pairing.service";
import { getOrCreateDeviceId } from "../../src/utils/deviceId";
import { useSessionStore } from "../../src/store/session.store";
export default function Pairing() {
  const router = useRouter();
  const [mode, setMode] = useState<"code" | "qr">("code"),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const locked = useRef(false);
  async function connect(value = code) {
    if (locked.current) return;
    const token = value.trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(token)) {
      setError("Please enter the eight-character code from your caregiver.");
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const deviceId = await getOrCreateDeviceId();
      const result = await pairingService.verifyPairing({
        pairingCode: token,
        deviceId,
      });
      await useSessionStore.getState().setSession({ ...result, deviceId });
      router.replace("/");
    } catch {
      setError(
        "We couldn’t connect. Ask your caregiver to check the code, then try again.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.ivory }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen
          title="Connect Your Device"
          subtitle="Scan the QR code or enter the pairing code provided by your caregiver."
        >
          <View style={{ gap: 10 }}>
            <Action
              label="Scan QR Code"
              secondary={mode !== "qr"}
              icon={
                <QrCode
                  color={mode === "qr" ? "white" : palette.teal}
                  size={22}
                />
              }
              onPress={() => {
                setMode("qr");
                setError("");
              }}
            />
            <Action
              label="Enter Code"
              secondary={mode !== "code"}
              icon={
                <Keyboard
                  color={mode === "code" ? "white" : palette.teal}
                  size={22}
                />
              }
              onPress={() => {
                setMode("code");
                setError("");
              }}
            />
          </View>
          {mode === "qr" && (
            <Card>
              {permission?.granted ? (
                <View
                  style={{ height: 260, borderRadius: 20, overflow: "hidden" }}
                >
                  <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={
                      busy
                        ? undefined
                        : ({ data }) => {
                            const match =
                              /^(?:gericare:\/\/pair\?code=)?([A-HJ-NP-Z2-9]{8})$/i.exec(
                                data.trim(),
                              );
                            if (match) {
                              setCode(match[1]);
                              setMode("code");
                              void connect(match[1]);
                            } else {
                              setError(
                                "This QR code isn’t a GeriCare pairing code.",
                              );
                            }
                          }
                    }
                  />
                </View>
              ) : (
                <>
                  <Copy>
                    Allow the camera to scan the code on your caregiver’s
                    screen.
                  </Copy>
                  <Action
                    label="Allow Camera"
                    onPress={() => void requestPermission()}
                  />
                </>
              )}
              <Copy size={16} style={{ textAlign: "center" }}>
                Point your camera at your caregiver’s QR code.
              </Copy>
            </Card>
          )}
          {mode === "code" && (
            <Card>
              <Copy bold>Pairing Code</Copy>
              <TextInput
                accessibilityLabel="Pairing code"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                editable={!busy}
                style={{
                  minHeight: 68,
                  borderWidth: 2,
                  borderColor: palette.teal,
                  borderRadius: 18,
                  fontSize: 28,
                  letterSpacing: 5,
                  textAlign: "center",
                  color: palette.ink,
                  padding: 12,
                }}
              />
              <Action
                label="Connect"
                onPress={() => void connect()}
                loading={busy}
              />
            </Card>
          )}
          {!!error && (
            <Copy accessibilityRole="alert" style={{ color: palette.red }}>
              {error}
            </Copy>
          )}
          <Reassurance>Need help? Ask your caregiver.</Reassurance>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
