# Web portal — final integration matrix

Verified 10 September 2026 against the working tree (uncommitted). Cross-checked against
`WEB_PORTAL_API_AUDIT.md` (pre-redesign findings) and `WEB_PORTAL_CONTENT_MAP.md` (required
content). Verification method: full read of every new/changed backend route, service and
repository; full read of every new portal page/component; `pytest` (92/92 pass); `tsc --noEmit`
on both `website` and the patient app (0 errors); live smoke test of every `/caregiver/*` and
`/family/*` route against the running dev servers (all 200). No live browser click-through was
performed in this pass — see "Not yet verified" at the end.

## Architecture delivered

- Two portals under `/caregiver/*` and `/family/*`, each wrapped by a single `PortalShell`
  (`website/src/components/portal/PortalShell.tsx`) that: redirects unauthenticated users to the
  matching `/login`, blocks cross-portal access ("This account belongs to a different portal"),
  drives the patient selector from real backend data, and cancels + evicts the previous patient's
  cached queries before a switch completes (privacy requirement, Phase 9).
- `AuthProvider` (`website/src/components/portal/AuthProvider.tsx`) is a real Firebase
  `onIdTokenChanged` observer: clears the query cache and resets the selected patient on identity
  change, refreshes the backend profile on every token change, surfaces backend/network errors
  instead of silently failing.
- Old `/dashboard/*` tree preserved as compatibility routes, now rendered through the same
  `PortalShell role="caregiver"`; `/` redirects to `/caregiver`.
- Backend: new `backend/app/api/v1/portal.py` router (session exchange, user preferences/profile,
  family invitations, family-access grants, device list/heartbeat/revoke, dashboard aggregate,
  activity management, family-safe patient/memory/connection/notification projections) registered
  in `app/api/router.py`.
- Security fixes from the pre-redesign audit are in: `alerts.py`, `realtime.py` (SSE + both
  WebSockets now re-check `require_caregiver_role`/`require_patient_access` on every poll
  iteration, not just at connect), and `media.py` now require caregiver ownership or an explicit
  family permission + matching consent flag, closing the "family can reach caregiver-only data"
  finding.

## Page-by-page status

