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

export const getDomainColor = (domain: string) => {
    switch (domain?.toLowerCase()) {
        case 'cognitive': return '#A67BB5'; // Purple
        case 'gross motor': return '#8DC63F'; // Green
        case 'fine motor': return '#3B82F6'; // Blue
        case 'sensory': return '#EC4899'; // Pink
        case 'language': return '#F5A623'; // Orange
        case 'social': return '#4ECDC4'; // Turquoise
        case 'creative': return '#FFD166'; // Yellow/Gold
        default: return '#A67BB5';
    }
};

export const getDynamicGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
};
