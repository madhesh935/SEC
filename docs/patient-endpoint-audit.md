# Patient integration audit — before implementation

Inspected 10 September 2026. All paths below include the configured `/api/v1` prefix. Source: `backend/app/api/router.py`, every v1 router, schemas, services and repositories; `app`, `src`, and `website/app` / `website/src`.

## Existing architecture

- Patient: Expo 57 / React Native 0.86, Expo Router stacks, NativeWind and theme tokens, Zustand session/settings/companion stores, TanStack Query, Axios services. Expo Audio records; the current uncommitted implementation speaks through expo-speech. Native SecureStore exists; web currently stores tokens in localStorage.
- Caregiver: Next.js 15 App Router, Firebase authentication, Axios, TanStack Query, React Hook Form / Zod. Patient creation, family/memory editing, consent and pairing code/PIN exist. Profile edit links lack a matching route; upload components exist but family/memory forms only accept URLs. No distinct comfort editor; comfort is derived from approved memory media and family voice recordings.
- Backend: FastAPI → services → repositories → Firestore. Some comfort/activity projection logic currently lives in routers. Firebase Admin initialization is centralized. Storage uploads create metadata and return a two-hour signed URL which forms persist without renewal.
- Collections: users (fcm_tokens), patients (family, memories, devices, conversations, conversation_events, repetition_events, distress_events, behaviour_patterns, activities, calming_strategies, alerts, consents/default), pairing_codes, pairing_pins, media. Repository classes are the authoritative collection-name source.
- Voice: faster-whisper → embeddings/personal memory → configured-stage policy → semantic repetition/emotion/distress/safety/strategy → LLM → validator → persisted events/alerts. The current working tree has removed backend TTS; responseAudioUrl is always null. Safety fallback language exists in the backend validator and is not patient-specific fabricated content.

## Endpoint matrix

Auth: D = patient-bound device JWT; C = caregiver Firebase token with patient authorization; D/C = dual-mode patient access. `P` below means `/patients/{patient_id}`. JSON unless specified. Status is the baseline before fixes.

| Feature | Frontend route | Required data | Existing endpoint / method | Request | Existing response format | Auth | Status |
|---|---|---|---|---|---|---|---|
| Patient profile | /home | preferred name, photo, language | GET P | path ID | PatientPublic: id, firstName?, preferredName, preferredLanguage, profilePhotoUrl? | D/C | NEEDS MODIFICATION |
| Generate pairing | caregiver patient overview | expiring one-use token | POST /pairing/{patient_id}/code; /pin | path ID | pairing_code/pin, expires_at | C (currently also family) | NEEDS MODIFICATION |
| Pair device | /onboarding/pairing | device session | POST /pairing/verify; /verify-pin | pairingCode or pin, deviceId | accessToken, refreshToken, patientId, patientPreferredName? | none | NEEDS MODIFICATION |
| Session validation | / startup | active device binding and patient | GET P; POST /auth/refresh | refreshToken, deviceId | profile / accessToken, refreshToken | D / refresh JWT | NEEDS MODIFICATION |
| Family list | /family | safe description, photo, phone, voice | GET P/family | path ID | FamilyMemberPublic[]: id,name,relationship?,photoUrl?,phoneAvailable,phoneNumber?,voiceMessageAvailable,voiceMessageUrl?,description? | D/C | NEEDS MODIFICATION |
| Family detail | /family/[id] | family fields + shared memories | GET P/family/{family_id} | path IDs | FamilyMemberPublic | D/C | NEEDS MODIFICATION |
| Memories | /memories | approved visible cards, categories | GET P/memories | category? (ignored for device currently) | PatientMemoryPublic[]: id,title,description?,imageUrl?,audioUrl?,associatedPeople[],displayDate? | D/C | NEEDS MODIFICATION |
| Memory detail | /memory/[id] | story, actual date, people, media | GET P/memories/{memory_id} | path IDs | PatientMemoryPublic; upload timestamp wrongly used as memory date | D/C | NEEDS MODIFICATION |
| Comfort | /comfort | real music, voices, photos, sounds | GET P/comfort | path ID | ComfortContentItem[]: id,type,title,mediaUrl?,imageUrl?,description?,durationSeconds? | D/C | NEEDS MODIFICATION |
| Voice conversation | /companion | transcript, reply, TTS, actions | POST /conversations/voice | multipart audio, patientId, conversationId? | conversationId,transcript,responseText,responseAudioUrl?,status,uiMode | D | NEEDS MODIFICATION |
| Text conversation | optional service | same safe pipeline | POST /conversations/text | patientId,conversationId?,text | ConversationResponse | D | READY |
| Cognitive recommendations | /activities | five types, stage policy | GET P/activities/recommended | path ID | ActivityRecommendation[]; only three descriptive types | D/C | NEEDS MODIFICATION |
| Play activity | /activity/[id] (missing) | prompt, choices, media, interaction mode | none | — | — | — | MISSING |
| Submit result | /activity/[id] (missing) | result,response,time,timestamp | POST P/activities/{activity_id}/result | outcome,notes? | 204 | incorrectly C plus D/C | NEEDS MODIFICATION |
| Help request | /help | stored event and caregiver alert | POST P/help | reason? | success,message?,timestamp? | D | NEEDS MODIFICATION |
| Emergency/family contacts | /help | configured service number + family contacts | GET P/help/contacts | path ID | caregiverName?,caregiverPhone?,caregiverAvailable?,emergencyPhone?,familyContactPhone?,familyContactName? | D | NEEDS MODIFICATION |
| Patient settings | /settings | text scale, motion, volume, language | no settings route; profile language only | — | device-local Zustand settings | — | MISSING |
| Home recommendation | /home | one explicitly selected safe action | none | — | — | — | MISSING |
| Caregiver content mutation | website profile/family/memories/consent | actual profile & media | POST/PUT P; POST/PUT P/family; POST/PUT P/memories; PUT P/consent; POST /media/upload | respective Pydantic schema; multipart type,file,patientId? | admin schemas / url,mediaType,fileName,sizeBytes | C | NEEDS MODIFICATION |

