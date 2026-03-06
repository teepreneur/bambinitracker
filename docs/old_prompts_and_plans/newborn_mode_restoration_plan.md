# Implementation Plan: Restoring Newborn Mode & Parenting Tips

This plan restores the specialized "Newborn Mode" features that were lost during the recent UI refactor. It focuses on postpartum support, dynamic age tracking, and visual polish for new parents.

## User Review Required

> [!IMPORTANT]
> I am replacing the static "Born [Date]" text with a dynamic "Age" label (e.g., "6 weeks old") to feel more premium and helpful.

## Proposed Changes

### [Home Tab]

#### [MODIFY] [index.tsx](file:///Users/triumphtetteh/Documents/Bambini%20Development%20tracker/app/(tabs)/index.tsx)
- **Implement Dynamic Age Logic**:
    - Update `ageMonths` to also calculate `ageWeeks` and `ageDays`.
    - Create a `getChildAgeLabel` helper to show precise age (e.g., "4 days old", "6 weeks old", "2 months old").
- **Restore Parenting Tips Section**:
    - Add a `NEWBORN_TIPS` constant with expert-vetted content for the 0-3 month period.
    - Insert a horizontally scrollable "Parenting Tips" section below the Stage Card.
    - Tips will include: **Safe Sleep**, **Tummy Time Basics**, and **Postpartum Care**.
- **Refine Stage Card**:
    - Remove the redundant "Born" label and replace it with the dynamic age.
    - Adjust the "Phase" labels to be more descriptive (e.g., "Postpartum Phase" for < 3 months).

---

### [Utilities]

#### [MODIFY] [ui.ts](file:///Users/triumphtetteh/Documents/Bambini%20Development%20tracker/utils/ui.ts)
- Add utility for calculating precise age strings if not already present.

---

## Verification Plan

### Automated Tests
- N/A (Visual/Content update).

### Manual Verification
1. Select a child with a recent DOB (e.g., Elodia, born Aug 2024 -> will be ~18m, needs a younger test child).
2. **Setup Test Child**: Temporarily update a child's DOB to 2 weeks ago via `scripts/add_test_newborn.mjs`.
3. Verify the **Turquoise Stage Card** shows "X weeks old".
4. Verify the **"Tips for Parents"** section appears only for the newborn.
5. Confirm tips are scrollable and use premium iconography.
