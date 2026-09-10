"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Images, Heart, AudioLines, Plus } from "lucide-react";
import {
  portalService,
  FamilyMemory,
  FamilyPatient,
} from "@/services/portal.service";
import { mediaService } from "@/services/media.service";
import { useAuthStore } from "@/store/auth.store";
import { usePatientStore } from "@/store/patient.store";
import {
  Heading,
  Surface,
  DataState,
  Empty,
  Photo,
  greeting,
  time,
} from "./Primitives";
import { Modal } from "@/components/ui/modal";
import { PageContainer } from "@/components/design-system";
export function FamilyPortal({
  page = "Home",
}: {
  page?:
    "Home" | "Loved One" | "Memories & Voices" | "Connection" | "Notifications";
}) {
  const id = usePatientStore((s) => s.selectedPatientId);
  const user = useAuthStore((s) => s.user);
  return (
    <PageContainer>
      <Heading
        title={
          page === "Home"
            ? greeting() + (user?.name ? ", " + user.name : "")
            : page
        }
        subtitle={
          page === "Home"
            ? "Small moments of connection, wherever you are."
            : "A familiar circle, built around someone you love."
        }
      />
      {id ? (
        <FamilyData key={id} id={id} page={page} />
      ) : (
        <Surface>
          <Empty>
            No loved one is linked to your account yet. Ask your caregiver to
            share an invitation.
          </Empty>
        </Surface>
      )}
    </PageContainer>
  );
}
function FamilyData({ id, page }: { id: string; page: string }) {
  const q = useQuery({
    queryKey: ["family-profile", id],
    queryFn: () => portalService.familyPatient(id),
  });
  const p = q.data;
  return (
    <DataState query={q}>
      {p && (
        <>
          {(page === "Home" || page === "Loved One") && (
            <>
              <Surface className="gc-hero">
                <Photo src={p.profilePhotoUrl} name={p.preferredName} large />
                <div>
                  <p className="gc-eyebrow">Your family circle</p>
                  <h2>{p.preferredName}</h2>
                  <p>
                    {p.relationship}
                    {p.preferredLanguage ? " · " + p.preferredLanguage : ""}
                  </p>
                  {page === "Home" && (
                    <div className="gc-actions">
                      <Link className="gc-button" href="/family/memories">
                        <Images size={17} />
                        Memories & voices
                      </Link>
                      <Link
                        className="gc-button secondary"
                        href="/family/connection"
                      >
                        <Heart size={17} />
                        Find a connection
                      </Link>
                    </div>
                  )}
                </div>
              </Surface>
              {page === "Loved One" && (
                <div className="gc-grid">
                  <Surface title="Their story">
                    {p.profession && (
                      <div className="gc-row">
                        <span>Profession</span>
                        <strong>{p.profession}</strong>
                      </div>
                    )}
                    {p.hometown && (
                      <div className="gc-row">
                        <span>Hometown</span>
                        <strong>{p.hometown}</strong>
                      </div>
                    )}
                    {!p.profession && !p.hometown && (
                      <Empty>
                        Approved life-story information will appear here.
                      </Empty>
                    )}
                  </Surface>
                  <Surface title="Familiar interests">
                    {[...p.hobbies, ...p.favouriteTopics].length ? (
                      <div className="gc-actions">
                        {[...p.hobbies, ...p.favouriteTopics].map((v, i) => (
                          <span className="gc-badge" key={i}>
                            {v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <Empty>
                        Favourite interests have not been shared yet.
                      </Empty>
                    )}
                  </Surface>
                </div>
              )}
            </>
          )}
          {(page === "Home" || page === "Memories & Voices") &&
            (p.permissions.includes("viewMemories") ? (
              <Memories p={p} compact={page === "Home"} />
            ) : (
              <Surface>
                <Empty>Your caregiver has not enabled memory access.</Empty>
              </Surface>
            ))}
          {page === "Connection" && <Connection p={p} />}
          {page === "Notifications" &&
            (p.permissions.includes("viewUpdates") ? (
              <Notifications id={id} />
            ) : (
              <Surface>
                <Empty>
                  Your caregiver has not enabled updates for this account.
                </Empty>
              </Surface>
            ))}
        </>
      )}
    </DataState>
  );
}
function Memories({ p, compact }: { p: FamilyPatient; compact: boolean }) {
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["family-memories", p.id],
    queryFn: () => portalService.familyMemories(p.id),
  });
  const rows = compact ? q.data?.slice(0, 3) : q.data;
  return (
    <>
      <div className="gc-heading">
        <div>
          <h2 className="text-xl font-semibold">
            {compact ? "Shared moments" : "Memories & familiar voices"}
          </h2>
          <p>Stories that keep you connected.</p>
        </div>
        {p.permissions.includes("contributeMemory") && (
          <button className="gc-button" onClick={() => setOpen(true)}>
            <Plus size={18} />
            Add a memory
          </button>
        )}
      </div>
      <DataState
        query={q}
        empty={
          q.data?.length === 0 &&
          "No memories have been shared yet. Your caregiver can approve memories for your family circle."
        }
      >
        <div className="gc-grid three">
          {rows?.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      </DataState>
      {compact && (
        <Link className="gc-text-button" href="/family/memories">
          View all shared memories →
        </Link>
      )}
      <Contribution p={p} open={open} close={() => setOpen(false)} />
    </>
  );
}
function MemoryCard({ memory: m }: { memory: FamilyMemory }) {
  const [failed, setFailed] = useState(false);
  return (
    <article id={m.id} className="gc-surface gc-memory">
      <div className="gc-memory-visual">
        {m.imageUrl && !failed ? (
          <img
            src={m.imageUrl}
            alt={m.title}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <Images size={38} aria-label="No photo available" />
        )}
      </div>
      <div className="gc-memory-body">
        <div className="gc-actions mb-3">
          <span
            className={
              "gc-badge " + (m.reviewStatus === "pending" ? "amber" : "")
            }
          >
            {m.reviewStatus === "pending"
              ? "Awaiting caregiver review"
              : "Shared memory"}
          </span>
          {m.contributedByYou && (
            <span className="gc-muted text-xs">Added by you</span>
          )}
        </div>
        <h3>{m.title}</h3>
        {m.displayDate && <p>{m.displayDate}</p>}
        <p>{m.description}</p>
        {m.audioUrl && (
          <audio
            controls
            preload="none"
            src={m.audioUrl}
            aria-label={"Hear " + m.title}
          />
        )}
      </div>
    </article>
  );
}
function Contribution({
  p,
  open,
  close,
}: {
  p: FamilyPatient;
  open: boolean;
  close: () => void;
}) {
  const cache = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const submit = useMutation({
    mutationFn: async () => {
      const imageUrl = photo
        ? (await mediaService.uploadMedia(photo, "photo", p.id)).url
        : undefined;
      const audioUrl = voice
        ? (await mediaService.uploadMedia(voice, "audio", p.id)).url
        : undefined;
      return portalService.contribute(p.id, {
        title,
        description,
        category: "FAMILY",
        imageUrl,
        audioUrl,
      });
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["family-memories", p.id] });
      setTitle("");
      setDescription("");
      setPhoto(null);
      setVoice(null);
      close();
    },
  });
  return (
    <Modal
      isOpen={open}
      onClose={() => {
        if (!submit.isPending) close();
      }}
      title="Share something familiar"
      description="Your caregiver reviews contributions before they appear in the patient app."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
      >
        <label className="gc-field">
          Title
          <input
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="gc-field">
          The story
          <textarea
            required
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {p.permissions.includes("uploadPhoto") && (
          <label className="gc-field">
            Add a photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </label>
        )}
        {p.permissions.includes("uploadVoice") && (
          <label className="gc-field">
            Add a voice recording
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setVoice(e.target.files?.[0] || null)}
            />
          </label>
        )}
        {submit.isError && (
          <p className="gc-form-error" role="alert">
            Your contribution could not be saved. Please check your connection
            and try again.
          </p>
        )}
        <button className="gc-button" disabled={submit.isPending}>
          {submit.isPending ? "Saving your contribution…" : "Submit for review"}
        </button>
      </form>
    </Modal>
  );
}
function Connection({ p }: { p: FamilyPatient }) {
  const q = useQuery({
    queryKey: ["family-connection", p.id],
    queryFn: () => portalService.suggestions(p.id),
    enabled: p.permissions.includes("viewMemories"),
  });
  return (
    <>
      <div className="gc-grid">
        <Surface title="Memories to talk about">
          {p.permissions.includes("viewMemories") ? (
            <DataState
              query={q}
              empty={
                q.data?.length === 0 &&
                "Connection ideas will appear as approved memories are shared."
              }
            >
              {q.data?.map((s) => (
                <Link
                  className="gc-row"
                  href={"/family/memories#" + s.memoryId}
                  key={s.id}
                >
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.description}</p>
                  </div>
                  <AudioLines size={20} />
                </Link>
              ))}
            </DataState>
          ) : (
            <Empty>Memory sharing is not enabled for your account.</Empty>
          )}
        </Surface>
        <Surface title="Your caregiver connection">
          {p.caregiverName && (
            <h3 className="text-lg mb-3">{p.caregiverName}</h3>
          )}
          {p.caregiverEmail ? (
            <>
              <p className="gc-muted mb-5">
                Stay in touch about the people and moments that matter.
              </p>
              <a
                className="gc-button secondary"
                href={"mailto:" + p.caregiverEmail}
              >
                Contact caregiver
              </a>
            </>
          ) : (
            <Empty>Caregiver contact details have not been shared yet.</Empty>
          )}
        </Surface>
      </div>
    </>
  );
}
function Notifications({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["family-notifications", id],
    queryFn: () => portalService.notifications(id),
    refetchInterval: 30000,
  });
  return (
    <Surface title="Your updates">
      <DataState
        query={q}
        empty={
          q.data?.length === 0 &&
          "You're all caught up. New approved updates will appear here."
        }
      >
        {q.data?.map((n) => (
          <div className="gc-row" key={n.id}>
            <div>
              <h3>{n.title}</h3>
              <p>{n.message}</p>
            </div>
            <span className="gc-muted text-xs">{time(n.createdAt)}</span>
          </div>
        ))}
      </DataState>
    </Surface>
  );
}
