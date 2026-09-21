import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Fetch children for the authenticated user */
export function useChildren() {
    return useQuery({
        queryKey: ['children'],
        queryFn: async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('parent_children')
                .select(`
                    child_id,
                    children (*)
                `)
                .eq('parent_id', user.id);

            if (error) throw error;

            return data.map((pc: any) => pc.children).filter(Boolean);
        },
        staleTime: 0,
    });
}

/** Mutation: Update a child's details */
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

/** Mutation: Delete a child (remove from parent_children junction + optionally delete child record) */
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

/** Mutation: Generate a teacher invite code for a child */
export function useGenerateInviteCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Generate a cryptographically secure 6-character alphanumeric code
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
            const randomBytes = new Uint8Array(6);
            crypto.getRandomValues(randomBytes);
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(randomBytes[i] % chars.length);
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
        },
    });
}
