import { generateActivities } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Hardcoded fallback tips (used if the `tips` table doesn't exist yet)
const FALLBACK_NEWBORN_TIPS = [
    { id: 'fb-1', title: 'Safe Sleep', content: 'Always place baby on their back on a firm, flat infant sleep surface.', icon: '🌙', color: '#A67BB5', bg_color: '#F4EBf7', age_min_days: 0, age_max_days: 90 },
    { id: 'fb-2', title: 'Postpartum Help', content: 'Remember to rest when baby rests. Your gentle recovery is vital.', icon: '🤍', color: '#EC4899', bg_color: '#FCE7F3', age_min_days: 0, age_max_days: 90 },
    { id: 'fb-3', title: 'Tummy Time', content: 'Start with 2-3 minutes of tummy time on your chest, 2-3 times a day.', icon: '🧸', color: '#F5A623', bg_color: '#FFF5E6', age_min_days: 0, age_max_days: 90 },
];

/** Fetch tips from DB with fallback to hardcoded if table doesn't exist */
export function useNewbornTips(ageDays: number) {
    return useQuery({
        queryKey: ['tips', ageDays],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from('tips')
                    .select('*')
                    .lte('age_min_days', ageDays)
                    .gte('age_max_days', ageDays)
                    .order('created_at', { ascending: false });

                if (error) {
                    // Table probably doesn't exist yet — use fallback
                    if (__DEV__) console.log('[useNewbornTips] Tips table not available, using fallback');
                    return FALLBACK_NEWBORN_TIPS;
                }

                return data && data.length > 0 ? data : FALLBACK_NEWBORN_TIPS;
            } catch {
                return FALLBACK_NEWBORN_TIPS;
            }
        },
    });
}

/** Fetch the entire activities library for the Discover tab */
export function useActivitiesLibrary() {
    return useQuery({
        queryKey: ['activities_library'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('min_age_months', { ascending: true });

            if (error) {
                if (__DEV__) console.error('[useActivitiesLibrary] Failed to fetch activities:', error);
                throw error;
            }
            return data;
        },
    });
}

/** Fetch activities assigned to a specific child for a given date */
export function useChildActivities(childId?: string, ageDays?: number, currentDate?: string) {
    return useQuery({
        queryKey: ['child_activities', childId, currentDate, 'v5'],
        enabled: !!childId && !!currentDate,
        queryFn: async () => {
            if (__DEV__) console.log(`[useChildActivities] Fired! childId: ${childId}, date: ${currentDate}`);

            // 1. Fetch activities assigned to this child
            const { data: existingActivities, error: fetchError } = await supabase
                .from('child_activities')
                .select(`
                    id,
                    assigned_at,
                    activity_id,
                    activities (*)
                `)
                .eq('child_id', childId);

            if (fetchError) throw fetchError;

            // 2. Fetch observations
            const { data: observations } = await supabase
                .from('observations')
                .select('activity_id')
                .eq('child_id', childId);

            const completedActivityIds = new Set(
                (observations || []).map((o: { activity_id: string }) => o.activity_id)
            );

            // 3. Filter for Today (based on assignments)
            const todayAssignments = existingActivities.filter(a => a.assigned_at?.startsWith(currentDate!));
            
            // 4. Return formatted
            return todayAssignments.map((ca: Record<string, unknown>) => {
                const activity = ca.activities as Record<string, unknown>;
                return {
                    ...activity,
                    id: activity.id,
                    assignment_id: ca.id,
                    isCompleted: completedActivityIds.has(ca.activity_id as string)
                };
            });
        },
    });
}

/**
 * useSyncDailyActivities
 * Handles the logic of rolling over incomplete activities and topping off with Gemini.
 * This is a mutation to prevent side-effects during query fetching.
 */
