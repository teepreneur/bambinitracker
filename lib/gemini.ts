import { supabase } from './supabase';

// Gemini now runs server-side in the `ai` Supabase Edge Function so the API key
// never ships in the app bundle. This module is a thin, typed client that
// forwards structured inputs and returns the same shapes callers already use.

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

async function invokeAi<T>(action: string, payload: unknown): Promise<T> {
    const { data, error } = await supabase.functions.invoke('ai', {
        body: { action, payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as T;
}

export async function generateActivities(
    ageDays: number,
    count: number = 5,
    recentFeedback: RecentFeedback[] = [],
    existingTitles: string[] = [],
    emergingMilestones: string[] = []
): Promise<GeneratedActivity[]> {
    try {
        const { activities } = await invokeAi<{ activities: GeneratedActivity[] }>(
            'generate_activities',
            { ageDays, count, recentFeedback, existingTitles, emergingMilestones }
        );
        return activities || [];
    } catch (error) {
        console.error('Error generating activities:', error);
        throw error;
    }
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

    try {
        const { insight } = await invokeAi<{ insight: AISynthesizedInsight | null }>(
            'synthesize_milestones',
            { childName, ageMonths, observations, potentialMilestones }
        );
        return insight;
    } catch (error) {
        console.error('Error synthesizing milestone insights:', error);
        return null;
    }
}
