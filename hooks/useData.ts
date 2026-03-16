import { generateActivities, synthesizeMilestoneInsights } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

// Fetch current user and profile
export function useProfile() {
    return useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            return { ...profile, authUser: user };
        },
    });
}

// Fetch children for the authenticated user
export function useChildren() {
    return useQuery({
        queryKey: ['children'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('parent_children')
                .select(`
                    child_id,
                    children (*)
                `)
                .eq('parent_id', user.id);

            if (error) throw error;

            // Map the joined data to just return the children objects
            return data.map((pc: any) => pc.children).filter(Boolean);
        },
    });
}

// Fetch observations for the current user's children
export function useUserObservations() {
    return useQuery({
        queryKey: ['observations'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            // Get all child IDs for this parent
            const { data: links } = await supabase
                .from('parent_children')
                .select('child_id')
                .eq('parent_id', user.id);

            if (!links || links.length === 0) return [];

            const childIds = links.map(l => l.child_id);

            // Fetch observations for these children
            const { data: observations, error } = await supabase
                .from('observations')
                .select('*')
                .in('child_id', childIds)
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) {
                console.error('[useUserObservations] Error:', error);
                return [];
            }

            return observations || [];
        },
    });
}

// Hardcoded fallback tips (used if the `tips` table doesn't exist yet)
const FALLBACK_NEWBORN_TIPS = [
    { id: 'fb-1', title: 'Safe Sleep', content: 'Always place baby on their back on a firm, flat infant sleep surface.', icon: '🌙', color: '#A67BB5', bg_color: '#F4EBf7', age_min_days: 0, age_max_days: 90 },
    { id: 'fb-2', title: 'Postpartum Help', content: 'Remember to rest when baby rests. Your gentle recovery is vital.', icon: '🤍', color: '#EC4899', bg_color: '#FCE7F3', age_min_days: 0, age_max_days: 90 },
    { id: 'fb-3', title: 'Tummy Time', content: 'Start with 2-3 minutes of tummy time on your chest, 2-3 times a day.', icon: '🧸', color: '#F5A623', bg_color: '#FFF5E6', age_min_days: 0, age_max_days: 90 },
];

// Fetch tips from DB with fallback to hardcoded if table doesn't exist
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
                    console.log('[useNewbornTips] Tips table not available, using fallback');
                    return FALLBACK_NEWBORN_TIPS;
                }

                return data && data.length > 0 ? data : FALLBACK_NEWBORN_TIPS;
            } catch {
                return FALLBACK_NEWBORN_TIPS;
            }
        },
    });
}

// Fetch the entire activities library for the Discover tab
export function useActivitiesLibrary() {
    return useQuery({
        queryKey: ['activities_library'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('min_age_months', { ascending: true });

            if (error) {
                console.error("[useActivitiesLibrary] Failed to fetch activities:", error);
                throw error;
            }
            return data;
        },
    });
}

// Fetch activities assigned to a specific child, implementing daily rollover and top-off logic
export function useChildActivities(childId?: string, ageDays?: number, currentDate?: string) {
    return useQuery({
        queryKey: ['child_activities', childId, currentDate, 'v5'],
        enabled: !!childId && !!currentDate,
        queryFn: async () => {
            console.log(`[useChildActivities] Fired! childId: ${childId}, date: ${currentDate}`);

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
                (observations || []).map((o: any) => o.activity_id)
            );

            // 3. Filter for Today (based on assignments)
            const todayAssignments = existingActivities.filter(a => a.assigned_at?.startsWith(currentDate!));
            
            // 4. Return formatted
            return todayAssignments.map((ca: any) => ({
                ...ca.activities,
                id: ca.activities.id,
                assignment_id: ca.id,
                isCompleted: completedActivityIds.has(ca.activity_id)
            }));
        },
    });
}

/**
 * useSyncDailyActivities
 * Handles the logic of rolling over incomplete activities and topping off with Gemini.
 * This is now a mutation to prevent side-effects during query fetching.
 */
