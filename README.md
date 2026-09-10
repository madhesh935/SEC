# GeriCare AI — Patient Companion Mobile App

A production-quality, voice-first mobile companion application built for seniors and patients with cognitive support needs. Designed with a calm healthcare aesthetic, accessible touch targets, empathetic voice interactions, and strict patient safety safeguards.

---

## 1. Product Overview & Purpose

**GeriCare AI** is an assistive healthcare mobile application designed for care facilities and home use. It pairs a dedicated tablet or phone with a patient profile managed by caregivers via the GeriCare web dashboard.

### Core Pillars
* **Voice-First Interaction**: Natural speech processing with low cognitive load; seniors speak naturally and receive gentle, comforting vocal responses.
* **Familiarity & Comfort**: Immediate access to family photographs, recorded voice notes, soothing music, and cherished life memories.
* **Calm Healthcare Design**: Built with warm whites, soft mints, muted teals, soft blues, and dark navy typography with high contrast and zero overwhelming flashing or fast animations.
* **Strict Patient Safety**: No exposure of internal AI confidence scores, hallucination flags, dementia stage classification, or clinical diagnosis to the patient.
* **Zero Mock Data in Production**: Content originates exclusively from authenticated backend services or transitions gracefully into compassionate empty/offline states.

---

## 2. Technology Stack

* **Mobile Framework**: React Native (0.86.3) & Expo SDK (57.0.21)
* **Routing**: Expo Router (57.0.20) with typed file-based navigation
* **Language**: Strict TypeScript (`strict: true`)
* **Styling**: NativeWind (Tailwind CSS v3.4 for React Native)
* **Server State**: TanStack Query (`@tanstack/react-query` v5)
* **Client / UI State**: Zustand (v5)
* **HTTP Client**: Axios with JWT interceptors, auto 401 token refresh, and standardized error normalization
* **Forms & Validation**: React Hook Form with Zod schemas
* **Hardware & Device Modules**:
  * `expo-audio` (Audio recording & playback)
  * `expo-secure-store` (Hardware-backed encrypted session management)
  * `expo-image` (High-performance caching & blurhash placeholders)
  * `expo-haptics` (Tactile feedback for motor accessibility)
  * `expo-linear-gradient` (Subtle atmospheric companion orb rendering)
  * `@react-native-community/netinfo` (Real-time network and offline detection)
  * `lucide-react-native` (High-contrast, accessible healthcare iconography)

---

## 3. Installation & Getting Started

### Prerequisites
* Node.js v18+ (tested on Node v24)
* npm v9+

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start Expo development server
npx expo start
```

---

## 4. Environment Variables

Create a `.env` file in the root directory:

```env
# URL for GeriCare Backend API
EXPO_PUBLIC_API_BASE_URL=https://api.gericare.example.com
```

---

## 5. Folder Structure

```text
app/
├── _layout.tsx                 # Root layout: TanStack Query Provider, NetInfo, Stack
├── index.tsx                   # Startup gateway: SecureStore check -> Home or Onboarding
├── onboarding/
│   ├── _layout.tsx             # Onboarding Stack layout
│   ├── welcome.tsx             # Welcome Screen (Step 3)
│   ├── pairing.tsx             # Device Pairing (QR, Code, PIN) (Step 4)
│   ├── pin.tsx                 # 4-Digit Accessible Keypad (Step 5)
│   └── complete.tsx            # Setup Complete Confirmation (Step 6)
└── (patient)/
    ├── _layout.tsx             # Patient shell with BottomNav and session protection
    ├── home.tsx                # Patient Home with time greeting & CompanionOrb (Step 9)
    ├── companion.tsx           # Voice Companion & Comfort Mode (Steps 11-13)
    ├── family.tsx              # Family Connections list (Step 14)
    ├── family/[id].tsx         # Family Member Detail with Voice Note & Call (Step 15)
    ├── memories.tsx            # Approved Memories album (Step 16)
    ├── memory/[id].tsx         # Memory Detail with Audio Story (Step 17)
    ├── comfort.tsx             # Calming Music, Sounds & Messages (Step 18)
    ├── activities.tsx          # Cognitive recall & routine sequencing (Step 19)
    ├── help.tsx                # Caregiver notification & Emergency calls (Step 20)
    └── settings.tsx            # Patient-safe accessibility preferences (Step 21)

