import React, { useState } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Phone, ShieldPlus } from "lucide-react-native";
import {
  Screen,
  Copy,
  Card,
  Action,
  QueryState,
  Reassurance,
  palette,
} from "../../src/components/patient/Design";
import { useHelpContacts, useRequestHelp } from "../../src/hooks/usePatient";
import { useNetwork } from "../../src/hooks/useNetwork";
export default function Help() {
  const query = useHelpContacts(),
    help = useRequestHelp(),
    router = useRouter(),
    { isOffline } = useNetwork(),
    [callError, setCallError] = useState(false);
  const call = (number: string) => {
    void Linking.openURL("tel:" + number).catch(() => setCallError(true));
  };
  return (
    <Screen title="Help & Support" subtitle="We’re here to help you anytime.">
      <Card tone="mint">
        <Bell color={palette.teal} size={30} />
        <Copy bold size={23}>
          Request Help
        </Copy>
        <Copy>Tell your caregiver you’d like support.</Copy>
        <Action
          label="Notify Caregiver"
          loading={help.isPending}
          disabled={isOffline}
          onPress={() => help.mutate()}
        />
        {help.data?.success && (
          <Copy accessibilityLiveRegion="polite" bold>
            {help.data.message || "Your caregiver has been notified."}
          </Copy>
        )}
        {help.error && (
          <Copy accessibilityRole="alert" style={{ color: palette.red }}>
            We couldn’t send your request. Please try again or call someone
            familiar.
          </Copy>
        )}
      </Card>
      <Card tone="blue">
        <Phone color={palette.teal} size={30} />
        <Copy bold size={23}>
          Call Family
        </Copy>
        <Copy>Speak to someone familiar.</Copy>
        <Action
          label="Choose Family Member"
          secondary
          onPress={() => router.push("/family")}
        />
        {query.data?.familyContactPhone && (
          <Action
            secondary
            label={"Call " + (query.data.familyContactName || "Family Contact")}
            onPress={() => call(query.data!.familyContactPhone!)}
          />
        )}
      </Card>
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {query.data?.caregiverPhone && (
          <Action
            label={"Call " + (query.data.caregiverName || "Caregiver")}
            secondary
            onPress={() => call(query.data!.caregiverPhone!)}
          />
        )}
        <Card tone="rose">
          <ShieldPlus color={palette.red} size={30} />
          <Copy size={23} bold>
            Emergency Help
          </Copy>
          <Copy>Get urgent help if needed.</Copy>
          {query.data?.emergencyPhone ? (
            <Action
              label="Call Emergency Services"
              danger
              onPress={() => call(query.data!.emergencyPhone!)}
            />
          ) : (
            <Copy>
              Your caregiver can add the local emergency services number. Ask
              someone nearby for urgent help.
            </Copy>
          )}
        </Card>
      </QueryState>
      {callError && (
        <Copy accessibilityRole="alert">
          We couldn’t open the phone. Please ask someone nearby for help.
        </Copy>
      )}
      <Reassurance>You’re not alone. Help is always available.</Reassurance>
    </Screen>
  );
}
