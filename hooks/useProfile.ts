import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Fetch current user and profile */
export function useProfile() {
    return useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Not authenticated');

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                if (__DEV__) console.error('[useProfile] Error fetching profile:', error);
                throw error;
            }

            return { ...profile, authUser: user };
        },
        staleTime: 0,
    });
}

/** Mutation: Update the current user's profile */
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
