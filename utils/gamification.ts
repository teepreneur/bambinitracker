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

const getLocalDateString = (dateInput: any) => {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const calculateStreak = (observations: any[]): number => {
    if (!observations || observations.length === 0) return 0;

    // Get unique dates sorted descending (YYYY-MM-DD) in LOCAL time
    const uniqueDates = [...new Set(observations.map(o => 
        getLocalDateString(o.created_at || o.earned_at)
    ))].sort((a, b) => b.localeCompare(a));

    if (uniqueDates.length === 0) return 0;

    const today = getLocalDateString(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDateString(yesterdayDate);

    // If no activity today OR yesterday, streak is zero or broken
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

    let streak = 0;
    let expectedDate = new Date(uniqueDates[0] + 'T12:00:00'); // Use mid-day to avoid TZ shifts when subtracting days

    for (const dateStr of uniqueDates) {
        if (dateStr === getLocalDateString(expectedDate)) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};
