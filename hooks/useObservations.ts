import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

/** Fetch observations for the current user's children */
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
                if (__DEV__) console.error('[useUserObservations] Error:', error);
                return [];
            }

            return observations || [];
        },
    });
}

/** Fetch a child's chronological observation history (completed activities) */
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
                if (__DEV__) console.error('[useChildObservations] Fetch error:', error);
                throw error;
            }
            return data;
        },
    });
}
