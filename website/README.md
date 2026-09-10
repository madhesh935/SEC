# GeriCare AI — Caregiver & Family Portal

Production-quality healthcare web platform supporting professional caregivers and authorized family members of dementia patients.

---

## 1. Overview & Purpose

**GeriCare AI** is an intelligent, compassionate healthcare platform designed to support individuals living with Alzheimer's disease and related dementias. 

The **Caregiver & Family Portal** functions as the central management and telemetry dashboard. It empowers authorized caregivers and family circles to:
- Monitor live conversational companion interactions and acoustic distress signals in real time.
- Manage the **Personal Memory Engine**, cataloging life stories and photographs to ground patients during periods of disorientation.
- Onboard and coordinate family members for reassuring voice note messages.
- Review 24-hour behavioural patterns and recurring evening distress trends.
- Enforce strict legal consent guardrails and granular data privacy controls.

---

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router, Server & Client Components)
- **Language**: Strict TypeScript (zero `any` types)
- **Styling**: Tailwind CSS configured with an emotionally warm healthcare palette
- **Design System**: shadcn/ui pattern, Lucide React icons
- **State Management**:
  - **Server State**: `@tanstack/react-query` with centralized cache keys, polling, and invalidation
  - **Client State**: `zustand` for lightweight session, active patient, and UI drawers
- **Form Validation**: `react-hook-form` + `zod`
- **Data Visualization**: `recharts` for distress trajectories, repetition charts, and 24-hr distributions
- **Networking**: Centralized `axios` client with request/response interceptors, 30s timeout, and 401 redirect
- **Cloud & Realtime**: Firebase Client SDK abstraction (Auth, Firestore, Storage) and WebSocket streaming

---

## 3. Visual & Healthcare Design System

The portal follows an intentional healthcare SaaS design language:
- **Warm White Background**: `#FAF9F6` for visual calmness and reduced eye fatigue
- **Muted Teal**: Primary identity (`#0F766E`, `#14B8A6`) representing clinical reliability and empathy
- **Soft Blue & Light Mint**: Informational accents and reassurance states
- **Subtle Lavender**: Secondary cognitive and memory indicators
- **Dark Navy Text**: High-contrast, accessible typography (`#0F172A`)
- **Restricted Urgent Red**: Alert red is strictly reserved for high and urgent safety escalations
- **Layout**: Rounded cards (`rounded-2xl`), subtle shadows (`shadow-soft`), and spacious, uncluttered layouts

---

## 4. Folder Structure

