# Web portal API audit — before redesign

Inspected 10 September 2026, against current committed source. All endpoint paths below have
the `/api/v1` prefix; P = `/patients/{patient_id}`. Source: every `backend/app/api/v1` router,
dependencies, schemas/services/repositories, `website/app`, `website/src` and patient `src/services`.

## Architecture and authentication findings

- Website: Next 15.5.25 / React 19, App Router, Tailwind 3, shared components, Recharts,
  TanStack Query 5, Zustand, React Hook Form/Zod. Patient app: Expo 57 / Router / SecureStore.
- Firebase Admin verifies ID tokens; Firestore `users/{uid}.role` is authoritative. Existing
  caregiver ownership uses `primaryCaregiverId`; legacy family access uses `users.familyPatientIds`.
- Email/password login/signup is brokered through Identity Toolkit by FastAPI. Google uses
  Firebase client popup. Both store an ID token manually in localStorage, but password login
  does not establish a Firebase client session. Refresh endpoint only checks the same token;
  logout does not sign out the Firebase client. No global auth observer or actual dashboard guard.
- `UserProfile` returns **uid**, while website `User` declares **id**. Client `setRole` mutates
  application role locally. There is no family portal, family invitation or granular membership.
- Critical: linked family users can update patient stage/consent and access analytics, events,
  full family/memory records and live streams through shared authorization. Fix backend first.
- FastAPI → services → repositories → Firestore is established. Preserve existing patient
  endpoints and data. Firebase Storage metadata/signing and local faster-whisper already exist.
- Known live environment limits: Firestore works; Storage bucket absent, credentials cannot sign,
  TTS denied. These are deployment blockers, not reasons to insert replacement data.

## Endpoint matrix

Auth: C = caregiver with ownership; F = active family membership; D = paired device.
Response names refer to exact Pydantic schemas in `backend/app/schemas`.