src/
├── components/
│   ├── common/
│   │   ├── GeriButton.tsx      # Accessible high-contrast button with haptics
│   │   ├── GeriCard.tsx        # Soft rounded card with calm elevation
│   │   ├── GeriHeader.tsx      # Navigation header with large touch targets
│   │   └── LoadingState.tsx    # Gentle breathing indicator (no spinning loaders)
│   ├── states/
│   │   ├── EmptyState.tsx      # Reassuring empty message
│   │   ├── ErrorState.tsx      # Patient-safe, non-technical error display
│   │   ├── OfflineState.tsx    # "You're offline right now" screen and banner
│   │   ├── PermissionDeniedState.tsx # Microphone permission prompt
│   │   └── RetryCard.tsx       # Inline retry trigger
│   ├── companion/
│   │   ├── CompanionOrb.tsx    # Organic breathing orb with listening waveform & glow
│   │   └── VoiceButton.tsx     # 72x72px min touch target voice trigger
│   └── navigation/
│       └── BottomNav.tsx       # Patient accessible navigation tab bar
├── services/
│   ├── api.ts                  # Axios client, auth interceptor, 401 refresh
│   ├── session.service.ts      # SecureStore session helpers (save, get, clear, refresh)
│   ├── pairing.service.ts      # verifyPairing(), verifyPin()
│   ├── patient.service.ts      # getPatientProfile()
│   ├── conversation.service.ts # sendVoiceConversation() multipart
│   ├── family.service.ts       # getFamilyMembers(), getFamilyMember()
│   ├── memory.service.ts       # getMemories(), getMemory()
│   ├── comfort.service.ts      # getComfortContent()
│   ├── activity.service.ts     # getRecommendedActivities()
│   └── help.service.ts         # requestHelp(), getHelpContacts()
├── store/
│   ├── companion.store.ts      # idle, recording, uploading, processing, speaking, comfort
│   ├── session.store.ts        # SecureStore session cache
│   └── settings.store.ts       # textSize, voiceVolume, language, reducedMotion
├── hooks/
│   ├── useNetwork.ts           # Offline detection via NetInfo
│   ├── usePatient.ts           # TanStack Query hooks for server state
│   ├── useCompanionVoice.ts    # Voice recording & companion communication
│   └── useAudioPlayback.ts     # Audio playback for comfort and memory audio
├── types/                      # Strict TypeScript interfaces
├── schemas/                    # Zod validation schemas
├── constants/                  # Configuration & route paths
├── theme/                      # Healthcare design tokens (colors, typography, spacing, radius)
└── utils/                      # Storage, device ID, formatting, and error sanitizers
```

---

## 6. Application Startup & Navigation Logic

```text
               App Opens (app/index.tsx)
                          ↓
              Check SecureStore Session
                          ↓
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   Session Exists                    No Session
(accessToken & patientId)                  │
         │                                 ▼
         ▼                          Welcome Screen
    Patient Home                (/onboarding/welcome)
  (/(patient)/home)                        │
                                           ▼
                                    Pairing / PIN
                             (/onboarding/pairing & /pin)
                                           │
                                           ▼
                                    Setup Complete
                               (/onboarding/complete)
                                           │
                                           ▼
                                      Patient Home
