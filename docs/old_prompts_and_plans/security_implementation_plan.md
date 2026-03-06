# Implementation Plan: Production Security & Privacy (Phase 1)

This plan focuses on securing user data by implementing Row Level Security (RLS) in Supabase. This ensures that a parent can *only* access their own profile, their own children's data, and shared children via the Partner Sync system.

## Proposed Changes

### 1. Supabase Row Level Security (RLS)
We will enable RLS on all tables and define strict policies.

#### [MODIFY] `profiles` Table
- **Policy**: `uid() = id` (User can only read/write their own profile).

#### [MODIFY] `children` Table
- **Policy**: Users can access a child only if they have a record in `parent_children` linking them to that `child_id`.

#### [MODIFY] `parent_children` Table
- **Policy**: User can only see links where `parent_id = uid()`.

#### [MODIFY] `observations`, `milestone_progress`, `invitations`
- **Policy**: Access granted only if user has access to the associated `child_id`.

### 2. Secure Storage (Media)
- Change `child-photos` bucket from Public to **Private**.
- Update the app to use **Signed URLs** (short-lived) for displaying images, rather than public URLs.
- *Note: This prevents unauthorized scraping of child photos.*

### 3. Shared Access Helper
- Create a SQL function `is_child_parent(child_id_param UUID)` that returns a boolean. This centralizes the "Do I have access to this kid?" logic.

## Verification Plan

### Automated Tests
- Script to attempt reading "Parent A's child" using "Parent B's JWT".
- Verify Supabase returns 403 or empty results.

### Manual Verification
1. Login with Account A.
2. Note a Child ID.
3. Login with Account B.
4. Attempt to fetch details for that Child ID via a scratch script.
5. Verify access is denied.
6. Verify that Partner Sync still works (since it adds the link to `parent_children`).
