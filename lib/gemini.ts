/**
 * Gemini AI integration — client-side proxy layer.
 * 
 * All Gemini calls are routed through a Supabase Edge Function (`gemini-proxy`)
 * so the API key is NEVER exposed in the client bundle.
 */
import { supabase } from '@/lib/supabase';

// Define the activity structure expected by the app.
export interface GeneratedActivity {
    title: string;
    description: string;
    domain: 'Cognitive' | 'Motor' | 'Language' | 'Social' | 'Sensory';
    estimated_time: string; // e.g., "10 min"
    target_age_months: number;
    target_milestone?: string;
    instructions?: string[];
    materials?: string[];
    tips?: string[];
}

// Define recent feedback structure
export interface RecentFeedback {
    title: string;
    rating: string;
    note: string;
}

export async function generateActivities(
    ageDays: number,
    count: number = 5,
    recentFeedback: RecentFeedback[] = [],
    existingTitles: string[] = [],
    emergingMilestones: string[] = []
): Promise<GeneratedActivity[]> {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: {
            action: 'generate-activities',
            ageDays,
            count,
            recentFeedback,
            existingTitles,
            emergingMilestones,
        },
    });

    if (error) {
        console.error("Error calling gemini-proxy for activities:", error);
        throw new Error(error.message || 'Failed to generate activities');
    }

    // The Edge Function returns the validated array directly
    return data as GeneratedActivity[];
}

export interface AISynthesizedInsight {
    milestone_id: string;
    suggested_status: 'achieved' | 'emerging';
    reasoning: string;
}

export async function synthesizeMilestoneInsights(
    childName: string,
    ageMonths: number,
    observations: { title: string; note: string; domain: string }[],
    potentialMilestones: { id: string; title: string; description: string; domain: string }[]
): Promise<AISynthesizedInsight | null> {
    if (observations.length === 0 || potentialMilestones.length === 0) return null;

    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: {
            action: 'synthesize-milestones',
            childName,
            ageMonths,
            observations,
            potentialMilestones,
        },
    });

    if (error) {
        console.error("Error calling gemini-proxy for milestone synthesis:", error);
        return null;
    }

    return data as AISynthesizedInsight | null;
}
