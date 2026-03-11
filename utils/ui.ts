export const getActivityEmoji = (title: string): string => {
    const t = title.toLowerCase();

    // Physical
    if (t.includes('balloon')) return '🎈';
    if (t.includes('obstacle') || t.includes('crawl')) return '👟';
    if (t.includes('marching') || t.includes('band')) return '🥁';
    if (t.includes('bubble')) return '🫧';
    if (t.includes('animal')) return '🦆';
    if (t.includes('dance')) return '💃';
    if (t.includes('simon')) return '👂';
    if (t.includes('hopscotch')) return '🦶';
    if (t.includes('kick') || t.includes('ball')) return '⚽';
    if (t.includes('cup')) return '🥤';
    if (t.includes('bead')) return '📿';
    if (t.includes('tong') || t.includes('transfer')) return '🥢';

    // Cognitive
    if (t.includes('peek')) return '🫣';
    if (t.includes('shape') || t.includes('peg')) return '🟦';
    if (t.includes('color')) return '🎨';
    if (t.includes('puzzle')) return '🧩';
    if (t.includes('memory')) return '🧠';

    // Language
    if (t.includes('rhyme') || t.includes('sing') || t.includes('song')) return '🎤';
    if (t.includes('book') || t.includes('read') || t.includes('story')) return '📖';
    if (t.includes('body')) return '👶';
    if (t.includes('sound')) return '🔊';

    // Social
    if (t.includes('pass')) return '🤲';
    if (t.includes('emotion') || t.includes('feeling')) return '🎭';
    if (t.includes('clean')) return '🧹';

    // Creative & Sensory
    if (t.includes('paint') || t.includes('dough')) return '🖌️';
    if (t.includes('water')) return '💧';
    if (t.includes('sand')) return '🏖️';
    if (t.includes('bin') || t.includes('shaker')) return '✨';
    if (t.includes('scissor') || t.includes('cut')) return '✂️';
    if (t.includes('draw')) return '📝';

    return '🌟';
};

// ─── Centralized Domain Configuration ────────────────────────────────────────
// Single source of truth for domain keys, labels, colors, and emojis.
// Import this everywhere instead of duplicating domain lists.

export interface DomainConfig {
    key: string;      // Lowercase DB key, e.g. 'cognitive'
    label: string;    // Display label, e.g. 'Cognitive'
    color: string;    // Brand color hex
    emoji: string;    // Representative emoji
}

export const DOMAIN_CONFIG: DomainConfig[] = [
    { key: 'cognitive', label: 'Cognitive', color: '#A67BB5', emoji: '🧠' },
    { key: 'gross motor', label: 'Gross Motor', color: '#8DC63F', emoji: '💪' },
    { key: 'fine motor', label: 'Fine Motor', color: '#3B82F6', emoji: '✋' },
    { key: 'language', label: 'Language', color: '#F5A623', emoji: '🗣️' },
    { key: 'social', label: 'Social', color: '#4ECDC4', emoji: '🤝' },
    { key: 'creative', label: 'Creative', color: '#FFD166', emoji: '🎨' },
    { key: 'sensory', label: 'Sensory', color: '#EC4899', emoji: '👁️' },
];

/** Domain labels array (for filter pills, etc.) */
export const DOMAINS = DOMAIN_CONFIG.map(d => d.label);

/** Get color for a domain key or label */
export const getDomainColor = (domain: string): string => {
    const d = DOMAIN_CONFIG.find(c => c.key === domain?.toLowerCase() || c.label === domain);
    return d?.color ?? '#A67BB5';
};

/** Get emoji for a domain key or label */
export const getDomainEmoji = (domain: string): string => {
    const d = DOMAIN_CONFIG.find(c => c.key === domain?.toLowerCase() || c.label === domain);
    return d?.emoji ?? '📌';
};

export const getDynamicGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
};