export function useSyncDailyActivities() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ childId, ageDays, currentDate }: { childId: string; ageDays: number; currentDate: string }) => {
            if (__DEV__) console.log(`[useSyncDailyActivities] Starting sync for ${currentDate}...`);

            // 1. Fetch all assignments
            const { data: existingAssignments, error: fetchError } = await supabase
                .from('child_activities')
                .select(`id, assigned_at, activity_id`)
                .eq('child_id', childId);

            if (fetchError) throw fetchError;

            // 2. Fetch completed activity IDs
            const { data: observations } = await supabase
                .from('observations')
                .select('activity_id')
                .eq('child_id', childId);

            const completedActivityIds = new Set((observations || []).map((o: { activity_id: string }) => o.activity_id));

            // 3. Categorize
            const todayAssignments = existingAssignments.filter(a => a.assigned_at?.startsWith(currentDate));
            const pastAssignments = existingAssignments.filter(a => !a.assigned_at?.startsWith(currentDate));
            const pastIncomplete = pastAssignments.filter(a => !completedActivityIds.has(a.activity_id));

            let currentCount = todayAssignments.length;
            let slotsNeeded = 5 - currentCount;

            if (slotsNeeded <= 0) {
                if (__DEV__) console.log('[useSyncDailyActivities] Slots already full.');
                return { synced: 0 };
            }

            // 4. ROLLOVER
            if (slotsNeeded > 0 && pastIncomplete.length > 0) {
                const toRollOver = pastIncomplete.slice(0, slotsNeeded);
                const { error: rollError } = await supabase
                    .from('child_activities')
                    .update({ assigned_at: new Date().toISOString() })
                    .in('id', toRollOver.map(a => a.id));

                if (!rollError) {
                    slotsNeeded -= toRollOver.length;
                }
            }

            // 5. TOP-OFF (Gemini)
            if (slotsNeeded > 0) {
                if (__DEV__) console.log(`[useSyncDailyActivities] Gemini sync needed: ${slotsNeeded} slots.`);
                
                // Fetch recent feedback
                const { data: recentObs } = await supabase
                    .from('observations')
                    .select(`rating, note, activities(title)`)
                    .eq('child_id', childId)
                    .not('rating', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(5);

                const recentFeedback = (recentObs || []).map((obs: Record<string, unknown>) => {
                    const activities = obs.activities as { title?: string } | null;
                    return {
                        title: activities?.title || 'Unknown Activity',
                        rating: obs.rating as string,
                        note: (obs.note as string) || '',
                    };
                }).filter(f => f.rating !== 'completed');

                const existingTitles = [...todayAssignments, ...pastAssignments]
                    .map((a: Record<string, unknown>) => {
                        const activities = a.activities as { title?: string } | null;
                        return activities?.title;
                    }).filter((t): t is string => Boolean(t));

                const { data: emergingMilestonesData } = await supabase
                    .from('child_milestones')
                    .select(`status, milestones_catalog!inner(title)`)
                    .eq('child_id', childId)
                    .eq('status', 'emerging')
                    .limit(3);

                const emergingMilestones = (emergingMilestonesData || [])
                    .map((m: Record<string, unknown>) => {
                        const catalog = m.milestones_catalog as { title?: string } | null;
                        return catalog?.title;
                    })
                    .filter((t): t is string => Boolean(t));

                const newGenerated = await generateActivities(ageDays, slotsNeeded, recentFeedback, existingTitles, emergingMilestones);

                if (newGenerated.length > 0) {
                   // Calculate age band
                   let ageBand = '0-3 months';
                   if (ageDays < 90) ageBand = '0-3 months';
                   else if (ageDays < 180) ageBand = '3-6 months';
                   else if (ageDays < 365) ageBand = '6-12 months';
                   else if (ageDays < 730) ageBand = '12-24 months';
                   else if (ageDays < 1095) ageBand = '24-36 months';
                   else ageBand = '36-48 months';

                    const activitiesToInsert = newGenerated.map(a => ({
                        title: a.title,
                        description: a.description,
                        domain: a.domain,
                        min_age_months: Math.max(0, a.target_age_months - 1),
                        max_age_months: a.target_age_months + 1,
                        estimated_duration_minutes: parseInt(a.estimated_time) || 10,
                        age_band: ageBand,
                        difficulty_level: 'easy',
                        target_milestone: a.target_milestone || null,
                        instructions: a.instructions || [],
                        materials: a.materials || [],
                        tips: a.tips || [],
                    }));

                    const { data: insertedActivities, error: insertError } = await supabase
                        .from('activities')
                        .insert(activitiesToInsert)
                        .select();

                    if (insertError) throw insertError;

                    const assignmentsToInsert = insertedActivities.map(a => ({
                        child_id: childId,
                        activity_id: a.id,
                        assigned_at: new Date().toISOString()
                    }));

                    const { error: assignError } = await supabase
                        .from('child_activities')
                        .insert(assignmentsToInsert);

                    if (assignError) throw assignError;
                }
            }

            return { synced: 5 - slotsNeeded };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['child_activities'] });
        }
    });
}

