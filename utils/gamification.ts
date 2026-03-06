export const getPointsForObservation = (observation: any): number => {
    let points = 10;
    if (observation.note && observation.note.trim().length > 0) {
        points += 5;
    }
    return points;
};

export const getGamificationTier = (totalPoints: number, isNewborn: boolean = false) => {
    if (isNewborn && totalPoints < 50) return { label: 'New Beginning', emoji: '✨', color: '#8DC63F', min: 0, max: 49, next: 50 };
    if (totalPoints < 50) return { label: 'Seedling', emoji: '🌱', color: '#8DC63F', min: 0, max: 49, next: 50 };
    if (totalPoints < 150) return { label: 'Sprout', emoji: '🌿', color: '#4ECDC4', min: 50, max: 149, next: 150 };
    if (totalPoints < 300) return { label: 'Blossom', emoji: '🌸', color: '#F5A623', min: 150, max: 299, next: 300 };
    return { label: 'Guardian Tree', emoji: '🌳', color: '#A67BB5', min: 300, max: Infinity, next: null };
};

export const calculateStreak = (observations: any[]): number => {
    if (!observations || observations.length === 0) return 0;

    // Get unique dates sorted descending (YYYY-MM-DD)
    const uniqueDates = [...new Set(observations.map(o => {
        const date = new Date(o.created_at || o.earned_at);
        return date.toISOString().split('T')[0];
    }))].sort((a, b) => b.localeCompare(a));

    if (uniqueDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterdayArr = new Date();
    yesterdayArr.setDate(yesterdayArr.getDate() - 1);
    const yesterday = yesterdayArr.toISOString().split('T')[0];

    // If no activity today OR yesterday, streak is zero or broken
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

    let streak = 0;
    let expectedDate = new Date(uniqueDates[0]);

    for (const dateStr of uniqueDates) {
        if (dateStr === expectedDate.toISOString().split('T')[0]) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};
