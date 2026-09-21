# Bambini Tracker — Developer Handover & Update Brief

Welcome to the **Bambini Tracker** project! This document outlines the major updates, architectural changes, security fixes, and remaining roadmap tasks completed over the last 48 hours to help you get up to speed immediately.

---

## 1. Quick Setup & Environment

### Clone & Dependencies
```bash
git pull origin main
npm install
```

### Environment Configuration
Sensitive keys have been separated into client and server files:
1. **Client environment (`.env`)**:
   Copy `.env.example` to `.env`. This contains `EXPO_PUBLIC_*` variables required by Expo:
   * `EXPO_PUBLIC_SUPABASE_URL`
   * `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   * `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY`
2. **Server environment (`.env.server`)**:
   Used strictly for backend operations and deployment. Contains `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY`. (Kept out of Git).

### Supabase CLI Link
The project is hosted on Supabase Cloud:
* **Project Reference:** `xoqrvcykpygfishrkgnt`
* **Link via CLI:**
  ```bash
  npx supabase link --project-ref xoqrvcykpygfishrkgnt
  ```

### Running Locally
```bash
npm run ios     # or npx expo run:ios
npm run android # or npx expo run:android
```

---

## 2. What Was Changed & Updated (Changelog)

### A. Security & Key Protection
* **Server-Side AI Proxy:** The Google Gemini API key has been removed from client-side code. We created and deployed a Supabase Edge Function:
  * Location: `supabase/functions/gemini-proxy/index.ts`
  * Client caller: `lib/gemini.ts` invokes `supabase.functions.invoke('gemini-proxy', ...)`
  * Project secret `GEMINI_API_KEY` is securely stored in Supabase Secrets vault.
* **Environment Sanitization:** Removed sensitive keys from client `.env` and added `.env.server` + `supabase/.temp/` to `.gitignore`.
* **Cryptographic Randomness:** Replaced `Math.random()` with `crypto.getRandomValues()` for secure invite code generation (`hooks/useChildren.ts`).
* **Input Validation:** Added email formatting regex, password length constraints (8+ chars), and name validation to login and signup screens.

### B. Critical Bug Fixes
* **Duplicate QueryClient:** Fixed React Query double-initialization in `app/_layout.tsx` (now strictly unified in `lib/query.ts`).
* **Auth Subscription Memory Leak:** Added proper unsubscribe cleanup on `supabase.auth.onAuthStateChange` in `app/_layout.tsx`.
* **ISO Date Formatting Typo:** Fixed malformed ISO timestamp string (`T00:00:000Z` → `T00:00:00.000Z`) that was corrupting daily activity queries.
* **Forgot Password Flow:** Implemented password reset email trigger via `supabase.auth.resetPasswordForEmail()` in `app/(auth)/login.tsx`.
* **Home Screen Infinite Sync Loop:** Fixed `useEffect` dependency cycle that was repeatedly triggering daily activity synchronizations.

### C. Architecture & Code Quality
* **Modularized Data Hooks:** Split the monolithic `hooks/useData.ts` (1,000+ lines) into 7 single-responsibility domain modules:
  * `hooks/useProfile.ts` — User profile retrieval and mutation
  * `hooks/useChildren.ts` — Child management, deletions, and invite codes
  * `hooks/useActivities.ts` — Library, daily sync, completion, tips
  * `hooks/useObservations.ts` — Observation history and logging
  * `hooks/useMilestones.ts` — Milestone catalog, progress toggling, synthesis
  * `hooks/useGrowth.ts` — Measurement CRUD
  * `hooks/useHealth.ts` — Vaccinations and health logs
  * `hooks/useData.ts` — Clean barrel re-export file for 100% backwards compatibility with existing UI screens.
* **Dev Log Cleanup:** Guarded high-frequency console logs behind `__DEV__`.

### D. Multi-User Cache Isolation & Auth Leak Fix
* **The Problem:** Because TanStack Query persisted queries to `AsyncStorage` (`PersistQueryClientProvider`) with a 24-hour retention period, switching between accounts on the same device was serving the previous account's cached profile name and children.
* **The Solution:**
  * Implemented `clearAppCache()` in `lib/query.ts` which cancels in-flight queries and removes `REACT_QUERY_OFFLINE_CACHE` from `AsyncStorage`.
  * Connected `clearAppCache()` to `onAuthStateChange` (`SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`) and explicit login/signup/logout actions.
  * Configured `staleTime: 0` on `useProfile` and `useChildren` so account data is always verified against the active Supabase JWT.

---

## 3. Architecture Overview

```mermaid
graph TD
    UserPhone["📱 React Native / Expo Client"]

    subgraph SupabaseCloud ["☁️ Supabase Cloud (xoqrvcykpygfishrkgnt)"]
        Auth["Supabase Auth (JWT)"]
        Postgres["PostgreSQL Database (RLS)"]
        EdgeFunc["Edge Function: gemini-proxy"]
    end

    subgraph External ["🌐 External Providers"]
        Gemini["Google Gemini AI"]
        Paystack["Paystack"]
    end

    UserPhone -->|Auth & Session| Auth
    UserPhone -->|TanStack Query + Cache| Postgres
    UserPhone -->|Invoke Function| EdgeFunc
    EdgeFunc -->|Server Secret| Gemini
    UserPhone -->|Subscription checkout| Paystack
```

---

## 4. Next Steps & Remaining Tasks for Launch

Here are the highest-priority tasks remaining to finalize before production deployment:

1. **Paystack Webhook Verification:**
   * Move payment completion handling to a Supabase Edge Function webhook listener to verify transactions server-side before activating subscriptions.
2. **Database Row Level Security (RLS) Audit:**
   * Ensure custom policies on `growth_measurements`, `child_milestones`, and `health_logs` enforce parent ownership (`check_child_access`) rather than `USING (true)`.
3. **Home Screen Component Extraction:**
   * `app/(tabs)/index.tsx` is currently ~900 lines; extracting sub-components (Header, StreakWidget, ActivityCard, TipsCard) will improve maintainability.
4. **App Store & EAS Build Configuration:**
   * Review `eas.json` for production build profiles.
   * Generate app icon and splash screen assets across iOS and Android sizes.
5. **End-to-End Testing:**
   * Test complete user onboarding: Signup → Add Child → Complete Daily Activities → Log Growth → Generate Milestone Synthesis.