```text
website/
├── app/
│   ├── layout.tsx                               # Global layout with QueryProvider & NotificationCenter
│   ├── page.tsx                                 # Root redirect to /dashboard
│   ├── globals.css                              # Tailwind tokens and healthcare theme variables
│   ├── login/
│   │   └── page.tsx                             # Caregiver & family sign-in screen
│   ├── dashboard/
│   │   ├── layout.tsx                           # Authenticated shell (collapsible sidebar + navbar)
│   │   ├── page.tsx                             # Overview dashboard (5 primary status cards & charts)
│   │   ├── patients/
│   │   │   ├── page.tsx                         # Patient directory with client/server search
│   │   │   ├── new/
│   │   │   │   └── page.tsx                     # 10-step patient onboarding wizard
│   │   │   └── [patientId]/
│   │   │       ├── page.tsx                     # Patient 360 profile (overview, biography, care)
│   │   │       ├── family/
│   │   │       │   └── page.tsx                 # Family circle management & voice clips
│   │   │       ├── memories/
│   │   │       │   └── page.tsx                 # Personal memory management & sensitive controls
│   │   │       ├── live/
│   │   │       │   └── page.tsx                 # Live companion session viewer
│   │   │       ├── repetition/
│   │   │       │   └── page.tsx                 # Repetition analytics & inquiry catalog
│   │   │       ├── distress/
│   │   │       │   └── page.tsx                 # Emotion & distress signal trajectories
│   │   │       ├── patterns/
│   │   │       │   └── page.tsx                 # 24-hr behaviour & evening patterns
│   │   │       ├── connection/
│   │   │       │   └── page.tsx                 # Family connection hub & conversation prompts
│   │   │       └── consent/
│   │   │           └── page.tsx                 # Granular privacy and legal consent toggles
│   │   ├── alerts/
│   │   │   ├── page.tsx                         # Alerts center with severity filtering
│   │   │   └── [alertId]/
│   │   │       └── page.tsx                     # Alert detail, action log, and resolution
│   │   ├── settings/
│   │   │   └── page.tsx                         # Caregiver preferences, notifications, security
│   │   └── profile/
│   │       └── page.tsx                         # Authenticated user details & portal role
│
└── src/
    ├── components/
    │   ├── ui/                                  # Accessible design system (Button, Input, Card, Modal...)
    │   ├── layout/                              # Sidebar, TopNavbar, PatientSelector, NotificationCenter
    │   ├── dashboard/                           # DistressTrendChart, RecentEventsList, MetricCard...
    │   ├── patient/                             # PatientCard, PatientAvatar, StepWizard
    │   ├── memories/                            # MemoryCard, MemoryPermissionPanel, AddEditMemoryModal
    │   ├── family/                              # FamilyMemberCard, AddEditFamilyModal
    │   ├── media/                               # MediaUploader, ImageUploader, AudioUploader
    │   ├── alerts/                              # AlertCard, AlertBanner
    │   └── states/                              # LoadingState, EmptyState, ErrorState, StatusBadge...
    ├── services/                                # Centralized Axios & Realtime API services
    │   ├── api.ts                               # Base Axios instance with auth interceptor
    │   ├── auth.service.ts
    │   ├── patient.service.ts
    │   ├── memory.service.ts
    │   ├── family.service.ts
    │   ├── conversation.service.ts
    │   ├── analytics.service.ts
    │   ├── alert.service.ts
    │   ├── consent.service.ts
    │   ├── media.service.ts
    │   └── realtime.service.ts                  # Live companion & alert subscriptions
    ├── hooks/                                   # TanStack Query & state hooks
    ├── types/                                   # Strict TypeScript interfaces (no any)
    ├── schemas/                                 # Zod validation schemas
    ├── store/                                   # Zustand stores (auth, patient, ui)
    ├── constants/                               # Routes, roles, navigation items
    ├── utils/                                   # cn, formatters, validation
    └── theme/                                   # Color tokens and theme constants
```

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js 18.18+ or 20+ (tested on Node v24)
- npm 9+

### Setup
```bash
# Navigate to the website directory
cd website

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env.local

# Run development server
npm run dev

# Check strict TypeScript types
npm run check-types

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 6. Environment Configuration

The frontend requires only client-safe public variables. **Never embed secret service keys, Firebase Admin credentials, or LLM keys in the frontend environment.**

Create `.env.local` based on `.env.example`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 7. Strict No-Mock-Data Architecture

The portal strictly adheres to real backend data handling:
1. **Loaded State**: When the backend returns collections or models, they are rendered in typed components.
2. **Empty State**: When the backend returns an empty array or no active session (e.g. no patients registered, no active alerts, no conversation in progress), supportive, accessible empty cards are displayed (*"No patient profiles have been created yet"*, *"No active conversation right now"*, *"No active alerts"*).
3. **Error / Unavailable State**: If network drops or the server is unavailable, the UI surfaces *"We couldn't load this information right now"* with clear Retry actions.
4. **Zero Hardcoding**: Zero dummy patients (Raman, Priya), zero fabricated charts, zero synthetic metrics.

---

## 8. Role-Based Access Control (RBAC)

The portal supports three distinct roles:
- `caregiver`: Full patient management, memories, safety alerts, telemetry analytics, and consent configuration.
- `family`: Access to approved memories, family connection prompts, and voice note recordings.
- `admin`: System-level views and clinical audits.

*Security Notice*: While frontend guards tailor navigation and viewability, all data access, Firestore mutations, and API endpoints are strictly enforced server-side.

---

## 9. Backend & AI Engine Integration Points

The web frontend acts as a responsive, human-centered interaction layer. The AI engines run exclusively on the backend:
- **FastAPI Core**: RESTful API handling patient models, consent records, and CRUD operations.
- **Personal Memory Engine**: RAG vector store indexing family memories and retrieving relevant grounding contexts.
- **Repetition Engine**: Analyzes conversation transcripts for repetitive questions.
- **Emotion & Distress Engine**: Observes vocal acoustic tension and flags distress spikes.
- **Stage Guidance**: Caregiver/clinician configured dementia stage (Early, Mid, Late) determining conversational pacing.
- **ElevenLabs Speech Generation**: Generates soothing synthetic speech based on selected response strategies.

---

## 10. License

This project is licensed under the MIT License.