| Feature | Frontend page | Required data | Existing endpoint | Method | Auth / current role | Existing response | Frontend expected | Status | Required change |
|---|---|---|---|---|---|---|---|---|---|
| Current user | All protected pages | Identity | /auth/me | GET | Firebase / any role | UserProfile(uid,email,role,name,avatarUrl) | User(id,...) | NEEDS_MODIFICATION | Map uid; authoritative bootstrap and observer |
| Role | Login / guards | Backend role | /auth/me | GET | Firebase | UserProfile.role | mutable local role | NEEDS_MODIFICATION | Remove client role mutation; guards |
| Login/signup | /login,/signup | Secure identity session | /auth/login,/signup,/google | POST | Public / Firebase | token,user | token,user | NEEDS_MODIFICATION | Preserve Firebase, use SDK persistence/refresh; portal redirects |
| Logout/reset | Settings/login | End session, reset | /auth/logout,/forgot-password | POST | User/public | 204 / success,message | matches | NEEDS_MODIFICATION | Sign out SDK and clear all patient caches |
| Accessible patients | Dashboard,Patients | Authorized list | /patients | GET | C | PatientAdmin[] | Patient[] | NEEDS_MODIFICATION | Safe family listing separately |
| Patient profile | Patient tabs | Identity/biography/care | P | GET | D/C/F currently | PatientPublic or PatientAdmin | Patient | NEEDS_MODIFICATION | Block family admin projection; media renewal |
| Create patient | Patients/new | Full caregiver form | /patients | POST | C | PatientAdmin | Patient | READY | Preserve; connect content stages after create |
| Update/archive | Profile | Editable fields | P | PUT/DELETE | any linked user / C | PatientAdmin / 204 | Patient | NEEDS_MODIFICATION | Caregiver-only update |
| Patient status | Dashboard | Current state/counts | P/status | GET | any linked user | PatientStatusResponse | PatientStatus | NEEDS_MODIFICATION | C only; add aggregate dashboard contract |
| Patient events/history | Dashboard,Companion | Real events | P/events | GET | any linked user | ConversationEvent[] | ConversationEvent[] | NEEDS_MODIFICATION | C only; include actual activity history separately |
| Family list/detail | Care Content,Profile | Family records | P/family,/{id} | GET | D/C/F currently | FamilyMember / Public | FamilyMember | NEEDS_MODIFICATION | C/D only; safe family portal separately |
| Family mutation | Care Content,Profile | Photos/contact/voice | P/family,/{id} | POST/PUT/DELETE | any linked user | FamilyMember / 204 | FamilyMember | NEEDS_MODIFICATION | C management; scoped family contributions |
| Memories/detail | Care Content,Profile | Media/permissions | P/memories,/{id} | GET | D/C/F currently | MemoryResponse / PatientMemoryPublic | Memory | NEEDS_MODIFICATION | Explicit selected family allow-list; safe family projection |
| Memory mutation | Care Content,Profile | Story/media flags | P/memories,/{id} | POST/PUT/DELETE | any linked user | MemoryResponse / 204 | Memory | NEEDS_MODIFICATION | C management; family submissions pending approval |
| Comfort | Care Content | Music/sounds/voices/photos | P/comfort | GET | D/C/F | ComfortContentItem[] | No web service | NEEDS_MODIFICATION | Reuse memory/family CRUD and shared projections |
| Routine | Profile Care & Routine | Ordered steps/preferences | P | GET/PUT | linked/C | PatientAdmin.routines,dailyRoutine | Patient | READY | Use existing backend fields |
| Cognitive activities | Care Content Activities | Availability/enablement | P/activities/recommended,/{id} | GET | D/C/F | ActivityRecommendation[],ActivityDetail | no web service | NEEDS_MODIFICATION | Caregiver configuration and results endpoint |
| Activity result | Activities | Stored engagement | P/activities/{id}/result | POST | D/C/F | ActivityFeedback | patient service matches | NEEDS_MODIFICATION | Restrict; add C GET results |
| Live companion | Companion | Structured interaction | P/live-status | GET | any linked user | PatientLiveStatusResponse | LiveCompanionStatus | NEEDS_MODIFICATION | C only; preserve polling |
| Live stream | Companion | Live events | P/realtime,P/live-ws,/alerts-ws | GET/WS | any linked user | status/events | same | NEEDS_MODIFICATION | C only; revalidate stream access |
| Repetition | Insights | Stored repetition summaries | P/analytics/repetition,/frequent-topics | GET | linked user | RepetitionAnalyticsResponse,RepeatedTopicItem[] | same | NEEDS_MODIFICATION | C only |
| Distress | Insights | Real observations | P/analytics/distress,/distress-trend | GET | linked user | DistressAnalyticsResponse,DistressTrendPoint[] | same | NEEDS_MODIFICATION | C only; preserve no-data nulls |
| Behaviour patterns | Insights | Hourly observations | P/analytics/patterns,/strategies | GET | linked user | PatternAnalyticsResponse,StrategyEffectivenessItem[] | same | NEEDS_MODIFICATION | C only |
| Alerts | Alerts | Real alert records | /alerts,/{id} | GET | linked users | AlertResponse[] / item | Alert | NEEDS_MODIFICATION | C only; separate safe family notifications |
| Alert acknowledge/resolve | Alerts | Status transition | /alerts/{id}/acknowledge,/resolve | POST | linked users | AlertResponse | Alert | NEEDS_MODIFICATION | C only |
| Consent | Patient Privacy | Actual consent flags | P/consent | GET/PUT | linked users | ConsentSettings | same | NEEDS_MODIFICATION | C only; expose canonical biography/direct-mention/visibility settings |
| Device | Patient Device,Settings | Bindings/status/revoke | none (devices stored) | — | — | — | none | MISSING | Device list, heartbeat and revoke |
| Pairing code/QR | Patient Device | Actual token/expiry | /pairing/{id}/code,/pin | POST | C | pairing_code/pin,expires_at | matches | NEEDS_MODIFICATION | Record issuer; existing QR maintained |
| Pair verification | Patient onboarding | Bound JWT session | /pairing/verify,/verify-pin | POST | Public | PairingVerifyResponse | matches | READY | Preserve atomic reservation/consumption |
| Media upload | Content/Family | Stored media URL | /media/upload | POST multipart | linked users | MediaUploadResponse | same | NEEDS_MODIFICATION | C upload or explicit F permission; signing config blocked |
| User preferences/profile | Settings | Name/notifications/language | none | — | — | — | local UI only | MISSING | Persist user settings and profile |
| Family invitations/access | Family login,Privacy | Expiring email-bound grant | none | — | — | — | none | MISSING | Atomic invite acceptance and active permission membership |
| Family portal content | Family pages | Safe profile/memories/suggestions | none safe | — | — | — | none | MISSING | Dedicated safe projections and pending contributions |

## Patient app compatibility

The patient app calls GET P, P/family, P/family/{id}, P/memories, P/memories/{id}, P/comfort,
P/activities/recommended, P/activities/{id}, P/settings, P/recommendation; PUT P/settings;
POST P/activities/{id}/result, P/help, /conversations/voice, /pairing/verify and /auth/refresh.
All remain valid. Caregiver/family contributions write the **same** memory/family/profile records;
patient visibility and AI approval gate exposure. New activity enablement must be enforced in
the existing activity service, not just the website. Patient data refresh already uses focus/polling.
