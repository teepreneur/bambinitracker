/**
 * Barrel re-export for backwards compatibility.
 *
 * All hooks have been split into domain-specific modules under hooks/.
 * This file re-exports everything so existing `import { ... } from '@/hooks/useData'`
 * statements continue to work without changes.
 *
 * New code should import directly from the domain module, e.g.:
 *   import { useProfile } from '@/hooks/useProfile';
 */

// Profile
export { useProfile, useUpdateProfile } from './useProfile';

// Children
export { useChildren, useUpdateChild, useDeleteChild, useGenerateInviteCode } from './useChildren';

// Activities
export { useActivitiesLibrary, useChildActivities, useSyncDailyActivities, useCompleteActivity, useDailySummary, useNewbornTips } from './useActivities';

// Observations
export { useUserObservations, useChildObservations } from './useObservations';

// Milestones
export { useMilestonesCatalog, useChildMilestones, useToggleChildMilestone, useMilestoneSynthesis } from './useMilestones';
export type { MilestoneStatus } from './useMilestones';

// Growth
export { useGrowthMeasurements, useAddGrowthMeasurement, useUpdateGrowthMeasurement, useDeleteGrowthMeasurement } from './useGrowth';

// Health
export { useVaccinations, useLogVaccination, useHealthLogs, useCreateHealthLog } from './useHealth';
