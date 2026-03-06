# Dynamic Data Audit & Cleanup Plan

## Goal
Perform a thorough walkthrough of the application to identify and fix areas where data is currently static/hardcoded but should be dynamic and reactive to user progress.

## Proposed Changes

### 1. Home Dashboard (`index.tsx`)
- **Audit**: Check if the "4 / 4 Activities" goal label is hardcoded.
- **Audit**: Check if the "Super Star!" message is dynamic based on actual completion.
- **Fix**: Ensure the progress bar and goal text reflect the current child's `todayActivities` completion state.

### 2. Activities Tab (`activities.tsx`)
- **Audit**: Check if domain filters or "Recommended for you" sections are static.
- **Fix**: Ensure the activity count and recommendations reflect the selected child's age and progress.

### 3. Growth Tab (`growth.tsx`)
- **Audit**: Check if "Strongest Areas" or "Insights" cards use hardcoded text.
- **Fix**: Generate dynamic insight text based on the Radar Chart data (calculate highest/lowest domain scores).

### 4. Profile Tab (`profile.tsx`)
- **Audit**: Check if "Observations", "Milestones", and "Points" stats are static.
- **Fix**: Hook these stats up to live Supabase queries for the currently selected child/parent.

## Verification Plan
- **Manual Verification**: Submit new observations and confirm all related UI (Home progress, Growth radar, Profile stats) updates immediately.
- **Code Review**: Ensure no more `const MOCK_DATA = [...]` blocks exist in production-ready screens.
