# Web portal content map — before UI implementation

Navigation is role-specific. `/caregiver/*` is the manager portal, `/family/*` the connection
portal. Existing `/dashboard/*` links remain protected compatibility routes. Login pages sit
outside protected layouts. Backend roles and active membership permissions determine access.

| Page | Content hierarchy | Source/actions |
|---|---|---|
| Caregiver login/signup | GeriCare brand; clarity/insights/memories/safety message; labeled email/password; Google; reset; signup | Firebase SDK identity, backend role exchange |
| Family login/signup | Warm connection message; email/password/Google; invitation field; access explanation | Firebase SDK identity; email-bound invitation; backend role |
| Caregiver Dashboard | Local-time greeting and real user; patient selector; patient hero; four summary cards (state, conversations today, repeated topics, active alerts); real trend; active alerts; activity; max five quick actions | Backend dashboard aggregate; profile; analytics; events; deep links |
| Patients | Search; create; real profile cards with identity/stage/language/last active | Patient list; no-profile empty state |
| Create Patient | Basic Information → Care Context → Biography → Routine → Family → Memories → Comfort → Emergency Contacts → Consent → Review → backend create | Existing patient schema; real content added after creation before pairing; explicit save errors |
| Patient Overview | Photo/name/age/stage/language; profession/hometown/education/hobbies/topics/life events | GET patient; edit/archive caregiver actions |
| Patient Care & Routine | Communication/support preferences; routines; caregiver identity; emergency contacts | Existing edit form and backend update |
| Patient Family | Photo/name/relation/priority/voice/visibility; add/edit/remove/upload; invite family account | Existing CRUD plus invitation permissions |
| Patient Memories | Gallery/categories; permissions/sensitivity; edit/delete/uploads/approve pending submissions | Same memory collection used by patient app |
| Patient Privacy | Biography, memory/photo/voice, AI conversation/direct mentions, patient visibility, family scope, escalation; membership permissions/revoke | Consent and membership endpoints; no global patient privacy settings |
| Patient Device | Bound devices, last seen/connection; revoke; actual one-use code+QR with expiry | Device API; existing real pairing API |
| Companion | Selected patient/device status; meaningful ready/idle state; recent transcript and AI response; observed intent/emotion/repetition/memory/strategy/escalation; recent history | Existing structured pipeline outputs only; no hidden reasoning |
| Care Content | Tabs Family / Memories / Comfort / Activities | Family/memory editors reused; comfort maps music/sounds/voice/photos; activities enablement and real result history |
| Insights | Tabs Overview / Repetition / Distress / Patterns | Existing backend analytics arrays, observed counts and no-data states; small non-diagnostic notice |
| Alerts | Active / Acknowledged / Resolved / All; severity/patient/time/reason/context; view/acknowledge/resolve | Actual alert endpoints; role authorization |
| Caregiver Settings | Profile / Notifications / Security / Language / Devices | Backend preferences/profile; Firebase reset/signout; selected patient device links |
| Family Home | Greeting; authorized loved-one selector/summary; approved recent memories; permitted contribution actions; backend connection suggestions | Safe family API, membership permissions |
| Family Loved One | Photo/preferred name/relationship; authorized interests and biography; caregiver contact | Explicit safe family profile; no diagnosis/stage/private analytics |
| Family Memories & Voices | Approved shared content and own submissions with review status; allowed memory/photo/voice form | Backend permission checks; submissions hidden from patient/AI until approved |
| Family Connection | Backend suggestions; approved memories/photos/voices; contact caregiver | Approved content and backend recommendations; no locally invented topics |
| Family Notifications | Safe actual approval/contribution notifications; empty if none | Dedicated family-safe notifications; no caregiver safety alert reuse |
| Family Settings | Profile/notification/language/security; active membership permission summary; sign out | Backend preferences and membership |

Shared visual system: warm off-white surfaces, deep navy type, teal primary controls, mint/blue/
lavender/peach accents, restrained botanical detail, 12–16px cards, 16px body text, visible focus,
44px controls, responsive/collapsible navigation and scroll-safe tables. Caregiver is structured
and operational; family is warmer and simpler. Use generic initials/icons for missing images.

Every query section separates loading, empty, error, unauthorized and offline. Do not turn errors
into zero metrics. Patient switching cancels/removes patient query data before showing another
patient. No page generates patient biography, charts, recommendations, alerts or conversations.
