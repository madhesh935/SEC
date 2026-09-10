import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../src/store/session.store";
import { patientService } from "../src/services/patient.service";
import { Screen, QueryState } from "../src/components/patient/Design";
export default function Startup() {
  const router = useRouter(),
    client = useQueryClient();
  const [error, setError] = useState(false);
  const start = useCallback(async () => {
    setError(false);
    try {
      const session = await useSessionStore.getState().initializeSession();
      if (!session) {
        router.replace("/onboarding/welcome");
        return;
      }
      const patient = await patientService.getPatientProfile(session.patientId);
      client.setQueryData(["patient", session.patientId, undefined], patient);
      router.replace("/home");
    } catch {
      setError(true);
    }
  }, [router, client]);
  useEffect(() => {
    void start();
  }, [start]);
  return (
    <Screen>
      <QueryState loading={!error} error={error} retry={() => void start()}>
        {null}
      </QueryState>
    </Screen>
  );
}
