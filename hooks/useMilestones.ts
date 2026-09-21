import { synthesizeMilestoneInsights } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useChildObservations } from './useObservations';

export type MilestoneStatus = 'not_yet' | 'emerging' | 'achieved';

/** Fetch the full milestones catalog */
export function useMilestonesCatalog() {
    return useQuery({
        queryKey: ['milestones_catalog'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('milestones_catalog')
                .select('*')
                .order('age_months', { ascending: true });
            if (error) throw error;
            return data;
        },
    });
}

/** Fetch milestones tracked for a specific child */
export function useChildMilestones(childId: string | undefined) {
    return useQuery({
        queryKey: ['child_milestones', childId],
        enabled: !!childId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('child_milestones')
                .select('*, milestone:milestones_catalog(*)')
                .eq('child_id', childId);
            if (error) throw error;
            return data;
        },
    });
}

/** Mutation: Toggle a child milestone status (not_yet ↔ emerging ↔ achieved) */
export function useToggleChildMilestone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            childId,
            milestoneId,
            status,
        }: { childId: string; milestoneId: string; status: MilestoneStatus | null }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            if (status === null) {
                // Remove the entry — parent is clearing their response
                const { error } = await supabase
                    .from('child_milestones')
                    .delete()
                    .match({ child_id: childId, milestone_id: milestoneId });
                if (error) throw error;
            } else {
                // Upsert with the selected status
                const { error } = await supabase
                    .from('child_milestones')
                    .upsert(
                        {
                            child_id: childId,
                            milestone_id: milestoneId,
                            status,
                            achieved_date: status === 'achieved' ? new Date().toISOString() : null,
                            recorded_by: user.id,
                        },
                        { onConflict: 'child_id,milestone_id' }
                    );
                if (error) throw error;
            }
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['child_milestones', variables.childId] });
            const previousMilestones = queryClient.getQueryData(['child_milestones', variables.childId]);

            queryClient.setQueryData(
                ['child_milestones', variables.childId],
                (old: Array<{ milestone_id: string; status: string; achieved_date: string | null }>) => {
                    if (!old) return [];
                    const exists = old.find(m => m.milestone_id === variables.milestoneId);
                    if (variables.status === null) {
                        return old.filter(m => m.milestone_id !== variables.milestoneId);
                    }
                    if (exists) {
                        return old.map(m => m.milestone_id === variables.milestoneId ? { ...m, status: variables.status } : m);
                    }
                    return [...old, { milestone_id: variables.milestoneId, status: variables.status, achieved_date: variables.status === 'achieved' ? new Date().toISOString() : null }];
                }
            );

            return { previousMilestones };
        },
        onError: (_err, variables, context) => {
            if (context?.previousMilestones) {
                queryClient.setQueryData(['child_milestones', variables.childId], context.previousMilestones);
            }
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: ['child_milestones', variables.childId] });
        },
    });
}

/**
 * AI Observation Synthesis
 * Analyzes recent activity notes against the milestone catalog
 * to suggest achievements/emerging states.
 */
export function useMilestoneSynthesis(childId?: string, childName?: string, ageMonths?: number) {
    const { data: observations } = useChildObservations(childId);
    const { data: catalog } = useMilestonesCatalog();
    const { data: childMilestones } = useChildMilestones(childId);

    return useQuery({
        queryKey: ['milestone_synthesis', childId],
        enabled: !!childId && !!observations && !!catalog && !!childMilestones,
        staleTime: 1000 * 60 * 60 * 2, // 2 hours - Insights are heavy, don't re-run often
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for a day
        queryFn: async () => {
            if (__DEV__) console.log(`[useMilestoneSynthesis] Checking for insights for ${childName}...`);
            if (!childId || !childName || !ageMonths || !observations || !catalog || !childMilestones) return null;

            // Only run if we have at least 3 observations with notes to avoid low-quality AI results
            const noteObs = observations.filter(o => o.note && o.note.trim().length > 10);
            if (noteObs.length < 3) {
                if (__DEV__) console.log(`[useMilestoneSynthesis] Not enough high-quality notes (${noteObs.length}/3). Skipping AI.`);
                return null;
            }

            // 1. Get recent observations with notes (last 10)
            const recentObs = observations
                .filter(o => o.note && o.note.trim().length > 5)
                .slice(0, 10)
                .map(o => {
                    const activities = o.activities as { title?: string; domain?: string } | Array<{ title?: string; domain?: string }> | null;
                    const activity = Array.isArray(activities) ? activities[0] : activities;
                    return {
                        title: activity?.title || 'Activity',
                        note: o.note || '',
                        domain: activity?.domain || 'Unknown'
                    };
                });

            if (recentObs.length === 0) return null;

            // 2. Identify "Potential" milestones (not yet achieved, for current age range)
            const achievedIds = new Set(childMilestones.filter(m => m.status === 'achieved').map(m => m.milestone_id));
            
            const potentialMilestones = catalog
                .filter(m => !achievedIds.has(m.id))
                // Relaxed age range filter: -2 to +2 months from current age
                .filter(m => {
                    const min = m.age_min_months || m.age_months - 2;
                    const max = m.age_max_months || m.age_months + 2;
                    return ageMonths >= min && ageMonths <= max;
                })
                .slice(0, 10); // Limit context for LLM

            if (potentialMilestones.length === 0) return null;

            // 3. Call AI Synthesis
            const result = await synthesizeMilestoneInsights(
                childName,
                ageMonths,
                recentObs,
                potentialMilestones
            );

            if (!result) return null;

            // 4. Enrich result with the full milestone object
            const milestone = catalog.find(m => m.id === result.milestone_id);
            if (!milestone) return null;

            return {
                ...result,
                milestone
            };
        }
    });
}
