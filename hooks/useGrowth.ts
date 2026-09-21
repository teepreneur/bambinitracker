import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Fetch growth measurements for a child (chronological order for charts) */
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

/** Mutation: Add a new growth measurement */
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

/** Mutation: Update an existing growth measurement */
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

/** Mutation: Delete a growth measurement */
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth_measurements'] });
        },
    });
}
