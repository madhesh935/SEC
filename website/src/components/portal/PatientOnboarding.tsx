"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/patient.service";
import { familyService } from "@/services/family.service";
import { memoryService } from "@/services/memory.service";
import { mediaService } from "@/services/media.service";
import { createPatientFullSchema } from "@/schemas/patient.schema";
import { familyMemberSchema } from "@/schemas/family.schema";
import { memorySchema } from "@/schemas/memory.schema";
import { usePatientStore } from "@/store/patient.store";
import { Heading, Surface } from "./Primitives";
import { PageContainer } from "@/components/design-system";
const steps = [
  "Basic Information",
  "Care Context",
  "Biography",
  "Routine",
  "Family",
  "Memories",
  "Comfort",
  "Emergency Contacts",
  "Consent",
  "Review",
];
const split = (v: string) =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
export function PatientOnboarding() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({
    firstName: "",
    preferredName: "",
    preferredLanguage: "en",
    stage: "",
    profession: "",
    hometown: "",
    education: "",
    hobbies: "",
    favouriteTopics: "",
    routines: "",
    communicationPreferences: "",
    comfortPreferences: "",
    emergencyServicesPhone: "",
  });
  const [consent, setConsent] = useState({
    personalDataConsent: false,
    aiConversationConsent: false,
    emergencyEscalationConsent: false,
  });
  const [family, setFamily] = useState({
    name: "",
    relationship: "",
    description: "",
    phone: "",
  });
  const [memory, setMemory] = useState({ title: "", description: "" });
  const [comfort, setComfort] = useState({
    title: "",
    description: "",
    category: "MUSIC",
  });
  const [portrait, setPortrait] = useState<File | null>(null);
  const [familyPhoto, setFamilyPhoto] = useState<File | null>(null);
  const [memoryPhoto, setMemoryPhoto] = useState<File | null>(null);
  const [comfortAudio, setComfortAudio] = useState<File | null>(null);
  const [contact, setContact] = useState({
    name: "",
    relationship: "",
    phone: "",
  });
  const completed = useRef<{
    id?: string;
    photo?: boolean;
    family?: boolean;
    memory?: boolean;
    comfort?: boolean;
  }>({});
  const router = useRouter();
  const cache = useQueryClient();
  const field = (key: string, label: string, type = "text") => (
    <label className="gc-field" key={key}>
      {label}
      {type === "textarea" ? (
        <textarea
          value={draft[key] || ""}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      ) : (
        <input
          type={type}
          value={draft[key] || ""}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      )}
    </label>
  );
  function validateStep() {
    if (
      step === 0 &&
      (!draft.firstName.trim() || !draft.preferredLanguage.trim())
    )
      return "Add the patient's name and preferred language.";
    if (step === 1 && !draft.stage)
      return "Select the caregiver or clinician configured stage.";
    if (step === 4 && family.name && !family.relationship)
      return "Add the family relationship.";
    if (
      step === 5 &&
      (memory.title || memory.description) &&
      (!memory.title || !memory.description)
    )
      return "Add both a memory title and story.";
    if (
      step === 6 &&
      (comfort.title || comfortAudio) &&
      (!comfort.title || !comfort.description || !comfortAudio)
    )
      return "Add a title, description and audio file, or leave comfort content for later.";
    if (
      step === 7 &&
      (contact.name || contact.phone || contact.relationship) &&
      (!contact.name || !contact.phone || !contact.relationship)
    )
      return "Complete all emergency contact fields or leave them empty.";
    return "";
  }
  async function create() {
    setBusy(true);
    setError("");
    try {
      const data = createPatientFullSchema.parse({
        ...draft,
        ...consent,
        age: draft.age || undefined,
        dateOfBirth: draft.dateOfBirth || undefined,
        hobbies: split(draft.hobbies),
        favouriteTopics: split(draft.favouriteTopics),
        routines: split(draft.routines),
        emergencyContacts: contact.name
          ? [{ ...contact, isPrimary: true }]
          : [],
      });
      if (!completed.current.id) {
        setProgress("Creating patient profile…");
        const p = await patientService.createPatient(data);
        completed.current.id = p.id;
      }
      const id = completed.current.id!;
      if (portrait && !completed.current.photo) {
        setProgress("Saving profile photo…");
        const upload = await mediaService.uploadMedia(portrait, "photo", id);
        await patientService.updatePatient(id, { profilePhotoUrl: upload.url });
        completed.current.photo = true;
      }
      if (family.name && !completed.current.family) {
        setProgress("Adding family connection…");
        const photoUrl = familyPhoto
          ? (await mediaService.uploadMedia(familyPhoto, "photo", id)).url
          : undefined;
        await familyService.addFamilyMember(
          id,
          familyMemberSchema.parse({
            ...family,
            photoUrl,
            patientVisible: true,
          }),
        );
        completed.current.family = true;
      }
      if (memory.title && !completed.current.memory) {
        setProgress("Adding approved memory…");
        const imageUrl = memoryPhoto
          ? (await mediaService.uploadMedia(memoryPhoto, "photo", id)).url
          : undefined;
        await memoryService.createMemory(
          id,
          memorySchema.parse({
            ...memory,
            category: "FAMILY",
            imageUrl,
            approved: true,
            visibleToPatient: true,
          }),
        );
        completed.current.memory = true;
      }
      if (comfort.title && !completed.current.comfort) {
        setProgress("Adding comfort content…");
        const audioUrl = comfortAudio
          ? (await mediaService.uploadMedia(comfortAudio, "audio", id)).url
          : undefined;
        await memoryService.createMemory(
          id,
          memorySchema.parse({
            ...comfort,
            audioUrl,
            approved: true,
            visibleToPatient: true,
          }),
        );
        completed.current.comfort = true;
      }
      await cache.invalidateQueries({
        queryKey: ["caregiver", "accessible-patients"],
      });
      await cache.invalidateQueries({ queryKey: ["patients"] });
      usePatientStore.getState().setSelectedPatientId(id);
      router.push("/caregiver/patients/" + id + "?tab=Device");
    } catch (e) {
      setError(
        (completed.current.id
          ? "The patient profile was saved, but some content still needs attention. Retry to continue, or open the profile. "
          : "") +
          ((e as Error).name === "ZodError"
            ? "Check the required profile and contact fields."
            : (e as Error).message ||
              "We couldn't save the information. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageContainer>
      <Heading
        title="Create a patient profile"
        subtitle="Begin with their identity. Build care around the things they know and love."
      />
      <div className="gc-onboarding-steps" aria-label="Setup progress">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={i === step ? "step" : undefined}
            disabled={busy || !!completed.current.id || i > step}
            onClick={() => {
              setStep(i);
              setError("");
            }}
          >
            <span>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <Surface title={steps[step]}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const issue = validateStep();
            if (issue) {
              setError(issue);
              return;
            }
            if (step < steps.length - 1) {
              setError("");
              setStep(step + 1);
            } else void create();
          }}
        >
          <fieldset disabled={busy || !!completed.current.id}>
            {step === 0 && (
              <div className="gc-grid">
                {field("firstName", "Name *")}
                {field("preferredName", "Preferred name")}
                {field("dateOfBirth", "Date of birth", "date")}
                {field("age", "Age (if date of birth is unknown)", "number")}
                {field("preferredLanguage", "Preferred language *")}
                {field("gender", "Gender (optional)")}
                <label className="gc-field">
                  Profile photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPortrait(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}
            {step === 1 && (
              <>
                <label className="gc-field">
                  Configured dementia stage *
                  <select
                    value={draft.stage}
                    onChange={(e) =>
                      setDraft({ ...draft, stage: e.target.value })
                    }
                  >
                    <option value="">Select configured stage</option>
                    <option value="EARLY">Early</option>
                    <option value="MID">Middle</option>
                    <option value="LATE">Late</option>
                  </select>
                </label>
                <p className="gc-muted mb-5">
                  Use the stage configured by an authorized caregiver or
                  clinician. GeriCare does not diagnose a stage from activity
                  performance.
                </p>
                {field(
                  "communicationPreferences",
                  "Communication preferences",
                  "textarea",
                )}
                {field("comfortPreferences", "Support preferences", "textarea")}
              </>
            )}
            {step === 2 && (
              <div className="gc-grid">
                {field("profession", "Profession")}
                {field("hometown", "Hometown")}
                {field("education", "Education")}
                {field("hobbies", "Hobbies — one per line", "textarea")}
                {field(
                  "favouriteTopics",
                  "Favourite topics — one per line",
                  "textarea",
                )}
              </div>
            )}
            {step === 3 && (
              <>
                {field(
                  "routines",
                  "Daily routine — one step per line, in order",
                  "textarea",
                )}
                <p className="gc-muted">
                  These steps also support the personalized Daily Routine
                  activity.
                </p>
              </>
            )}
            {step === 4 && (
              <>
                <p className="gc-muted mb-5">
                  Add a first family connection. You can add more from the
                  patient profile later.
                </p>
                {(Object.keys(family) as (keyof typeof family)[]).map((key) => (
                  <label className="gc-field capitalize" key={key}>
                    {key}
                    <input
                      value={family[key]}
                      onChange={(e) =>
                        setFamily({ ...family, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <label className="gc-field">
                  Family photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFamilyPhoto(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </>
            )}
            {step === 5 && (
              <>
                <p className="gc-muted mb-5">
                  Add one approved, patient-visible memory. Leave blank to add
                  memories later.
                </p>
                <label className="gc-field">
                  Title
                  <input
                    value={memory.title}
                    onChange={(e) =>
                      setMemory({ ...memory, title: e.target.value })
                    }
                  />
                </label>
                <label className="gc-field">
                  Short story
                  <textarea
                    value={memory.description}
                    onChange={(e) =>
                      setMemory({ ...memory, description: e.target.value })
                    }
                  />
                </label>
                <label className="gc-field">
                  Memory photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setMemoryPhoto(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </>
            )}
            {step === 6 && (
              <>
                <p className="gc-muted mb-5">
                  Add approved music or a calming sound, or leave this for
                  later.
                </p>
                <label className="gc-field">
                  Title
                  <input
                    value={comfort.title}
                    onChange={(e) =>
                      setComfort({ ...comfort, title: e.target.value })
                    }
                  />
                </label>
                <label className="gc-field">
                  Description
                  <textarea
                    value={comfort.description}
                    onChange={(e) =>
                      setComfort({ ...comfort, description: e.target.value })
                    }
                  />
                </label>
                <label className="gc-field">
                  Content type
                  <select
                    value={comfort.category}
                    onChange={(e) =>
                      setComfort({ ...comfort, category: e.target.value })
                    }
                  >
                    <option value="MUSIC">Favourite music</option>
                    <option value="RELAXING_SOUND">Relaxing sound</option>
                  </select>
                </label>
                <label className="gc-field">
                  Audio file
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) =>
                      setComfortAudio(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </>
            )}
            {step === 7 && (
              <>
                {(Object.keys(contact) as (keyof typeof contact)[]).map(
                  (key) => (
                    <label className="gc-field capitalize" key={key}>
                      {key}
                      <input
                        value={contact[key]}
                        onChange={(e) =>
                          setContact({ ...contact, [key]: e.target.value })
                        }
                      />
                    </label>
                  ),
                )}
                {field(
                  "emergencyServicesPhone",
                  "Local emergency services phone number",
                )}
                <p className="gc-muted">
                  Use the appropriate number for the patient's location.
                </p>
              </>
            )}
            {step === 8 && (
              <>
                {(
                  [
                    [
                      "personalDataConsent",
                      "Personal data collection and personalization",
                    ],
                    ["aiConversationConsent", "AI conversations"],
                    ["emergencyEscalationConsent", "Emergency escalation"],
                  ] as const
                ).map(([key, label]) => (
                  <label className="gc-check" key={key}>
                    <input
                      type="checkbox"
                      checked={consent[key]}
                      onChange={(e) =>
                        setConsent({ ...consent, [key]: e.target.checked })
                      }
                    />
                    {label}
                  </label>
                ))}
                <p className="gc-muted mt-5">
                  Record the permissions you are authorized to give. Voice
                  recording usage and detailed privacy controls are managed in
                  Patient → Privacy.
                </p>
              </>
            )}
            {step === 9 && (
              <>
                <div className="gc-grid">
                  <div>
                    <p className="gc-eyebrow">Patient</p>
                    <h3 className="text-2xl mt-2">
                      {draft.preferredName || draft.firstName}
                    </h3>
                    <p className="gc-muted">
                      {draft.stage} · {draft.preferredLanguage}
                    </p>
                  </div>
                  <div className="gc-list">
                    {[
                      ["Family", family.name || "Add later"],
                      ["Memory", memory.title || "Add later"],
                      ["Comfort", comfort.title || "Add later"],
                      ["Emergency contact", contact.name || "Add later"],
                    ].map(([label, value]) => (
                      <div className="gc-row" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="gc-muted">
                  Create saves this information to GeriCare. You can then
                  generate a code to connect the patient app.
                </p>
              </>
            )}
          </fieldset>
          {error && (
            <p className="gc-form-error my-5" role="alert">
              {error}
            </p>
          )}
          {busy && (
            <p className="gc-muted my-5" role="status">
              {progress}
            </p>
          )}
          <div className="gc-actions mt-7">
            {step > 0 && !completed.current.id && (
              <button
                type="button"
                className="gc-button secondary"
                disabled={busy}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            <button className="gc-button" disabled={busy}>
              {busy
                ? "Saving…"
                : completed.current.id
                  ? "Retry remaining content"
                  : step === 9
                    ? "Create patient"
                    : "Continue"}
            </button>
            {completed.current.id && !busy && (
              <button
                className="gc-button secondary"
                type="button"
                onClick={() =>
                  router.push("/caregiver/patients/" + completed.current.id)
                }
              >
                Open saved profile
              </button>
            )}
          </div>
        </form>
      </Surface>
    </PageContainer>
  );
}
