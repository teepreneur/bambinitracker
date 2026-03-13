import { generateActivities } from '@/lib/gemini';
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
            console.log(`[useChildActivities] Fired! childId: ${childId}, ageDays: ${ageDays}, date: ${currentDate}`);

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

            if (fetchError) {
                console.error("[useChildActivities] Supabase Fetch Error:", fetchError);
                throw fetchError;
            }

            // 2. Fetch observations for this child to determine completion status
            const { data: observations } = await supabase
                .from('observations')
                .select('activity_id')
                .eq('child_id', childId);

            const completedActivityIds = new Set(
                (observations || []).map((o: any) => o.activity_id)
            );

            console.log(`[useChildActivities] Found ${existingActivities?.length || 0} existing activities, ${completedActivityIds.size} completed.`);

            // 3. Categorize Assignments
            const todayAssignments = existingActivities.filter(a => a.assigned_at?.startsWith(currentDate!));
            const pastAssignments = existingActivities.filter(a => !a.assigned_at?.startsWith(currentDate!));

            const completedToday = todayAssignments.filter(a => completedActivityIds.has(a.activity_id));
            const incompleteToday = todayAssignments.filter(a => !completedActivityIds.has(a.activity_id));
            const pastIncomplete = pastAssignments.filter(a => !completedActivityIds.has(a.activity_id));

            let finalActivitiesForToday = [...completedToday, ...incompleteToday];
            let slotsNeeded = 5 - finalActivitiesForToday.length;

            console.log(`[useChildActivities] Today has ${finalActivitiesForToday.length} acts. Slots needed: ${slotsNeeded}. Past incomplete available: ${pastIncomplete.length}`);

            // 4. ROLLOVER LOGIC
            if (slotsNeeded > 0 && pastIncomplete.length > 0) {
                const toRollOver = pastIncomplete.slice(0, slotsNeeded);
                console.log(`[useChildActivities] Rolling over ${toRollOver.length} past activities to today.`);

                const { error: rollError } = await supabase
                    .from('child_activities')
                    .update({ assigned_at: new Date().toISOString() })
                    .in('id', toRollOver.map(a => a.id));

                if (rollError) {
                    console.error("[useChildActivities] Failed to auto-rollover:", rollError);
                } else {
                    finalActivitiesForToday = [...finalActivitiesForToday, ...toRollOver];
                    slotsNeeded -= toRollOver.length;

                    // We invalidate the cache to trigger a clean refetch 
                    // (though optimistic update here works too)
                }
            }

            // 5. TOP-OFF LOGIC
            if (slotsNeeded > 0) {
                console.log(`[useChildActivities] Generating ${slotsNeeded} fresh activities via Gemini...`);
                try {
                    // Fetch recent feedback to guide the AI
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

                    const existingTitles = finalActivitiesForToday.map((a: any) => a.activities?.title || a.title).filter(Boolean);

                    // Fetch "emerging" milestones to hyper-personalize the generated activities
                    const { data: emergingMilestonesData } = await supabase
                        .from('child_milestones')
                        .select(`
                            status,
                            milestones_catalog!inner(title)
                        `)
                        .eq('child_id', childId)
                        .eq('status', 'emerging')
                        .limit(3);

                    const emergingMilestones = (emergingMilestonesData || [])
                        .map((m: any) => m.milestones_catalog?.title)
                        .filter(Boolean);

                    console.log(`[useChildActivities] Found ${emergingMilestones.length} emerging milestones to target.`);

                    const newGenerated = await generateActivities(ageDays || 0, slotsNeeded, recentFeedback, existingTitles, emergingMilestones);
                    console.log(`[useChildActivities] Gemini successfully returned ${newGenerated.length} activities.`);

                    if (newGenerated.length > 0) {
                        // Insert the newly generated activities into the `activities` catalog
                        const currentAgeDays = ageDays || 0;
                        let ageBand = '0-3 months';
                        if (currentAgeDays < 90) ageBand = '0-3 months';
                        else if (currentAgeDays < 180) ageBand = '3-6 months';
                        else if (currentAgeDays < 365) ageBand = '6-12 months';
                        else if (currentAgeDays < 730) ageBand = '12-24 months';
                        else if (currentAgeDays < 1095) ageBand = '24-36 months';
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
                        }));

                        const { data: insertedActivities, error: insertError } = await supabase
                            .from('activities')
                            .insert(activitiesToInsert)
                            .select();

                        if (insertError) throw insertError;

                        // Assign these new activities to the child
                        const assignmentsToInsert = insertedActivities.map(a => ({
                            child_id: childId,
                            activity_id: a.id,
                            assigned_at: new Date().toISOString()
                        }));

                        const { data: insertedAssignments, error: assignError } = await supabase
                            .from('child_activities')
                            .insert(assignmentsToInsert)
                            .select();

                        if (assignError) throw assignError;

                        // Add to our final pool
                        const newlyFormatted = insertedAssignments.map((ca: any) => {
                            const act = insertedActivities.find(a => a.id === ca.activity_id);
                            return {
                                id: ca.id,
                                assigned_at: ca.assigned_at,
                                activity_id: ca.activity_id,
                                activities: act
                            };
                        });
                        finalActivitiesForToday = [...finalActivitiesForToday, ...newlyFormatted];
                    }
                } catch (err: any) {
                    console.error("Hook catch block caught error during top-off:", err);
                    Alert.alert("Activity Error", err.message || "Failed to generate top-off activities.");
                }
            }

            // 6. Return Formatting
            return finalActivitiesForToday.map((ca: any) => ({
                ...ca.activities,
                id: ca.activities.id,
                assignment_id: ca.id,
                isCompleted: completedActivityIds.has(ca.activity_id)
            }));
        },
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
        onSuccess: () => {
            // Invalidate activities so the home screen updates
            queryClient.invalidateQueries({ queryKey: ['child_activities'] });
            queryClient.invalidateQueries({ queryKey: ['observations'] });
        },
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
        onSuccess: (_, variables) => {
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