/** Mutation: Mark an activity as completed by inserting an observation with optional feedback */
export function useCompleteActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            childId,
            activityId,
            rating = 'completed',
            note = 'Activity completed',
            mediaUrls = []
        }: {
            childId: string;
            activityId: string;
            rating?: string;
            note?: string;
            mediaUrls?: string[];
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if already completed
            const { data: existing } = await supabase
                .from('observations')
                .select('id')
                .eq('child_id', childId)
                .eq('activity_id', activityId)
                .limit(1);

            if (existing && existing.length > 0) {
                if (__DEV__) console.log('[useCompleteActivity] Already completed, skipping.');
                return existing[0];
            }

            const { data, error } = await supabase
                .from('observations')
                .insert({
                    child_id: childId,
                    activity_id: activityId,
                    observer_id: user.id,
                    rating,
                    note,
                    media_urls: mediaUrls,
                    location_type: 'home',
                })
                .select()
                .single();

            if (error) {
                if (__DEV__) console.error('[useCompleteActivity] Insert error:', error);
                throw error;
            }
            return data;
        },
        onMutate: async (variables) => {
            const today = new Date().toISOString().split('T')[0];
            const summaryKey = ['daily_summary', variables.childId, today, 'v2'];
            const completedKey = ['activity_completed', variables.activityId, variables.childId];

            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: completedKey });
            await queryClient.cancelQueries({ queryKey: summaryKey });

            // Snapshot previous values
            const previousCompleted = queryClient.getQueryData(completedKey);
            const previousSummary = queryClient.getQueryData(summaryKey);

            // Optimistically update
            queryClient.setQueryData(completedKey, true);
            if (previousSummary) {
                queryClient.setQueryData(summaryKey, (old: { completedCount?: number }) => ({
                    ...old,
                    completedCount: (old?.completedCount || 0) + 1
                }));
            }

            return { previousCompleted, previousSummary, summaryKey, completedKey };
        },
        onError: (_err, _variables, context) => {
            if (context?.completedKey) {
                queryClient.setQueryData(context.completedKey, context.previousCompleted);
            }
            if (context?.summaryKey) {
                queryClient.setQueryData(context.summaryKey, context.previousSummary);
            }
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: ['activity_completed', variables.activityId, variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['daily_summary', variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['child_activities', variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['observations', variables.childId] });
        },
    });
}

/** Fetch daily summary stats for a child */
export function useDailySummary(childId?: string, date?: string) {
    const today = new Date().toISOString().split('T')[0];
    const effectiveDate = date || today;

    return useQuery({
        queryKey: ['daily_summary', childId, effectiveDate, 'v2'],
        enabled: !!childId,
        queryFn: async () => {
            // 1. Get IDs of activities assigned for TODAY specifically
            const { data: assignments } = await supabase
                .from('child_activities')
                .select('activity_id')
                .eq('child_id', childId)
                .gte('assigned_at', `${effectiveDate}T00:00:00.000Z`)
                .lte('assigned_at', `${effectiveDate}T23:59:59.999Z`);

            const assignedIds = (assignments || []).map(a => a.activity_id);

            if (assignedIds.length === 0) {
                return { completedCount: 0, goal: 5 };
            }

            // 2. Count observations for those specific assigned activities today
            const { data, error } = await supabase
                .from('observations')
                .select('id')
                .eq('child_id', childId)
                .in('activity_id', assignedIds)
                .gte('created_at', `${effectiveDate}T00:00:00.000Z`)
                .lte('created_at', `${effectiveDate}T23:59:59.999Z`);

            if (error) {
                if (__DEV__) console.error('[useDailySummary] Error:', error);
                return { completedCount: 0, goal: 5 };
            }

            return {
                completedCount: data?.length || 0,
                goal: 5 // Target daily activities
            };
        },
    });
}