| Page | Route(s) | Backend | Real data | Loading/Empty/Error | Permission enforcement | Test coverage |
|---|---|---|---|---|---|---|
| Caregiver login/signup | `/caregiver/login`, `/caregiver/signup` | Firebase SDK + `/auth/session`, `/auth/caregiver-registration` | Yes | Yes | Backend role check on session exchange | `test_patient_api.py` (auth paths) |
| Family login/signup | `/family/login`, `/family/signup` | Firebase SDK + `/auth/session` (invitation token) | Yes | Yes | Invitation is email-bound, one-time, expiring, rejects issuer/patient-archived/already-caregiver cases | `test_family_invitations.py` (5 cases) |
| Caregiver Dashboard | `/caregiver` | `GET /patients/{id}/dashboard` | Yes | Yes (`DataState`) | `authorize_patient_access` (caregiver-only) | manual (dashboard aggregate is new; no dedicated unit test yet) |
| Patients | `/caregiver/patients` | `GET /patients` | Yes | Yes | Caregiver-owned list only | existing patient tests |
| Create Patient | `/caregiver/patients/new` | `POST /patients` + existing family/memory/comfort/consent endpoints | Yes | Yes | Caregiver-only | existing patient tests |
| Patient Overview/Care&Routine/Family/Memories/Privacy/Device | `/caregiver/patients/[id]`, `/edit` | `GET/PUT /patients/{id}`, `/family`, `/memories`, `/consent`, `/patients/{id}/devices`, `/pairing/{id}/code` | Yes | Yes | Caregiver ownership; family-access grants editable per-membership | `test_pairing_transactions.py`, `test_consent_service.py`, `test_patient_media.py` |
| Companion | `/caregiver/companion` | `GET /patients/{id}/live-status`, realtime SSE/WS | Yes, structured fields only (no prompt/embedding/key leakage - verified by grep) | Yes | Caregiver-only, re-checked per poll tick | `test_orchestrator_safety.py` (pipeline), realtime access re-check is new (no dedicated test) |
| Care Content (Family/Memories/Comfort/Activities) | `/caregiver/care-content` | Family/memory CRUD, `GET/PUT /patients/{id}/activity-management`, `/activity-results` | Yes | Yes | Caregiver-only | existing family/memory tests |
| Insights (Overview/Repetition/Distress/Patterns) | `/caregiver/insights` | `/analytics/repetition`, `/distress`, `/patterns`, trend/strategy endpoints | Yes, includes required non-diagnostic notice verbatim | Yes (`test_empty_analytics.py` covers empty-state contracts) | Caregiver-only | `test_empty_analytics.py` |
| Alerts | `/caregiver/alerts` | `/alerts`, `/alerts/{id}/acknowledge`, `/resolve` | Yes | Yes | Caregiver-owned patients only (family removed from `_authorized_patient_ids`) | existing alert tests |
| Caregiver Settings | `/caregiver/settings` | `GET/PUT /users/me/preferences`, `/users/me/profile`, `/patients/{id}/devices` | Yes | Yes | Own account only | none dedicated (thin CRUD) |
| Family Home | `/family` | `GET /family/patients` | Yes | Yes | `family_user` dependency (role check) | none dedicated |
| Family Loved One | `/family/loved-one` | `GET /family/patients/{id}` | Yes, explicitly safe projection (no stage/consent/private analytics fields in `FamilyPatient` schema) | Yes | Membership-scoped | none dedicated |
| Family Memories & Voices | `/family/memories` | `GET/POST /family/patients/{id}/memories` | Yes, contributions marked `pending` until caregiver approval | Yes | Permission-gated (`contributeMemory`) | none dedicated |
| Family Connection | `/family/connection` | `GET /family/patients/{id}/connection` | Yes | Yes | Membership-scoped | none dedicated |
| Family Notifications | `/family/notifications` | `GET /family/patients/{id}/notifications` | Yes | Yes | Membership-scoped, separate from caregiver alerts | none dedicated |
| Family Settings | `/family/settings` | `GET/PUT /users/me/preferences`, `/users/me/profile`, `GET /patients/{id}/family-access` (own grant) | Yes | Yes | Own account + own membership only | none dedicated |

## No-mock audit (Phase 24)

Repo-wide search for `Raman|Priya|Lakshmi|Arjun|samplePatient|fakePatient|demoPatient|dummyFamily|
sampleMemory|sampleFamily|Math.random()|placeholderAlert|mock|dummy|hardcoded` returned no matches
in `website/` or `backend/` production source. No fabricated chart arrays found in any portal
component (`CaregiverDashboard`, `CareContent`/`Insights`) - all use `useQuery` against real
endpoints.

## Verified this pass

- `pytest tests -q` → 92 passed (up from 36 before this redesign; new coverage includes family
  invitation atomicity/expiry/one-time-use, consent gating, empty-analytics contracts).
- `tsc --noEmit` on `website/` → 0 errors.
- `tsc --noEmit` on the patient app (`src/`, `app/`) → 0 errors.
- Every `/caregiver/*` and `/family/*` route returns HTTP 200 against the running dev servers.
- Patient app change is minimal and additive: a `patientService.heartbeat()` call on
  `app/_layout.tsx` mount/foreground, powering the new Device tab's connected/last-seen state -
  no changes to patient-facing screens or contracts.

## Not yet verified (recommended before sign-off)

- **Live browser click-through** of the full Phase 11/12 end-to-end flows (signup → create patient
  → pairing QR → scan from the actual patient app → family invitation accept → contribution →
  caregiver approval). Everything below that layer (endpoints, schemas, consent gating, cache
  invalidation) is verified; the actual UI interaction sequence has not been driven by hand in
  this pass.
- Dashboard aggregate (`/patients/{id}/dashboard`), Companion realtime re-auth, and every family
  portal endpoint are new and pass type/contract checks but have no dedicated unit test yet -
  worth adding before this ships.
- Firebase Storage bucket/signing is a known deployment gap (noted in the API audit) - photo/voice
  upload UI is wired correctly but will surface a real backend error until Storage is configured
  in the live environment.
