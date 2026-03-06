# Implementation Plan: Phase 2 — Architecture & Reliability

This phase focuses on modernizing the app's data layer. By moving away from direct Supabase calls in UI components and adopting React Query, we will achieve better performance, consistent state across the app, and a robust foundation for offline capabilities.

## Proposed Changes

### 1. React Query Integration
- **[NEW] `lib/query.ts`**: Configure the `QueryClient` with sensible defaults for a mobile app (e.g., revalidation on reconnect).
- **[MODIFY] `app/_layout.tsx`**: Wrap the application in `QueryClientProvider`.

### 2. Centralized Hooks
Instead of `useEffect` + `supabase.from()` in every screen, we will create custom hooks:
- **`useChildren()`**: Fetches and caches the list of children for the current parent.
- **`useObservations(childId)`**: Fetches and caches observations for a specific child.
- **`useProfile()`**: Manages the current user's profile state.

### 3. Caching & Reliability
- Implement **Stale-While-Revalidate**: Data is shown instantly from cache while a background fetch ensures it's fresh.
- **Optimistic Updates**: When a parent logs an observation, it appears in the UI immediately before the server confirms it.

### 4. Offline Foundation (Exploration)
- Configure React Query's `persistQueryClient` to store data in `AsyncStorage`. This allows the app to show data even without an internet connection.

## Verification Plan

### Manual Verification
1.  **Navigation Speed**: Verify that switching between Home and Growth tabs feels faster (instant data display).
2.  **State Sync**: Log an observation on one screen and verify it appears instantly on other relevant screens without a manual pull-to-refresh.
3.  **Simulated Slow Network**: Use developer tools to throttle the network and verify the app remains usable with cached data.