export function useSyncDailyActivities() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ childId, ageDays, currentDate }: { childId: string; ageDays: number; currentDate: string }) => {
            console.log(`[useSyncDailyActivities] Starting sync for ${currentDate}...`);

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

            const completedActivityIds = new Set((observations || []).map((o: any) => o.activity_id));

            // 3. Categorize
            const todayAssignments = existingAssignments.filter(a => a.assigned_at?.startsWith(currentDate));
            const pastAssignments = existingAssignments.filter(a => !a.assigned_at?.startsWith(currentDate));
            const pastIncomplete = pastAssignments.filter(a => !completedActivityIds.has(a.activity_id));

            let currentCount = todayAssignments.length;
            let slotsNeeded = 5 - currentCount;

            if (slotsNeeded <= 0) {
                console.log("[useSyncDailyActivities] Slots already full.");
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
                console.log(`[useSyncDailyActivities] Gemini sync needed: ${slotsNeeded} slots.`);
                
                // Fetch recent feedback
                const { data: recentObs } = await supabase
                    .from('observations')
                    .select(`rating, note, activities(title)`)
                    .eq('child_id', childId)
                    .not('rating', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(5);

                const recentFeedback = (recentObs || []).map((obs: any) => ({
                    title: obs.activities?.title || 'Unknown Activity',
                    rating: obs.rating,
                    note: obs.note || '',
                })).filter(f => f.rating !== 'completed');

                const existingTitles = [...todayAssignments, ...pastAssignments]
                    .map((a: any) => a.activities?.title).filter(Boolean);

                const { data: emergingMilestonesData } = await supabase
                    .from('child_milestones')
                    .select(`status, milestones_catalog!inner(title)`)
                    .eq('child_id', childId)
                    .eq('status', 'emerging')
                    .limit(3);

                const emergingMilestones = (emergingMilestonesData || [])
                    .map((m: any) => m.milestones_catalog?.title)
                    .filter(Boolean);

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

// Mutation: Mark an activity as completed by inserting an observation with optional feedback
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
                console.log("[useCompleteActivity] Already completed, skipping.");
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
                console.error("[useCompleteActivity] Insert error:", error);
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
                queryClient.setQueryData(summaryKey, (old: any) => ({
                    ...old,
                    completedCount: (old?.completedCount || 0) + 1
                }));
            }

            return { previousCompleted, previousSummary, summaryKey, completedKey };
        },
        onError: (err, variables, context: any) => {
            if (context?.completedKey) {
                queryClient.setQueryData(context.completedKey, context.previousCompleted);
            }
            if (context?.summaryKey) {
                queryClient.setQueryData(context.summaryKey, context.previousSummary);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ['activity_completed', variables.activityId, variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['daily_summary', variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['child_activities', variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['observations', variables.childId] });
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
        queryKey: ['milestone_synthesis', childId], // Remove observations length to prevent over-triggering
        enabled: !!childId && !!observations && !!catalog && !!childMilestones,
        staleTime: 1000 * 60 * 60 * 2, // 2 hours - Insights are heavy, don't re-run often
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for a day
        queryFn: async () => {
            console.log(`[useMilestoneSynthesis] Checking for insights for ${childName}...`);
            if (!childId || !childName || !ageMonths || !observations || !catalog || !childMilestones) return null;

            // Only run if we have at least 3 observations with notes to avoid low-quality AI results
            const noteObs = observations.filter(o => o.note && o.note.trim().length > 10);
            if (noteObs.length < 3) {
                console.log(`[useMilestoneSynthesis] Not enough high-quality notes (${noteObs.length}/3). Skipping AI.`);
                return null;
            }

            // 1. Get recent observations with notes (last 10)
            const recentObs = observations
                .filter(o => o.note && o.note.trim().length > 5)
                .slice(0, 10)
                .map(o => ({
                    title: (o as any).activities?.[0]?.title || (o as any).activities?.title || 'Activity',
                    note: o.note || '',
                    domain: (o as any).activities?.[0]?.domain || (o as any).activities?.domain || 'Unknown'
                }));

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

// Fetch a child's chronological observation history (completed activities)
export function useChildObservations(childId?: string) {
    return useQuery({
        queryKey: ['observations_history', childId],
        enabled: !!childId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('observations')
                .select(`
                    id,
                    created_at,
                    rating,
                    note,
                    media_urls,
                    activities (
                        id,
                        title,
                        domain,
                        estimated_duration_minutes
                    )
                `)
                .eq('child_id', childId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("[useChildObservations] Fetch error:", error);
                throw error;
            }
            return data;
        },
    });
}

// Fetch daily summary stats for a child
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
                .gte('assigned_at', `${effectiveDate}T00:00:000Z`)
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
                console.error("[useDailySummary] Error:", error);
                return { completedCount: 0, goal: 5 };
            }

            return {
                completedCount: data?.length || 0,
                goal: 5 // Target daily activities
            };
        },
    });
}

// Mutation: Update the current user's profile
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: { name?: string; email?: string; phone?: string; avatar_url?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            // Also update auth metadata if name changed
            if (updates.name) {
                await supabase.auth.updateUser({
                    data: { full_name: updates.name }
                });
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
}

// Mutation: Update a child's details
export function useUpdateChild() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ childId, updates }: { childId: string; updates: { name?: string; dob?: string; gender?: string; photo_url?: string } }) => {
            const { data, error } = await supabase
                .from('children')
                .update(updates)
                .eq('id', childId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
        },
    });
}

// Mutation: Delete a child (remove from parent_children junction + optionally delete child record)
export function useDeleteChild() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Remove the parent-child link
            const { error: unlinkError } = await supabase
                .from('parent_children')
                .delete()
                .eq('parent_id', user.id)
                .eq('child_id', childId);

            if (unlinkError) throw unlinkError;

            // Check if any other parents are linked to this child
            const { data: otherLinks } = await supabase
                .from('parent_children')
                .select('id')
                .eq('child_id', childId);

            // If no other parents, delete the child record entirely
            if (!otherLinks || otherLinks.length === 0) {
                const { error: deleteError } = await supabase
                    .from('children')
                    .delete()
                    .eq('id', childId);

                if (deleteError) throw deleteError;
            }

            return childId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
        },
    });
}

