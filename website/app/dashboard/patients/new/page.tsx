"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPatientFullSchema,
  CreatePatientFormData,
} from "@/schemas/patient.schema";
import { useCreatePatientMutation } from "@/hooks/usePatients";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
  Heart,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { ImageUploader } from "@/components/media/ImageUploader";

const WIZARD_STEPS = [
  { id: 1, name: "Basic Details" },
  { id: 2, name: "Care Information" },
  { id: 3, name: "Family Members" },
  { id: 4, name: "Life Story" },
  { id: 5, name: "Preferences" },
  { id: 6, name: "Personal Memories" },
  { id: 7, name: "Sensitive Memories" },
  { id: 8, name: "Consent" },
  { id: 9, name: "Emergency Contacts" },
  { id: 10, name: "Review & Submit" },
];

export default function CreatePatientPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const createPatientMutation = useCreatePatientMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isValid },
  } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientFullSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      preferredName: "",
      age: undefined,
      gender: "",
      preferredLanguage: "English",
      stage: "EARLY",
      communicationPreferences: "",
      profession: "",
      hometown: "",
      education: "",
      placesLived: [],
      importantLifeEvents: [],
      hobbies: [],
      favouriteTopics: [],
      favouriteFood: [],
      favouriteMusic: [],
      routines: [],
      meaningfulPlaces: [],
      comfortPreferences: "",
      personalDataConsent: true,
      aiConversationConsent: true,
      emergencyEscalationConsent: true,
      emergencyContacts: [
        { name: "", relationship: "", phone: "", isPrimary: true },
      ],
    },
  });

  const {
    fields: emergencyContactFields,
    append: appendEmergencyContact,
    remove: removeEmergencyContact,
  } = useFieldArray({
    control,
    name: "emergencyContacts",
  });

  // Dynamic tags helper states for Step 4
  const [newHobby, setNewHobby] = React.useState("");
  const [newTopic, setNewTopic] = React.useState("");
  const [newMusic, setNewMusic] = React.useState("");

  const hobbies = watch("hobbies") || [];
  const favouriteTopics = watch("favouriteTopics") || [];
  const favouriteMusic = watch("favouriteMusic") || [];

  const addTag = (
    field: "hobbies" | "favouriteTopics" | "favouriteMusic",
    val: string,
    clearFn: () => void
  ) => {
    if (!val.trim()) return;
    const current = watch(field) || [];
    if (!current.includes(val.trim())) {
      setValue(field, [...current, val.trim()]);
    }
    clearFn();
  };

  const removeTag = (
    field: "hobbies" | "favouriteTopics" | "favouriteMusic",
    val: string
  ) => {
    const current = watch(field) || [];
    setValue(
      field,
      current.filter((item) => item !== val)
    );
  };

  const onSubmit = async (data: CreatePatientFormData) => {
    setSubmitError(null);
    try {
      const created = await createPatientMutation.mutateAsync(data);
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/patients/${created.id}`);
      }, 1500);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        "Unable to create patient profile. Please verify your connection.";
      setSubmitError(message);
    }
  };

  // Maps a top-level form field name to the wizard step that edits it, so a
  // validation failure can jump the caregiver back to the right step instead
  // of the submit button silently doing nothing (react-hook-form's
  // handleSubmit never calls onSubmit when validation fails, and never
  // shows an error on its own).
  const FIELD_TO_STEP: Record<string, number> = {
    firstName: 1,
    preferredName: 1,
    age: 1,
    dateOfBirth: 1,
    gender: 1,
    preferredLanguage: 1,
    stage: 2,
    communicationPreferences: 2,
    profession: 4,
    hometown: 4,
    education: 4,
    placesLived: 4,
    importantLifeEvents: 4,
    hobbies: 4,
    favouriteTopics: 4,
    favouriteFood: 4,
    favouriteMusic: 4,
    routines: 4,
    meaningfulPlaces: 4,
    emergencyContacts: 9,
  };

  const onInvalid = (formErrors: typeof errors) => {
    const firstFieldName = Object.keys(formErrors)[0];
    const targetStep = firstFieldName ? FIELD_TO_STEP[firstFieldName] : undefined;

    if (targetStep) {
      setCurrentStep(targetStep);
    }

    setSubmitError(
      "Some required fields are incomplete. " +
        (targetStep
          ? `Please check ${WIZARD_STEPS[targetStep - 1].name} - required fields are marked in red below.`
          : "Please review the highlighted steps before saving.")
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextStep = () => {
    if (currentStep < 10) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (submitSuccess) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Patient Profile Created Successfully!
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          The GeriCare personal memory and companion engine has been initialized for this patient.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Redirecting to patient profile overview...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <PageHeader
        title="Create Patient Profile"
        subtitle="Complete the clinical and biographical steps below to initialize personalized companion assistance."
        action={
          <Link href="/dashboard/patients">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
        }
      />

      {/* Wizard Progress Indicator */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>
            Step {currentStep} of {WIZARD_STEPS.length}:{" "}
            <span className="text-teal-700">
              {WIZARD_STEPS[currentStep - 1].name}
            </span>
          </span>
          <span>{Math.round((currentStep / WIZARD_STEPS.length) * 100)}% Complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-teal-600 transition-all duration-300 rounded-full"
            style={{
              width: `${(currentStep / WIZARD_STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Step pills for desktop */}
        <div className="hidden md:flex items-center justify-between gap-1 mt-4 overflow-x-auto pt-2 border-t border-slate-100 text-[11px]">
          {WIZARD_STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg transition-colors whitespace-nowrap",
                currentStep === step.id
                  ? "bg-teal-50 text-teal-800 font-bold"
                  : currentStep > step.id
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-slate-400"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[9px]",
                  currentStep === step.id
                    ? "bg-teal-700 text-white"
                    : currentStep > step.id
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {step.id}
              </span>
              <span>{step.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Submission Error Banner */}
      {submitError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <span className="font-semibold">Unable to save patient profile.</span>
            <p className="mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {currentStep === 9 && <label className="block rounded-xl bg-white p-4 text-sm mb-4">Local emergency services number (optional; confirm for the patient’s location)<Input {...register("emergencyServicesPhone")} /></label>}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-soft">
          {/* STEP 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 1 — Basic Details
                </h3>
                <p className="text-xs text-slate-500">
                  Primary demographic information for the patient profile.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    First Name *
                  </label>
                  <Input
                    placeholder="First name"
                    error={!!errors.firstName}
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Preferred Name / Nickname
                  </label>
                  <Input
                    placeholder="Preferred name"
                    {...register("preferredName")}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Name the companion AI will use when addressing the patient.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Age
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 78"
                    error={!!errors.age}
                    {...register("age")}
                  />
                  {errors.age && (
                    <p className="text-xs text-red-600 mt-1">{errors.age.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Preferred Language *
                  </label>
                  <Input
                    placeholder="e.g. English, Spanish, Hindi..."
                    error={!!errors.preferredLanguage}
                    {...register("preferredLanguage")}
                  />
                  {errors.preferredLanguage && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.preferredLanguage.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Profile Photo URL
                  </label>
                  <Input
                    placeholder="https://..."
                    {...register("profilePhotoUrl")}
                  />
                  <ImageUploader onSuccess={url=>setValue("profilePhotoUrl",url)} />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Optional picture displayed on the caregiver portal and companion screens.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Care Information */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 2 — Care Information
                </h3>
                <p className="text-xs text-slate-500">
                  Configured care parameters and communication guidance.
                </p>
              </div>

              {/* Crucial Clinician disclaimer */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    Caregiver/Clinician Configured Stage
                  </span>
                  <p className="mt-0.5 text-amber-800">
                    Dementia stage is set by authorized caregivers or healthcare professionals. GeriCare AI does NOT automatically diagnose dementia stage.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Dementia Stage *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["EARLY", "MID", "LATE"] as const).map((stageVal) => {
                    const currentVal = watch("stage");
                    return (
                      <button
                        key={stageVal}
                        type="button"
                        onClick={() => setValue("stage", stageVal)}
                        className={cn(
                          "flex flex-col items-start rounded-xl border p-4 text-left transition-all",
                          currentVal === stageVal
                            ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        )}
                      >
                        <span className="text-sm font-bold text-slate-900">
                          {stageVal === "EARLY" && "Early Stage"}
                          {stageVal === "MID" && "Mid Stage"}
                          {stageVal === "LATE" && "Late Stage"}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">
                          {stageVal === "EARLY" &&
                            "Mild cognitive changes; conversational redirection & gentle memory reminders."}
                          {stageVal === "MID" &&
                            "Frequent repetitive inquiries; higher soothing reassurance & familiar topics."}
                          {stageVal === "LATE" &&
                            "High comfort priority; sensory music, familiar voices & calm presence."}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Communication Preferences & Calming Cues
                </label>
                <Textarea
                  placeholder="e.g. Speaks best in short sentences; gets comforted when discussing her morning garden or hearing family voice notes."
                  {...register("communicationPreferences")}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Family Members Intro */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 3 — Family Members
                </h3>
                <p className="text-xs text-slate-500">
                  Registered family members who can record comforting voice messages and submit memories.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                <Heart className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">
                  Family Portal Management
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  You will be able to onboard family members with dedicated invitations, voice recordings, and photo memories directly in the Family Management section after patient creation.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Life Story & Biography Form (Step 10) */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 4 — Life Story & Biography
                </h3>
                <p className="text-xs text-slate-500">
                  These details help GeriCare keep conversations familiar, personal, and grounding.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Profession / Career
                  </label>
                  <Input
                    placeholder="e.g. School Teacher, Carpenter, Botanist"
                    {...register("profession")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Hometown
                  </label>
                  <Input
                    placeholder="e.g. Savannah, Georgia"
                    {...register("hometown")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Education & Background
                  </label>
                  <Input
                    placeholder="e.g. State University, Class of '68"
                    {...register("education")}
                  />
                </div>
              </div>

              {/* Dynamic Tag Fields: Hobbies */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Hobbies & Interests
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newHobby}
                    onChange={(e) => setNewHobby(e.target.value)}
                    placeholder="Add a hobby (e.g. Gardening, Painting, Chess)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("hobbies", newHobby, () => setNewHobby(""));
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => addTag("hobbies", newHobby, () => setNewHobby(""))}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hobbies.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs text-teal-800 border border-teal-200"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeTag("hobbies", item)}
                        className="hover:text-teal-950 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic Tag Fields: Favourite Topics */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Favourite Conversation Topics
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Add topic (e.g. Roses, 60s Jazz, Train travel)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("favouriteTopics", newTopic, () => setNewTopic(""));
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => addTag("favouriteTopics", newTopic, () => setNewTopic(""))}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {favouriteTopics.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs text-sky-800 border border-sky-200"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeTag("favouriteTopics", item)}
                        className="hover:text-sky-950 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Preferences */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 5 — Comfort Preferences
                </h3>
                <p className="text-xs text-slate-500">
                  Sensory and musical cues that ease anxiety and agitation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Favourite Music & Artists
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newMusic}
                    onChange={(e) => setNewMusic(e.target.value)}
                    placeholder="e.g. Frank Sinatra, Classical piano, Motown"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("favouriteMusic", newMusic, () => setNewMusic(""));
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => addTag("favouriteMusic", newMusic, () => setNewMusic(""))}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {favouriteMusic.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs text-purple-800 border border-purple-200"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeTag("favouriteMusic", item)}
                        className="hover:text-purple-950 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Daily Comfort Routines
                </label>
                <Textarea
                  placeholder="e.g. Enjoys having chamomile tea at 4:30 PM; sitting on the porch looking at the bird feeder during dusk."
                  {...register("comfortPreferences")}
                />
              </div>
            </div>
          )}

          {/* STEP 6: Personal Memories Intro */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 6 — Personal Memories
                </h3>
                <p className="text-xs text-slate-500">
                  The Personal Memory Engine uses verified family stories to ground the patient during confusion.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                <Sparkles className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">
                  Personal Memory Library
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  You can catalog individual memories with photos, audio recordings, and emotional tones in the dedicated Memories module.
                </p>
              </div>
            </div>
          )}

          {/* STEP 7: Sensitive Memories & Guardrails */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 7 — Sensitive Memories & Guardrails
                </h3>
                <p className="text-xs text-slate-500">
                  Configure safety guardrails for distressing life events (e.g. loss of spouse, deceased relatives).
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900">
                      Granular Permission Controls
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      In GeriCare, sensitive memories can be configured so the AI knows the context internally for safety reasoning, but will never abruptly mention deceased loved ones or trigger grief.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Consent */}
          {currentStep === 8 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 8 — Caregiver & Patient Consent
                </h3>
                <p className="text-xs text-slate-500">
                  Explicit legal consent for AI companion processing.
                </p>
              </div>

              <div className="space-y-4">
                <Switch
                  id="personalDataConsent"
                  label="Personal Data Processing Consent"
                  description="Authorize GeriCare to securely process biographical context to personalize conversational interactions."
                  checked={watch("personalDataConsent")}
                  onCheckedChange={(val) => setValue("personalDataConsent", val)}
                />

                <Switch
                  id="aiConversationConsent"
                  label="AI Conversation Real-time Analysis"
                  description="Permit real-time analysis of speech tension, repetitions, and distress signals to activate calming strategies."
                  checked={watch("aiConversationConsent")}
                  onCheckedChange={(val) => setValue("aiConversationConsent", val)}
                />

                <Switch
                  id="emergencyEscalationConsent"
                  label="Emergency Contact Notification Escalation"
                  description="Automatically notify primary caregiver and emergency contacts if sustained urgent distress is detected."
                  checked={watch("emergencyEscalationConsent")}
                  onCheckedChange={(val) =>
                    setValue("emergencyEscalationConsent", val)
                  }
                />
              </div>
            </div>
          )}

          {/* STEP 9: Emergency Contacts */}
          {currentStep === 9 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 9 — Emergency Contacts
                </h3>
                <p className="text-xs text-slate-500">
                  Caregivers and medical proxies to contact during high distress.
                </p>
              </div>

              <p className="text-xs text-slate-500">
                At least one contact with a name, relationship, and phone number is required.
              </p>

              <div className="space-y-3">
                {emergencyContactFields.map((field, index) => {
                  const contactErrors = errors.emergencyContacts?.[index];
                  return (
                    <div
                      key={field.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50/50"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex-1 w-full">
                          <Input
                            placeholder="Contact Name *"
                            error={!!contactErrors?.name}
                            {...register(`emergencyContacts.${index}.name` as const)}
                          />
                          {contactErrors?.name && (
                            <p className="text-xs text-red-600 mt-1">
                              {contactErrors.name.message}
                            </p>
                          )}
                        </div>
                        <div className="flex-1 w-full">
                          <Input
                            placeholder="Relationship (e.g. Daughter) *"
                            error={!!contactErrors?.relationship}
                            {...register(`emergencyContacts.${index}.relationship` as const)}
                          />
                          {contactErrors?.relationship && (
                            <p className="text-xs text-red-600 mt-1">
                              {contactErrors.relationship.message}
                            </p>
                          )}
                        </div>
                        <div className="flex-1 w-full">
                          <Input
                            placeholder="Phone Number *"
                            error={!!contactErrors?.phone}
                            {...register(`emergencyContacts.${index}.phone` as const)}
                          />
                          {contactErrors?.phone && (
                            <p className="text-xs text-red-600 mt-1">
                              {contactErrors.phone.message}
                            </p>
                          )}
                        </div>
                        {emergencyContactFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmergencyContact(index)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors shrink-0"
                            aria-label="Remove contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendEmergencyContact({
                      name: "",
                      relationship: "",
                      phone: "",
                      isPrimary: false,
                    })
                  }
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Another Emergency Contact
                </Button>
              </div>
            </div>
          )}

          {/* STEP 10: Review & Submit */}
          {currentStep === 10 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Step 10 — Review & Submit
                </h3>
                <p className="text-xs text-slate-500">
                  Verify patient profile configuration before saving to the secure backend.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/40">
                  <span className="font-semibold text-slate-500 uppercase">
                    Patient
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {watch("preferredName") || watch("firstName") || "—"}
                  </p>
                  <p className="text-slate-500">Legal: {watch("firstName")}</p>
                  <p className="text-slate-500">Age: {watch("age") || "Not specified"}</p>
                  <p className="text-slate-500">Language: {watch("preferredLanguage")}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/40">
                  <span className="font-semibold text-slate-500 uppercase">
                    Configured Stage
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {watch("stage")} Stage
                  </p>
                  <p className="text-slate-500 mt-1">
                    Hometown: {watch("hometown") || "—"}
                  </p>
                  <p className="text-slate-500">
                    Profession: {watch("profession") || "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/40 text-xs">
                <span className="font-semibold text-slate-500 uppercase">
                  Biographical Tags
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hobbies.map((h) => (
                    <span
                      key={h}
                      className="rounded bg-teal-100 px-2 py-0.5 text-teal-800"
                    >
                      {h}
                    </span>
                  ))}
                  {favouriteTopics.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-sky-100 px-2 py-0.5 text-sky-800"
                    >
                      {t}
                    </span>
                  ))}
                  {hobbies.length === 0 && favouriteTopics.length === 0 && (
                    <span className="text-slate-400">None specified</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>

            {currentStep < 10 ? (
              <Button
                type="button"
                variant="teal"
                onClick={nextStep}
                className="gap-1.5"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="teal"
                size="lg"
                isLoading={createPatientMutation.isPending}
                className="gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Save & Initialize Profile</span>
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
