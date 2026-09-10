# GeriCare patient integration verification

Updated 10 September 2026. Implementation and automated checks are complete for the routes
below. **Live acceptance is not complete:** Storage and TTS configuration block the full
caregiver-to-patient media/voice flow, and no browser or physical device is connected for UI testing.
The [initial endpoint audit and content map](patient-endpoint-audit.md) records the source inspection
before implementation.

## Screen integration matrix

All endpoint paths below begin with `/api/v1`; `P` means `/patients/{patient_id}`.
“Connected” means the implemented service uses that real backend route; it is not a live acceptance claim.
Data rows use authenticated HTTP tests with test-only repositories/provider boundaries. No production
screen or endpoint substitutes test content when Firestore is empty or unavailable.

| Screen | Backend endpoint | Connected? | Real data source? | Empty state? | Error / offline state? | Loading state? |
|---|---|---|---|---|---|---|
| Welcome | Startup checks secure session | Yes | No patient content here | Unpaired welcome | Startup retry | Startup status |
| Device Pairing | POST /pairing/verify; caregiver POST /pairing/{id}/code | Yes | Server token and bound profile | Empty code input | Validation, connection failure; global offline status | Connect busy state |
| Home | GET P; GET P/recommendation | Yes | Patient profile; approved recommendation | Recommendation omitted if null | Profile retry / offline | Orb and skeletons |
| Companion | POST /conversations/voice | Yes | Recorded audio, local Whisper, backend engines/LLM, server TTS | Idle invitation | Permission, upload, timeout, STT/LLM, TTS, playback, offline | Uploading / processing orb |
| Family | GET P/family | Yes | Visible family records | Caregiver-add message | Retry / offline; call/audio failure | Orb and skeletons |
| Family Detail | GET P/family/{id}; GET P/memories | Yes | Visible relative and associated memories | Missing fields/actions omitted | Retry / offline; shared-memory retry | Orb and skeletons |
| Memories | GET P/memories | Yes | Approved patient-visible memories | Caregiver-add message | Retry / offline | Orb and skeletons |
| Memory Detail | GET P/memories/{id} | Yes | Story, caregiver display date, permitted media and people | Unavailable actions omitted | Retry / offline; image/audio failure | Orb, skeletons, image status |
| Comfort | GET P/comfort | Yes | Approved memory media and consented family voice | Caregiver-add message | Retry / offline; image/audio failure | Orb and skeletons |
| Mind & Memory | GET P/activities/recommended | Yes | Approved family/memory/biography/routine/music | No activities message | Retry / offline | Orb and skeletons |
| Activity Detail | GET P/activities/{id}; POST P/activities/{id}/result | Yes | Current authorized challenge; stored result | Unavailable source returns 404 | Retry / offline; result-save and audio failure | Orb; submission status |
| Help & Support | POST P/help; GET P/help/contacts | Yes | Stored event + caregiver alert; configured contacts | Missing emergency number explained | Retry / offline; notification failure and call failure | Contact skeleton; request status |
| More | Local links to implemented routes | Yes | Navigation only | Not applicable | Not applicable | Not applicable |
| Settings | GET/PUT P/settings; GET P | Yes | Backend settings and profile language | Backend accessibility defaults | Retry / offline; save failure | Orb; save status |

## Contract and security changes

- One-time pairing tokens are reserved and consumed in Firestore transactions. Verification
  checks expiry, active patient and active device binding. Caregiver role and patient authorization
  are required to generate codes; verification limits both device and source IP attempts.
- Native sessions use Expo SecureStore. Browser preview tokens are memory-only, and old plaintext
  browser credentials are removed. Temporary refresh/network failures preserve the pairing.
  Invalid sessions clear patient query caches and conversation state.
- Patient projections are centralized in `PatientContentService`: consent, approval, visibility,
  safe descriptions, associated people, and authorized Storage URL renewal. Clinical fields,
  private notes, scores, embeddings and internal flags are excluded.
- New settings, recommendation, activity detail and result routes follow service/repository boundaries.
  Backend-selected contextual actions are the only contextual actions shown by the companion.
- Zod parses every patient API response in service modules. HTTP response fixtures are compared
  directly against frontend schemas; no per-component guessed field fallbacks.
