# AGENTS.md

Expo SDK 57 / React Native 0.86 / expo-router app ("Bambini" child-development tracker). Supabase supplies auth, Postgres (RLS), and Edge Functions. TypeScript strict mode; no ESLint, no test runner, no CI. Verification = `npx tsc --noEmit` plus Metro bundling succeeding.

## Commands

```bash
npx expo start --lan      # dev server; phone must be on same Wi-Fi
npx tsc --noEmit          # typecheck
node scripts/<name>.mjs   # standalone DB seed / check / Gemini test scripts
```

- `npm run dev` (referenced in README) does not exist. Scripts are only `start`, `android`, `ios`, `web`.
- `--tunnel` fails under the robot `EXPO_TOKEN` (ngrok "robot user" error); use `--lan`. `--host 0.0.0.0` is not a valid `expo start` flag.
- Expo Go cannot open this project (SDK 57 is past what Expo Go supports) — device testing needs an EAS development build (`expo-dev-client` is installed; EAS project owned by `triumphtetteh`, robot-token-less `eas login` required).

## Expo-router / navigation constraints

- Never import `@react-navigation/native` in app code. As of SDK 56 expo-router rejects it at bundle time (Metro check). Theming must come from component-level styles, not react-navigation `ThemeProvider` (removed from `app/_layout.tsx`).
- Auth gating is done in `app/_layout.tsx` by conditionally including `Stack.Screen name="(auth)"` or `"(tabs)"` based on the Supabase session.
- Route groups: `app/(auth)/` (welcome, signup, login, onboarding), `app/(tabs)/` (index, activities, growth, health, profile, shop, add-child). Standalone screens: `activity/[id]`, edit-child, edit-profile, invite-teacher, modal, about.

## Data layer conventions

- `hooks/useData.ts` is only a barrel re-export of the per-domain hooks (`useProfile`, `useChildren`, `useActivities`, `useObservations`, `useMilestones`, `useGrowth`, `useHealth`, `useShop`, `useDoctorSummary`). Add new domains as their own `hooks/useX.ts` and re-export from the barrel.
- React Query is persisted to AsyncStorage (24h gcTime) in `lib/query.ts`. `clearAppCache()` MUST be called on sign-in, sign-out, and `onAuthStateChange` (`SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`), or a previous account's children/profile bleed into the next session.
- `lib/gemini.ts` must call the Supabase Edge Function `gemini-proxy` (`supabase.functions.invoke`), never Gemini directly — the `GEMINI_API_KEY` lives in Supabase secrets.
- Edge Functions live in `supabase/functions/` (`gemini-proxy`, `order-confirmation`).

## Environment

- `.env` (client, `EXPO_*` inlined at bundle time — restart the dev server after changes): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY`.
- `.env.server` for server-only secrets; never committed, never referenced by client code.
- Supabase project ref `xoqrvcykpygfishrkgnt`; link with `npx supabase link --project-ref xoqrvcykpygfishrkgnt`.

## Database migrations

`supabase/*.sql` files are applied manually and out of order by design (`fix_milestones_rls.sql`, `growth_rls_fix.sql`, etc. patch earlier files). Don't reorder or merge; check what already ran before applying. `schema_inspect.txt` at root is a schema dump for reference.

## Stale docs

`README.md` describes an older Vercel/Tailwind web app and is wrong about commands. Trust `HANDOVER.md` (recent, accurate) and the code over README.
