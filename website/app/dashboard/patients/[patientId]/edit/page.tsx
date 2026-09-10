"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/patient.service";
import { Patient } from "@/types";
import { ImageUploader } from "@/components/media/ImageUploader";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
const fields = [
  ["firstName", "First name"],
  ["preferredName", "Preferred name"],
  ["preferredLanguage", "Preferred language"],
  ["profession", "Profession"],
  ["hometown", "Hometown"],
  ["education", "Education"],
  ["communicationPreferences", "Communication preferences"],
  ["comfortPreferences", "Comfort preferences"],
  ["emergencyServicesPhone", "Local emergency services number"],
] as const;
const arrays = [
  ["routines", "Daily routine: one step per line, in order"],
  ["hobbies", "Hobbies"],
  ["placesLived", "Places lived"],
  ["importantLifeEvents", "Important life events"],
  ["meaningfulPlaces", "Meaningful places"],
  ["favouriteMusic", "Favourite music"],
  ["favouriteTopics", "Favourite topics"],
] as const;
export default function EditPatient() {
  const { patientId } = useParams<{ patientId: string }>(),
    router = useRouter(),
    client = useQueryClient();
  const query = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientService.getPatientById(patientId),
  });
  const [draft, setDraft] = useState<Patient | null>(null);
  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);
  const save = useMutation({
    mutationFn: () => patientService.updatePatient(patientId, draft!),
    onSuccess: async () => {
      await client.invalidateQueries();
      router.push("/dashboard/patients/" + patientId);
    },
  });
  if (query.isPending) return <LoadingState />;
  if (query.error || !draft)
    return (
      <ErrorState
        title="Could not load profile"
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <PageHeader
        title="Edit Patient Profile"
        subtitle="Updates appear in the connected patient app."
      />
      <form
        className="rounded-2xl bg-white border p-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        {fields.map(([key, label]) => (
          <label key={key} className="block text-sm font-medium space-y-2">
            <span>{label}</span>
            <Input
              required={[
                "firstName",
                "preferredName",
                "preferredLanguage",
              ].includes(key)}
              value={draft[key] || ""}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="block text-sm font-medium">
          Caregiver / clinician configured stage
          <select
            className="w-full border rounded-xl p-3 mt-2"
            value={draft.stage}
            onChange={(e) =>
              setDraft({ ...draft, stage: e.target.value as Patient["stage"] })
            }
          >
            <option value="EARLY">Early</option>
            <option value="MID">Mid</option>
            <option value="LATE">Late</option>
          </select>
        </label>
        <ImageUploader
          patientId={patientId}
          onSuccess={(url) => setDraft({ ...draft, profilePhotoUrl: url })}
        />
        {arrays.map(([key, label]) => (
          <label key={key} className="block text-sm font-medium space-y-2">
            <span>{label}</span>
            <Textarea
              value={(draft[key] || []).join("\n")}
              onChange={(e) =>
                setDraft({ ...draft, [key]: e.target.value.split("\n") })
              }
            />
          </label>
        ))}
        <fieldset className="space-y-3">
          <legend className="font-semibold">Emergency family contacts</legend>
          {(draft.emergencyContacts || []).map((contact, index) => (
            <div key={index} className="grid sm:grid-cols-3 gap-2">
              {(["name", "relationship", "phone"] as const).map((key) => (
                <label key={key} className="text-sm">
                  {key}
                  <Input
                    required
                    value={contact[key]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        emergencyContacts: draft.emergencyContacts!.map(
                          (c, i) =>
                            i === index ? { ...c, [key]: e.target.value } : c,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDraft({
                    ...draft,
                    emergencyContacts: draft.emergencyContacts!.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
              >
                Remove contact
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setDraft({
                ...draft,
                emergencyContacts: [
                  ...(draft.emergencyContacts || []),
                  {
                    name: "",
                    relationship: "",
                    phone: "",
                    isPrimary: !draft.emergencyContacts?.length,
                  },
                ],
              })
            }
          >
            Add contact
          </Button>
        </fieldset>
        {save.error && (
          <p role="alert" className="text-red-700">
            Could not save your changes. Please try again.
          </p>
        )}
        <Button type="submit" variant="teal" isLoading={save.isPending}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
