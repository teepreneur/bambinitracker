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

// Fetch basic observations (mocked for now until we build the Timeline)
export function useUserObservations() {
    return useQuery({
        queryKey: ['observations'],
        queryFn: async () => {
            return [];
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

// Fetch activities assigned to a specific child, cross-referenced with observations for completion
export function useChildActivities(childId?: string, ageDays?: number) {
    return useQuery({
        queryKey: ['child_activities', childId, 'v4'],
        enabled: !!childId,
        queryFn: async () => {
            console.log(`[useChildActivities] Hook Fired! childId: ${childId}, ageDays: ${ageDays}`);

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

            // 3. If we have enough activities (at least 3), return them (cap at 5)
            if (existingActivities && existingActivities.length >= 3) {
                console.log("[useChildActivities] Returning existing activities directly.");
                return existingActivities.slice(0, 5).map((ca: any) => ({
                    ...ca.activities,
                    id: ca.activities.id,
                    assignment_id: ca.id,
                    isCompleted: completedActivityIds.has(ca.activity_id),
                }));
            }

            // 4. Otherwise, generate new activities via Gemini AI
            console.log("[useChildActivities] Generating new batch via Gemini API...");
            try {
                const count = (ageDays || 0) < 25 ? 4 : 5;
                const newGenerated = await generateActivities(ageDays || 0, count);
                console.log(`[useChildActivities] Gemini successfully returned ${newGenerated.length} activities.`);

                if (newGenerated.length === 0) {
                    return existingActivities ? existingActivities.map((ca: any) => ({
                        ...ca.activities, id: ca.activities.id, assignment_id: ca.id, isCompleted: completedActivityIds.has(ca.activity_id)
                    })) : [];
                }

                // 5. Insert the newly generated activities into the `activities` catalog
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

                if (insertError) {
                    console.error("[useChildActivities] Failed to insert activities:", insertError);
                    throw insertError;
                }

                // 6. Assign these new activities to the child
                const assignmentsToInsert = insertedActivities.map(a => ({
                    child_id: childId,
                    activity_id: a.id,
                    assigned_at: new Date().toISOString()
                }));

                const { data: insertedAssignments, error: assignError } = await supabase
                    .from('child_activities')
                    .insert(assignmentsToInsert)
                    .select();

                if (assignError) {
                    console.error("[useChildActivities] Failed to assign activities:", assignError);
                    throw assignError;
                }

                // 7. Combine and return
                const newlyFormatted = insertedAssignments.map((ca: any) => {
                    const act = insertedActivities.find(a => a.id === ca.activity_id);
                    return { ...act, id: act.id, assignment_id: ca.id, isCompleted: false };
                });

                const existingFormatted = (existingActivities || []).map((ca: any) => ({
                    ...ca.activities, id: ca.activities.id, assignment_id: ca.id,
                    isCompleted: completedActivityIds.has(ca.activity_id)
                }));

                return [...existingFormatted, ...newlyFormatted];
            } catch (err: any) {
                console.error("Hook catch block caught error:", err);
                Alert.alert("Activity Error", err.message || "Failed to generate activities.");
                return existingActivities ? existingActivities.map((ca: any) => ({
                    ...ca.activities, id: ca.activities.id, assignment_id: ca.id, isCompleted: false
                })) : [];
            }
        },
    });
}

// Mutation: Mark an activity as completed by inserting an observation
export function useCompleteActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ childId, activityId }: { childId: string; activityId: string }) => {
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
                    rating: 'completed',
                    note: 'Activity completed',
                    location_type: 'home',
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate activities so the home screen updates
            queryClient.invalidateQueries({ queryKey: ['child_activities'] });
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

            if (error) throw error;
            return data;
        },
    });
}