// Mutation: Generate a teacher invite code for a child
export function useGenerateInviteCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Generate a random 6-character alphanumeric code
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // Set expiry to 48 hours from now
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 48);

            const { data, error } = await supabase
                .from('invitations')
                .insert({
                    inviter_id: user.id,
                    child_id: childId,
                    code,
                    is_used: false,
                    expires_at: expiresAt.toISOString(),
                })
                .select()
                .single();

            return data;
        },
    });
}

// --- Growth & Milestones Hooks ---

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

export type MilestoneStatus = 'not_yet' | 'emerging' | 'achieved';

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

            queryClient.setQueryData(['child_milestones', variables.childId], (old: any[]) => {
                if (!old) return [];
                const exists = old.find(m => m.milestone_id === variables.milestoneId);
                if (variables.status === null) {
                    return old.filter(m => m.milestone_id !== variables.milestoneId);
                }
                if (exists) {
                    return old.map(m => m.milestone_id === variables.milestoneId ? { ...m, status: variables.status } : m);
                }
                return [...old, { milestone_id: variables.milestoneId, status: variables.status, achieved_date: variables.status === 'achieved' ? new Date().toISOString() : null }];
            });

            return { previousMilestones };
        },
        onError: (err, variables, context) => {
            if (context?.previousMilestones) {
                queryClient.setQueryData(['child_milestones', variables.childId], context.previousMilestones);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ['child_milestones', variables.childId] });
        },
    });
}

export function useGrowthMeasurements(childId: string | undefined) {
    return useQuery({
        queryKey: ['growth_measurements', childId],
        enabled: !!childId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('growth_measurements')
                .select('*')
                .eq('child_id', childId)
                .order('date', { ascending: true }); // Important for charts to be chronologically ordered

            if (error) throw error;
            return data;
        },
    });
}

export function useAddGrowthMeasurement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (measurementData: {
            child_id: string;
            date: string;
            weight_kg?: number | null;
            height_cm?: number | null;
            head_circumference_cm?: number | null;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('growth_measurements')
                .insert({
                    ...measurementData,
                    recorded_by: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['growth_measurements', variables.child_id] });
        },
    });
}

export function useUpdateGrowthMeasurement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (measurementData: {
            id: string;
            child_id: string;
            date: string;
            weight_kg?: number | null;
            height_cm?: number | null;
            head_circumference_cm?: number | null;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { id, child_id, ...updateData } = measurementData;

            const { data, error } = await supabase
                .from('growth_measurements')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['growth_measurements', variables.child_id] });
        },
    });
}

export function useDeleteGrowthMeasurement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const { error } = await supabase
                .from('growth_measurements')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        },
        onSuccess: (_, variables: any) => {
            // We invalidate the whole growth_measurements query, but it requires child_id to be exact. Let's just invalidate all growth_measurements lists.
            queryClient.invalidateQueries({ queryKey: ['growth_measurements'] });
        },
    });
}
// ==========================================
// NEW HEALTH TRACKING HOOKS
// ==========================================

export function useVaccinations(childId: string | undefined) {
    return useQuery({
        queryKey: ['vaccinations', childId],
        enabled: !!childId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vaccinations')
                .select('*')
                .eq('child_id', childId)
                .order('given_date', { ascending: false });
            if (error) throw error;
            return data;
        },
    });
}

export function useLogVaccination() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ childId, vaccineName, doseNumber, givenDate, notes }: {
            childId: string;
            vaccineName: string;
            doseNumber: number;
            givenDate: string;
            notes?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('vaccinations')
                .insert({
                    child_id: childId,
                    vaccine_name: vaccineName,
                    dose_number: doseNumber,
                    given_date: givenDate,
                    notes,
                    recorded_by: user.id
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['vaccinations', variables.childId] });
        },
    });
}

export function useHealthLogs(childId: string | undefined) {
    return useQuery({
        queryKey: ['health_logs', childId],
        enabled: !!childId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('health_logs')
                .select('*')
                .eq('child_id', childId)
                .order('log_date', { ascending: false })
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
    });
}

export function useCreateHealthLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ childId, logDate, symptoms, severity, notes, photoUrl }: {
            childId: string;
            logDate: string;
            symptoms: string[];
            severity: string;
            notes?: string;
            photoUrl?: string;
        }) => {
            const { data, error } = await supabase
                .from('health_logs')
                .insert({
                    child_id: childId,
                    log_date: logDate,
                    symptoms,
                    severity,
                    notes,
                    photo_url: photoUrl,
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['health_logs', variables.childId] });
        },
    });
}
