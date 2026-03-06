# Implementation Plan: Partner Sync (Co-Parenting)

This plan outlines the steps to allow multiple parents or caregivers to track the same child's progress in real-time.

## Proposed Changes

### 1. Database Schema [NEW TABLE]
Update the database to support a "Join Code" system.

#### [NEW] `invitations` table
- `id`: UUID (Primary Key)
- `inviter_id`: UUID (References `profiles.id`)
- `child_id`: UUID (References `children.id`)
- `code`: TEXT (Unique, 6-character alphanumeric code)
- `is_used`: BOOLEAN (Default FALSE)
- `expires_at`: TIMESTAMPTZ (Default NOW() + 48 hours)
- `created_at`: TIMESTAMPTZ (Default NOW())

### 2. UI Implementation

#### [MODIFY] [Account Settings Screen](file:///Users/triumphtetteh/Documents/Bambini%20Development%20tracker/app/settings/account.tsx)
- **New Section: Co-Parenting**
    - **Generate Invite**: Button to pick a child and create a 6-digit sync code.
    - **Active Syncs**: List names of children currently being shared.
    - **Join a Child**: Input field to enter a code from a partner.

#### [NEW] Logic Hooks/Functions
- `generateInviteCode(childId)`: Creates the DB entry and returns the string.
- `redeemInviteCode(code)`: Validates code, adds user to `parent_children`, and marks as used.

## Verification Plan

### Automated Tests
- Script to simulate Parent A creating a code and Parent B redeeming it.
- Verify that Parent B now sees the same child and observations in their dashboard.

### Manual Verification
1. Login as Parent A.
2. Go to Settings -> Partner Sync.
3. Select "Newborn Baby" and generate a code.
4. Login as Parent B (Teacher or another account).
5. Enter the code in Settings -> Join a Child.
6. Confirm the child appeared in the Home/Observations tab for Parent B.