```

---

## 7. Backend API Architecture & Contracts

All backend requests flow through the typed service layer (`src/services/`) and are managed via TanStack Query.

### 7.1 Pairing & Session
* `POST /api/v1/pairing/verify`
  * Request: `{ pairingCode: string, deviceId: string }`
  * Response: `{ accessToken: string, refreshToken: string, patientId: string }`
* `POST /api/v1/pairing/verify-pin`
  * Request: `{ pin: string, deviceId: string }`
  * Response: `{ accessToken: string, refreshToken: string, patientId: string }`
* `POST /api/v1/auth/refresh`
  * Request: `{ refreshToken: string, deviceId: string }`
  * Response: `{ accessToken: string, refreshToken?: string }`

### 7.2 Patient Profile
* `GET /api/v1/patients/{patientId}`
  * Response:
    ```json
    {
      "id": "pt_12345",
      "preferredName": "Eleanor",
      "firstName": "Eleanor",
      "profilePhotoUrl": "https://...",
      "preferredLanguage": "en"
    }
    ```

### 7.3 Voice Companion Flow
* `POST /api/v1/conversations/voice`
  * Request: `multipart/form-data` with fields:
    * `audio`: Audio binary file recorded by device (`.m4a` / `.wav`)
    * `patientId`: Patient ID string
    * `conversationId`: Optional ongoing conversation identifier
  * Response:
    ```json
    {
      "conversationId": "conv_9876",
      "transcript": "Hello, how is the weather outside today?",
      "responseText": "It is a bright and pleasant sunny morning outside, Eleanor.",
      "responseAudioUrl": "https://storage.gericare.example.com/audio/response_9876.mp3",
      "status": "completed",
      "uiMode": "normal"
    }
    ```

### 7.4 Comfort Mode
When the backend analyzes vocal prosody, distress markers, or confusion, it returns:
```json
{
  "uiMode": "comfort"
}
```
The frontend automatically transitions to:
* Warmer background hues
* Slower, rhythmic breathing animation
* Reassuring prompt: *"You're not alone."*
* Direct shortcuts to familiar music and family photos
* Suppression of complex controls

### 7.5 Family & Memories
* `GET /api/v1/patients/{patientId}/family`
* `GET /api/v1/patients/{patientId}/family/{familyMemberId}`
* `GET /api/v1/patients/{patientId}/memories`
* `GET /api/v1/patients/{patientId}/memories/{memoryId}`
* `GET /api/v1/patients/{patientId}/comfort`
* `GET /api/v1/patients/{patientId}/activities/recommended`
* `POST /api/v1/patients/{patientId}/help`

---

## 8. Voice & Audio Architecture

1. **Microphone Recording**:
   * Initialized using `expo-audio`'s `useAudioRecorder(RecordingPresets.HIGH_QUALITY)`.
   * Requests permissions via `AudioModule.requestRecordingPermissionsAsync()`.
   * Audio mode configured with `setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })`.
2. **Audio Streaming**:
   * Recording stops and local file URI is extracted.
   * Transmitted as multipart audio stream to `/api/v1/conversations/voice`.
3. **Playback**:
   * Returned audio response URL is streamed via `createAudioPlayer(responseAudioUrl)`.
   * Orb enters `speaking` mode with synchronized vocal cadences.

---

## 9. Security & Privacy Guidelines

* **Secure Storage**: Tokens and device identifiers are stored exclusively in `expo-secure-store` with OS-level hardware encryption (Keychain on iOS, Keystore on Android).
* **Zero Patient-Facing AI Internals**: Hallucination scores, distress vector metrics, and dementia stage classifications are never delivered or rendered in the patient app.
* **Caregiver Authority**: Configuration changes such as pairing, guardian access, and clinical settings are restricted to the caregiver portal.

---

## 10. Verification & Quality Audits

* Strict TypeScript: `npx tsc --noEmit` runs with 0 errors.
* Offline Support: Disconnecting internet triggers `OfflineState` banner and disables online calls gracefully.
* Accessibility: Minimum 48x48 touch targets, scalable text sizes, high-contrast dark navy on warm white, and full reduced-motion support.