## Contract-first changes

Use transactional token consumption and active binding checks; enforce caregiver role for token generation. Centralize consent-aware patient projections and refresh only recognized, authorized Storage media URLs. Keep safe fields explicit. Add real activity detail/result service, settings and optional home recommendation. Add configured emergency-services number separately from personal emergency contacts. Add server TTS with explicit failure status; retain faster-whisper. UI renders only returned content/actions, with empty/error/offline/loading states.

## Page content map

| Page | Content and hierarchy |
|---|---|
| Welcome | GeriCare; “A familiar voice for brighter days.”; comfort/connection/support; orb and botanical decoration; Connect This Device; already connected Continue through startup validation |
| Pairing | Connect Your Device; caregiver instructions; real camera QR scan or eight-character code; Connect; Ask your caregiver |
| Home | local-time greeting + backend preferred name; reassurance; friendly orb + Talk to Me; Family/Memories/Comfort/Games/Help; optional backend recommendation |
| Companion | personal voice companion; single large orb, state wording, microphone; reply emphasized and transcript secondary; replay when audio exists; only backend actions |
| Family | People who love you; real photo/name/relationship/description; call and voice; empty state |
| Family detail | large photo, name/relationship, safe description; available voice/call; approved shared memories |
| Memories | Stories, places and cherished moments; actual category filters; image/title/short description cards |
| Memory detail | photo, title, optional caregiver date, story, known visible people; available story/voice/photos actions |
| Comfort | Familiar things that help you feel at ease; actual music/voice/sound/memory/photo sections; playback and image viewing |
| Games | Mind & Memory; five backend-supported types, only available data-backed recommendations; gentle feedback, no diagnosis |
| Activity detail | backend prompt/media/options or routine steps; submit real result; no invented challenges |
| Help | Notify Caregiver (success only on confirmation), Choose Family Member, configured emergency-services call; reassurance |
| More | Comfort, Games, Help, Settings |
| Settings | accessible text size, reduced motion, voice volume; backend profile language; explicit disconnect |

## Verification gates

TypeScript, lint, both frontend builds, backend unit/integration/API tests; no production patient fixtures. Live caregiver→Firestore/Storage→paired device, actual microphone→Whisper→LLM→TTS→playback, configured FCM delivery, and physical iOS/Android checks require a reachable configured test environment and device. Automated dependency-injected tests must never be reported as proof of these live flows.
