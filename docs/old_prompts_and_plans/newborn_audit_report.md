# Newborn Experience Technical Audit

This audit evaluates the current state of the Bambini Development Tracker regarding its relevance to new mothers with infants aged 0-3 months.

## 1. Database & Content Gaps

### Activity Library (`activities` table)
- **Current Minimum Age**: 6 months (e.g., "Peek-a-Boo").
- **Gap**: There are **zero activities** for the 0-1 month and 0-3 month age bands.
- **Requirement**: Need to seed ~10-15 activities specifically for newborns (bonding, skin-to-skin, sensory tracking).

### Milestone Reference (`milestones` table)
- **Current Minimum Age**: 2 months ("Social smile", "Follows moving objects").
- **Gap**: There are **no milestones** for the 1-month check-in.
- **Requirement**: Need milestones for 1 month (e.g., "briefly lifts head", "moves both arms").

### Data Schema (`children` table)
- **Current Precision**: Date of Birth is stored as a `DATE`.
- **UI Limitation**: Currently flattens newborn age to "0 months".
- **Requirement**: UI needs to handle "Days" (0-7) and "Weeks" (1-4) specifically for these users.

## 2. UI/UX Limitations

### Home Dashboard
- **Greeting**: Generic greeting does not recognize the unique postpartum phase.
- **Empty State**: No special onboarding or encouragement for the "Blank Slate" of a newborn.

### Growth Radar
- **Baseline**: Radar defaults to a score of 30 for all domains. This feels arbitrary for a baby who has just been born.
- **Normalization**: Need a "Newborn Baseline" (e.g., showing low score but with a "Growth Journey Starting" indicator).

## 3. Action Items for Implementation
1. **Gemini Content Generation**: Use AI to generate 0-3 month activities and milestones.
2. **Age Logic Refactoring**: Update `getAgeBandLabel` and `getChildAgeMonths` in `index.tsx` and `growth.tsx`.
3. **Radar Chart Logic**: Modify `RadarChart` to handle zero-observation states for newborns with specific "Journey Starting" visuals.
4. **Header Personalization**: Implement conditional rendering for children < 28 days old.