- Screens refetch on focus and every 60 seconds while active; returning to the foreground refetches
  stale data. Text size and reduced-motion preferences apply from the backend throughout the app.
- Games use current source records and configured stage. Mid/late-stage policies avoid memory
  testing; results never update or diagnose dementia stage. Music navigation is backend-provided.
- Help events contain no invented distress measurement. Failed push delivery is distinguished from
  a saved caregiver alert. Empty caregiver analytics no longer create a zero distress score or 24
  fabricated hourly observations.

## Automated verification

| Check | Result |
|---|---|
| Patient TypeScript | Pass |
| Caregiver TypeScript | Pass |
| Patient ESLint | Pass, no warnings |
| Caregiver ESLint | Pass, existing unused-import/variable warnings |
| Backend Ruff | Pass |
| Backend unit + HTTP/API integration tests | 67 passed; dependency deprecation warnings only |
| Frontend/backend serialized contract tests | 17 passed |
| Expo SDK dependency compatibility | Pass, SDK 57 dependencies current |
| Caregiver Next production build | Pass |
| Android Hermes export | Pass, separate export with two workers |
| iOS Hermes export | Pass, separate export with two workers |
| Patient web export | Pass |

The simultaneous all-platform Hermes export crashed on this Windows host. Separate native
exports with `--max-workers 2` succeeded. `build:android` and `build:ios` reproduce that setting.
These are JavaScript/Hermes exports, **not** signed native binaries or device execution tests.

Test coverage includes caregiver-created content flowing through device-authorized routes,
consent revocation, hidden content, patient isolation, pairing reuse/expiry/rate limits, token
reservation collisions, personalized challenge/results, media URL renewal scope, real response
serialization, help persistence and notification failure, consent before STT, and STT/LLM/TTS
failure handling. Provider and database boundaries are replaced only in tests; physical microphone,
real provider calls, Storage playback and FCM delivery are not established by these tests.

Regenerate test-only HTTP contract fixtures from `backend`:

```powershell
$env:GERICARE_CONTRACT_FIXTURE='../tests/fixtures/backend-contracts.json'
.\.venv\Scripts\python.exe -m pytest tests/integration/test_patient_api.py::test_export_patient_response_contracts -q
```

Then run `npm run test:contracts` at the project root.

## Live runtime checks and remaining acceptance

`backend/scripts/check_patient_runtime.py` ran against the configured project using existing
Google application default credentials. No patient data was printed, no test patient was created,
and no caregiver notification was sent.

| Live capability | Observed result |
|---|---|
| Firestore read | Successful |
| Configured service-account file | Missing |
| Existing Google credentials | Available, but cannot sign private media URLs |
| Configured Storage bucket | Not found; project bucket listing returned no buckets |
| Private media URL generation | Fails because credentials cannot sign |
| Cloud Text-to-Speech | HTTP 403 PERMISSION_DENIED; no audio returned |
| Browser UI surface | None connected |
| Physical microphone, speaker, camera and phone dialer | Not tested |

To finish acceptance, configure a provisioned Storage bucket, backend credentials that can sign
private URLs, and authorized Cloud Text-to-Speech access. Supply a test caregiver session in a
connected browser and an Expo-compatible device. Then perform the full caregiver create/upload/
consent/pair flow, real recording through Whisper and LLM to TTS playback, help alert/notification
delivery, small/large phone and tablet visual comparison, screen-reader and reduced-motion checks.
Do not describe this application as release-verified until those checks pass.

## Production data audit

Searched production app/source/backend/website paths for the supplied example names, mock,
dummy, fake, samplePatient, demoPatient, fakeFamily, fakeMemory, Math.random, placeholder chart,
and sampleGame. No fabricated production patient records, photos, conversations, challenges or
metrics remain. Remaining keyword hits are explanatory comments and the pytest-mock test dependency.
Test data is confined to `backend/tests` and `tests/fixtures`. Orb and botanical artwork are
generic SVG components, and patient-specific images come only from API data.

The reference has been implemented through real interactive components: ivory surfaces, navy
text, teal actions, soft pastel cards, botanical leaves, large readable labels and a gentle orb.
No browser was available for screenshots, so pixel-level matching, clipping and responsive visual
acceptance remain unverified rather than marked as passed.
