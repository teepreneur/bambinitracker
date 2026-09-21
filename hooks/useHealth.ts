import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Fetch vaccinations for a child */
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

/** Mutation: Log a vaccination */
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

/** Fetch health logs for a child */
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

/** Mutation: Create a health log entry */
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
