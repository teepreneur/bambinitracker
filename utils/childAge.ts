/**
 * Shared child age calculation utilities.
 * Single source of truth — import this everywhere instead of inline date math.
 */

export interface AgeBreakdown {
    days: number;
    weeks: number;
    months: number;
    years: number;
}

/** Calculate raw age values from a date-of-birth string */
export function getAgeBreakdown(dob: string | undefined): AgeBreakdown {
    if (!dob) return { days: 0, weeks: 0, months: 0, years: 0 };

    const birthDate = new Date(dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    birthDate.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - birthDate.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.4375);
    const years = Math.floor(months / 12);

    return { days, weeks, months, years };
}

/** Get age in months (convenience shorthand) */
export function getAgeInMonths(dob: string | undefined): number {
    return getAgeBreakdown(dob).months;
}

/** Human-readable age label, e.g. "3 days old", "2 weeks old", "6 months old", "2 years old" */
export function getChildAgeLabel(dob: string | undefined): string {
    const { days, weeks, months, years } = getAgeBreakdown(dob);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} old`;
    if (days < 30) return `${weeks} week${weeks !== 1 ? 's' : ''} old`;
    if (months < 24) return `${months} month${months !== 1 ? 's' : ''} old`;
    return `${years} year${years !== 1 ? 's' : ''} old`;
}

/** Short age string for compact UIs, e.g. "3 days", "2 wk", "6 mo", "2 yr" */
export function getChildAgeShort(dob: string | undefined): string {
    const { days, weeks, months, years } = getAgeBreakdown(dob);
    if (days < 7) return `${days} days`;
    if (days < 30) return `${weeks} wk`;
    if (months < 24) return `${months} mo`;
    return `${years} yr${years > 1 ? 's' : ''}`;
}

/** Developmental stage label based on age */
export function getStageLabel(dob: string | undefined): string {
    const { days, months } = getAgeBreakdown(dob);
    if (days < 25) return 'Newborn Stage';
    if (months < 3) return 'Early Infant';
    if (months < 12) return 'Infant Phase';
    if (months < 24) return 'Young Toddler';
    if (months < 36) return 'Toddler Stage';
    return 'Preschooler';
}

/** Whether the child is in the newborn phase (< 25 days) */
export function isNewborn(dob: string | undefined): boolean {
    return getAgeBreakdown(dob).days < 25;
}
