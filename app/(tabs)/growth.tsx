import { BambiniText } from '@/components/design-system/BambiniText';
import { ChildAvatar } from '@/components/design-system/ChildAvatar';
import { GrowthChartsTab } from '@/components/GrowthChartsTab';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
    MilestoneStatus,
    useChildMilestones,
    useChildObservations,
    useChildren,
    useMilestonesCatalog,
    useToggleChildMilestone
} from '@/hooks/useData';
import { getAgeInMonths } from '@/utils/childAge';
import { DOMAIN_CONFIG, getDomainColor, getDomainEmoji } from '@/utils/ui';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { G, Line, Polygon, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.78;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE * 0.36;

// Use centralized DOMAIN_CONFIG from utils/ui.ts for the radar chart
const RADAR_DOMAINS = DOMAIN_CONFIG;


/** Convert a MilestoneStatus to a numeric score for the radar */
function statusScore(status: MilestoneStatus | undefined): number {
    if (status === 'achieved') return 1.0;
    if (status === 'emerging') return 0.5;
    return 0;
}

function radarCoord(value: number, index: number, total: number) {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * RADIUS;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

// ─── Root Screen ─────────────────────────────────────────────────────────────

export default function GrowthScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const [activeTab, setActiveTab] = useState<'Overview' | 'Milestones' | 'Timeline' | 'Health'>('Overview');
    const [selectedChildIndex, setSelectedChildIndex] = useState(0);

    const { data: children, isLoading: loadingChildren } = useChildren();
    const child = children?.[selectedChildIndex];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: '#f9f5ea' }]}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <BambiniText variant="h1" weight="bold" color={theme.text} style={{ fontSize: 24 }}>
                        Growth
                    </BambiniText>
                    <BambiniText variant="caption" color={theme.textSecondary}>
                        Developmental milestone tracker
                    </BambiniText>
                </View>
            </View>

            {/* Child Selector */}
            {loadingChildren ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginBottom: 24 }} />
            ) : children && children.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 24 }}
                    contentContainerStyle={{ paddingHorizontal: 2, gap: 10 }}
                >
                    {children.map((c: any, i: number) => {
                        const isSelected = i === selectedChildIndex;
                        return (
                            <TouchableOpacity
                                key={c.id}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedChildIndex(i);
                                }}
                                style={[
                                    styles.childChip,
                                    {
                                        backgroundColor: isSelected ? theme.primary : theme.surface,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                    },
                                ]}
                            >
                                <ChildAvatar photoUrl={c.photo_url} size={28} />
                                <BambiniText
                                    variant="caption"
                                    weight={isSelected ? 'bold' : 'medium'}
                                    color={isSelected ? '#FFFFFF' : theme.text}
                                    style={{ marginLeft: 6 }}
                                >
                                    {c.name}
                                </BambiniText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            ) : null}

            {/* Tab Switcher */}
            <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {(['Overview', 'Milestones', 'Timeline', 'Health'] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabSegment, isActive && { backgroundColor: theme.primary }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTab(tab);
                            }}
                        >
                            <BambiniText
                                variant="caption"
                                weight={isActive ? 'bold' : 'medium'}
                                color={isActive ? '#FFFFFF' : theme.text}
                            >
                                {tab}
                            </BambiniText>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Content */}
            {!child ? (
                <View style={styles.emptyState}>
                    <BambiniText variant="body" color={theme.textSecondary}>
                        No child profile found. Add a child to get started.
                    </BambiniText>
                </View>
            ) : activeTab === 'Overview' ? (
                <OverviewTab childId={child.id} childName={child.name} theme={theme} />
            ) : activeTab === 'Milestones' ? (
                <MilestonesTab childId={child.id} childDob={child.dob} theme={theme} />
            ) : activeTab === 'Timeline' ? (
                <TimelineTab childId={child.id} childName={child.name} theme={theme} />
            ) : (
                <GrowthChartsTab child={child} theme={theme} />
            )}
        </ScrollView>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ childId, childName, theme }: { childId: string; childName: string; theme: any }) {
    const { data: catalog } = useMilestonesCatalog();
    const { data: achievedMilestones, isLoading } = useChildMilestones(childId);
    const { data: observations } = useChildObservations(childId);
    const { mutate: toggleMilestone } = useToggleChildMilestone();

    // Local state to hide prompts that the user dismissed during this session
    const [hiddenPrompts, setHiddenPrompts] = useState<Record<string, boolean>>({});

    // Build a map: milestone_id → status
    const statusMap = useMemo(() => {
        const map: Record<string, MilestoneStatus> = {};
        achievedMilestones?.forEach((cm: any) => {
            map[cm.milestone_id] = cm.status as MilestoneStatus;
        });
        return map;
    }, [achievedMilestones]);

    // Compute domain scores (0-100) weighted by status
    const domainScores = useMemo(() => {
        if (!catalog) return RADAR_DOMAINS.map(() => 0);
        return RADAR_DOMAINS.map(({ key }) => {
            const items = catalog.filter((m: any) => m.domain?.toLowerCase() === key);
            if (items.length === 0) return 0;
            const score = items.reduce((sum: number, m: any) => sum + statusScore(statusMap[m.id]), 0);
            return Math.round((score / items.length) * 100);
        });
    }, [catalog, statusMap]);

    const totalAnswered = Object.keys(statusMap).length;
    const totalAchieved = Object.values(statusMap).filter(s => s === 'achieved').length;
    const totalMilestones = catalog?.length ?? 0;
    const overallPct = totalMilestones > 0 ? Math.round((totalAchieved / totalMilestones) * 100) : 0;

    const radarPoints = RADAR_DOMAINS.map((_, i) => radarCoord(domainScores[i] || 2, i, RADAR_DOMAINS.length));
    const radarPolygonPoints = radarPoints.map(p => `${p.x},${p.y}`).join(' ');
    const gridRings = [20, 40, 60, 80, 100].map(pct =>
        RADAR_DOMAINS.map((_, i) => radarCoord(pct, i, RADAR_DOMAINS.length)).map(p => `${p.x},${p.y}`).join(' ')
    );

    // Smart Prompt: Recommend the next milestone from the highest played domain
    const smartPromptData = useMemo(() => {
        if (!observations || observations.length === 0 || !catalog) return null;

        // Tally up completed domains
        const domainCounts: Record<string, number> = {};
        observations.forEach((obs: any) => {
            const domain = obs.activities?.domain;
            if (domain) {
                domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            }
        });

        if (Object.keys(domainCounts).length === 0) return null;

        // Find the domain with the most completed activities
        const topDomain = Object.keys(domainCounts).reduce((a, b) => domainCounts[a] > domainCounts[b] ? a : b);

        // Filter catalog for that domain, and remove achieved milestones OR locally hidden ones
        const availableMilestones = catalog.filter((m: any) => {
            if (m.domain?.toLowerCase() !== topDomain.toLowerCase()) return false;
            return statusMap[m.id] !== 'achieved' && !hiddenPrompts[m.id];
        });

        if (availableMilestones.length === 0) return null;

        return {
            domain: topDomain,
            count: domainCounts[topDomain],
            milestone: availableMilestones[0]
        };
    }, [observations, catalog, statusMap, hiddenPrompts]);

    return (
        <View>
            {/* Smart Milestone Prompt */}
            {smartPromptData && (
                <View style={[styles.nudgeBanner, { backgroundColor: `${getDomainColor(smartPromptData.domain)}15`, borderWidth: 1, borderColor: `${getDomainColor(smartPromptData.domain)}40`, marginBottom: 16, width: '100%' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <BambiniText variant="caption" weight="bold" color={getDomainColor(smartPromptData.domain)}>
                            💡 Smart Observation Prompt
                        </BambiniText>
                    </View>
                    <BambiniText variant="body" color={theme.text}>
                        {childName} has completed {smartPromptData.count} <BambiniText variant="body" weight="bold" color={getDomainColor(smartPromptData.domain)}>{getDomainEmoji(smartPromptData.domain)} {smartPromptData.domain}</BambiniText> activities recently! Is {childName} showing signs of:
                    </BambiniText>
                    <View style={{ backgroundColor: '#ffffffaa', padding: 10, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#0000000a' }}>
                        <BambiniText variant="body" weight="medium" color={theme.text} style={{ fontStyle: 'italic' }}>
                            "{smartPromptData.milestone.title}"
                        </BambiniText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            style={[styles.stageChip, { flex: 1, backgroundColor: getDomainColor(smartPromptData.domain), borderColor: getDomainColor(smartPromptData.domain), alignItems: 'center' }]}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                toggleMilestone({
                                    childId,
                                    milestoneId: smartPromptData.milestone.id,
                                    status: 'achieved'
                                });
                            }}
                        >
                            <BambiniText variant="caption" weight="bold" color="#FFFFFF">Yes, Mastered!</BambiniText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.stageChip, { flex: 1, backgroundColor: `${getDomainColor(smartPromptData.domain)}15`, borderColor: getDomainColor(smartPromptData.domain), alignItems: 'center' }]}
                            onPress={() => {
                                setHiddenPrompts(prev => ({ ...prev, [smartPromptData.milestone.id]: true }));
                            }}
                        >
                            <BambiniText variant="caption" weight="bold" color={getDomainColor(smartPromptData.domain)}>Not Yet</BambiniText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <BambiniText variant="h3" weight="bold" color={theme.text}>
                    {childName}'s Development
                </BambiniText>
                <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 4 }}>
                    {totalAnswered} of {totalMilestones} milestones assessed · {totalAchieved} fully achieved
                </BambiniText>
                <View style={[styles.progressTrack, { backgroundColor: theme.border, marginTop: 12 }]}>
                    <View style={[styles.progressFill, { width: `${overallPct}%` as any, backgroundColor: theme.primary }]} />
                </View>
                <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 6, fontStyle: 'italic' }}>
                    Go to Milestones tab to record progress on each area
                </BambiniText>
            </View>

            {/* Radar Chart */}
            {isLoading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : (
                <View style={[styles.chartWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <BambiniText variant="caption" weight="bold" color={theme.textSecondary} style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Domain Radar
                    </BambiniText>
                    <Svg height={CHART_SIZE} width={CHART_SIZE}>
                        {gridRings.map((pts, idx) => (
                            <Polygon key={`ring-${idx}`} points={pts} fill="none" stroke={theme.border} strokeWidth="1" />
                        ))}
                        {RADAR_DOMAINS.map((_, i) => {
                            const end = radarCoord(100, i, RADAR_DOMAINS.length);
                            return <Line key={`axis-${i}`} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke={theme.border} strokeWidth="1" />;
                        })}
                        <G>
                            <Polygon points={radarPolygonPoints} fill={theme.primary} fillOpacity="0.22" stroke={theme.primary} strokeWidth="2.5" />
                            {radarPoints.map((pt, i) => (
                                <SvgCircle key={`dot-${i}`} cx={pt.x} cy={pt.y} r="5" fill={RADAR_DOMAINS[i].color} />
                            ))}
                        </G>
                        {RADAR_DOMAINS.map((d, i) => {
                            const lp = radarCoord(120, i, RADAR_DOMAINS.length);
                            return (
                                <SvgText key={`lbl-${i}`} x={lp.x} y={lp.y + 4} fontSize="10" fill={theme.text} textAnchor="middle" fontWeight="600">
                                    {d.label}
                                </SvgText>
                            );
                        })}
                    </Svg>
                </View>
            )}

            {/* Domain Progress bars */}
            <View style={styles.legendGrid}>
                {RADAR_DOMAINS.map((d, i) => (
                    <View key={d.key} style={[styles.legendItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                                <BambiniText variant="caption" weight="semibold" color={theme.text} style={{ marginLeft: 6 }}>
                                    {d.label}
                                </BambiniText>
                            </View>
                            <BambiniText variant="caption" color={theme.textSecondary}>{domainScores[i]}%</BambiniText>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                            <View style={[styles.progressFill, { width: `${domainScores[i]}%` as any, backgroundColor: d.color }]} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

// ─── Age Stage Config ────────────────────────────────────────────────────────

const AGE_STAGES = [
    { label: '0–3m', shortLabel: '0–3m', minAge: 0, maxAge: 3 },
    { label: '3–6m', shortLabel: '3–6m', minAge: 3, maxAge: 6 },
    { label: '6–9m', shortLabel: '6–9m', minAge: 6, maxAge: 9 },
    { label: '9–12m', shortLabel: '9–12m', minAge: 9, maxAge: 12 },
    { label: '1–1.5y', shortLabel: '1–1.5y', minAge: 12, maxAge: 18 },
    { label: '1.5–2y', shortLabel: '1.5–2y', minAge: 18, maxAge: 24 },
    { label: '2–3 yrs', shortLabel: '2–3y', minAge: 24, maxAge: 36 },
    { label: '3–4 yrs', shortLabel: '3–4y', minAge: 36, maxAge: 48 },
    { label: '4–5 yrs', shortLabel: '4–5y', minAge: 48, maxAge: 60 },
    { label: '5–6 yrs', shortLabel: '5–6y', minAge: 60, maxAge: 73 },
];

// getDomainEmoji is now imported from '@/utils/ui'

const TIP_MASCOTS = ['🦥', '🧸', '🐣', '🌟', '🐰', '🦉', '🐝', '🧑‍🍳'];

// ─── Milestones Tab ───────────────────────────────────────────────────────────

// getAgeInMonths is now imported from '@/utils/childAge'

function getDefaultStageIndex(ageMonths: number): number {
    for (let i = AGE_STAGES.length - 1; i >= 0; i--) {
        if (ageMonths >= AGE_STAGES[i].minAge) return i;
    }
    return 0;
}

const STATUS_OPTIONS: { label: string; value: MilestoneStatus; color: string }[] = [
    { label: 'Not Yet', value: 'not_yet', color: '#9CA3AF' },
    { label: 'Sometimes', value: 'emerging', color: '#F5A623' },
    { label: 'Yes! ✓', value: 'achieved', color: '#22C55E' },
];

function MilestonesTab({ childId, childDob, theme }: { childId: string; childDob?: string; theme: any }) {
    const ageMonths = getAgeInMonths(childDob);
    const defaultStage = getDefaultStageIndex(ageMonths);

    const { data: catalog, isLoading: loadingCatalog } = useMilestonesCatalog();
    const { data: achievedMilestones, isLoading: loadingAchieved } = useChildMilestones(childId);
    const { mutate: setMilestoneStatus } = useToggleChildMilestone();
    const [selectedStageIndex, setSelectedStageIndex] = useState(defaultStage);

    // Build status map: milestone_id → status
    const statusMap = useMemo(() => {
        const map: Record<string, MilestoneStatus> = {};
        achievedMilestones?.forEach((cm: any) => {
            map[cm.milestone_id] = cm.status as MilestoneStatus;
        });
        return map;
    }, [achievedMilestones]);

    // Group catalog into each age stage bucket
    const stageData = useMemo(() => {
        if (!catalog) return AGE_STAGES.map(() => [] as any[]);
        return AGE_STAGES.map(stage =>
            catalog.filter((m: any) => m.age_months > stage.minAge && m.age_months <= stage.maxAge)
        );
    }, [catalog]);

    const handleStatus = (milestoneId: string, newStatus: MilestoneStatus) => {
        const current = statusMap[milestoneId];
        const status = current === newStatus ? null : newStatus;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setMilestoneStatus({ childId, milestoneId, status });
    };

    if (loadingCatalog || loadingAchieved) {
        return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />;
    }

    const currentItems = stageData[selectedStageIndex] ?? [];
    const answeredCount = currentItems.filter(m => statusMap[m.id] != null).length;
    const achievedCount = currentItems.filter(m => statusMap[m.id] === 'achieved').length;
    const progress = currentItems.length > 0 ? answeredCount / currentItems.length : 0;

    return (
        <View style={{ width: '100%' }}>
            {/* Age stage horizontal picker — auto-selects child's current stage */}
            <BambiniText variant="caption" weight="bold" color={theme.textSecondary} style={styles.stageSectionLabel}>
                {childDob ? `YOUR CHILD IS ${ageMonths} MONTHS OLD` : 'BROWSE BY AGE'}
            </BambiniText>
            <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 20 }}
                contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}
            >
                {AGE_STAGES.map((stage, i) => {
                    const isActive = i === selectedStageIndex;
                    const stageItems = stageData[i];
                    const stageAnswered = stageItems.filter(m => statusMap[m.id] != null).length;
                    const stageDone = stageItems.length > 0 && stageAnswered === stageItems.length;
                    const stageProgress = stageItems.length > 0 ? stageAnswered / stageItems.length : 0;
                    // Mini ring SVG params
                    const ringSize = 20;
                    const ringStroke = 3;
                    const ringRadius = (ringSize - ringStroke) / 2;
                    const ringCirc = 2 * Math.PI * ringRadius;
                    const ringOffset = ringCirc * (1 - stageProgress);
                    return (
                        <TouchableOpacity
                            key={stage.label}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedStageIndex(i);
                            }}
                            style={[
                                styles.stageChip,
                                {
                                    backgroundColor: isActive ? theme.primary : theme.surface,
                                    borderColor: isActive ? theme.primary : (stageDone ? '#22C55E' : theme.border),
                                    borderWidth: stageDone && !isActive ? 2 : 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                },
                            ]}
                        >
                            {/* Mini progress ring */}
                            {stageItems.length > 0 && (
                                <Svg width={ringSize} height={ringSize} style={{ transform: [{ rotate: '-90deg' }] }}>
                                    <SvgCircle
                                        cx={ringSize / 2}
                                        cy={ringSize / 2}
                                        r={ringRadius}
                                        stroke={isActive ? 'rgba(255,255,255,0.3)' : theme.border}
                                        strokeWidth={ringStroke}
                                        fill="none"
                                    />
                                    {stageProgress > 0 && (
                                        <SvgCircle
                                            cx={ringSize / 2}
                                            cy={ringSize / 2}
                                            r={ringRadius}
                                            stroke={isActive ? '#FFFFFF' : (stageDone ? '#22C55E' : '#F5A623')}
                                            strokeWidth={ringStroke}
                                            fill="none"
                                            strokeDasharray={`${ringCirc}`}
                                            strokeDashoffset={ringOffset}
                                            strokeLinecap="round"
                                        />
                                    )}
                                </Svg>
                            )}
                            <BambiniText
                                variant="caption"
                                weight={isActive ? 'bold' : 'medium'}
                                color={isActive ? '#FFFFFF' : (stageDone ? '#22C55E' : theme.text)}
                                style={{ fontSize: 12 }}
                            >
                                {stage.shortLabel}
                            </BambiniText>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Stage summary card */}
            <View style={[styles.stageSummaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <BambiniText variant="h3" weight="bold" color={theme.text}>
                            {AGE_STAGES[selectedStageIndex].label}
                        </BambiniText>
                        <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 3 }}>
                            {currentItems.length} milestones · {answeredCount} answered · {achievedCount} achieved
                        </BambiniText>
                    </View>
                    <View style={[styles.progressCircleOuter, { borderColor: theme.border }]}>
                        <BambiniText variant="caption" weight="bold" color={theme.primary} style={{ fontSize: 13 }}>
                            {Math.round(progress * 100)}%
                        </BambiniText>
                    </View>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.border, marginTop: 12 }]}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: theme.primary }]} />
                </View>
                <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 8, fontStyle: 'italic' }}>
                    💡 Tap each milestone to record how well your child can do it
                </BambiniText>
            </View>

            {/* Milestone cards — grouped by domain */}
            {currentItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <BambiniText variant="body" color={theme.textSecondary}>
                        No milestones for this stage. Try running the SQL migration.
                    </BambiniText>
                </View>
            ) : (
                <DomainAccordion
                    items={currentItems}
                    statusMap={statusMap}
                    handleStatus={handleStatus}
                    theme={theme}
                />
            )}
        </View>
    );
}

// ─── Domain Accordion ────────────────────────────────────────────────────────

function DomainAccordion({
    items,
    statusMap,
    handleStatus,
    theme,
}: {
    items: any[];
    statusMap: Record<string, MilestoneStatus>;
    handleStatus: (milestoneId: string, newStatus: MilestoneStatus) => void;
    theme: any;
}) {
    // Group items by domain, preserving insertion order
    const grouped = useMemo(() => {
        const map = new Map<string, any[]>();
        items.forEach(item => {
            const key = (item.domain ?? 'Other').toLowerCase();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        });
        return Array.from(map.entries()); // [domainKey, items[]]
    }, [items]);

    // Track which domains are expanded (first one open by default)
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        grouped.forEach(([key], i) => { init[key] = i === 0; });
        return init;
    });

    const toggle = useCallback((key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    return (
        <View>
            {grouped.map(([domainKey, domainItems]) => {
                const isOpen = expanded[domainKey] ?? false;
                const domainColor = getDomainColor(domainKey);
                const emoji = getDomainEmoji(domainKey);
                const answeredCount = domainItems.filter((m: any) => statusMap[m.id] != null).length;
                const achievedCount = domainItems.filter((m: any) => statusMap[m.id] === 'achieved').length;
                const domainLabel = domainKey.charAt(0).toUpperCase() + domainKey.slice(1);

                return (
                    <View key={domainKey} style={{ marginBottom: 12 }}>
                        {/* Accordion header */}
                        <TouchableOpacity
                            onPress={() => toggle(domainKey)}
                            activeOpacity={0.7}
                            style={[
                                styles.accordionHeader,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor: isOpen ? domainColor : theme.border,
                                    borderLeftColor: domainColor,
                                    borderLeftWidth: 4,
                                },
                            ]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <BambiniText variant="body" style={{ fontSize: 20, marginRight: 10 }}>
                                    {emoji}
                                </BambiniText>
                                <View style={{ flex: 1 }}>
                                    <BambiniText variant="body" weight="bold" color={theme.text}>
                                        {domainLabel}
                                    </BambiniText>
                                    <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 2 }}>
                                        {achievedCount}/{domainItems.length} achieved · {answeredCount} answered
                                    </BambiniText>
                                </View>
                            </View>
                            {/* Chevron */}
                            <BambiniText variant="body" color={theme.textSecondary} style={{ fontSize: 18 }}>
                                {isOpen ? '▾' : '▸'}
                            </BambiniText>
                        </TouchableOpacity>

                        {/* Collapsible content */}
                        {isOpen && (
                            <View style={styles.accordionBody}>
                                {domainItems.map((item: any) => (
                                    <AnimatedMilestoneCard
                                        key={item.id}
                                        item={item}
                                        currentStatus={statusMap[item.id]}
                                        domainColor={domainColor}
                                        handleStatus={handleStatus}
                                        theme={theme}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

// ─── Animated Milestone Card ─────────────────────────────────────────────────

function AnimatedMilestoneCard({
    item,
    currentStatus,
    domainColor,
    handleStatus,
    theme,
}: {
    item: any;
    currentStatus: MilestoneStatus | undefined;
    domainColor: string;
    handleStatus: (milestoneId: string, newStatus: MilestoneStatus) => void;
    theme: any;
}) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const [showSparkle, setShowSparkle] = useState(false);
    const prevStatusRef = useRef(currentStatus);

    // Achievement celebration pulse
    useEffect(() => {
        if (currentStatus === 'achieved' && prevStatusRef.current !== 'achieved') {
            setShowSparkle(true);
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 150, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 0.97, duration: 100, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 120, useNativeDriver: false }),
            ]).start();
            setTimeout(() => setShowSparkle(false), 1500);
        }
        prevStatusRef.current = currentStatus;
    }, [currentStatus]);

    // Unanswered glow: subtle pulsing border opacity
    useEffect(() => {
        if (!currentStatus) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
                    Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
                ])
            ).start();
        } else {
            glowAnim.stopAnimation();
            glowAnim.setValue(0);
        }
    }, [currentStatus]);

    const isUnanswered = !currentStatus;
    const borderColor = currentStatus === 'achieved'
        ? '#22C55E'
        : currentStatus === 'emerging'
            ? '#F5A623'
            : theme.border;

    // Interpolate glow for unanswered cards
    const glowBorderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.border, '#F5A62380'],
    });

    const cardBorderColor = isUnanswered ? glowBorderColor : borderColor;
    const cardBg = currentStatus === 'achieved' ? '#F0FFF4' : theme.surface;

    return (
        <Animated.View
            style={[
                styles.milestoneCard,
                {
                    backgroundColor: cardBg,
                    borderColor: cardBorderColor,
                    borderLeftColor: domainColor,
                    borderLeftWidth: 4,
                    transform: [{ scale: pulseAnim }],
                },
            ]}
        >
            {/* Achievement sparkle overlay */}
            {showSparkle && (
                <View style={styles.sparkleOverlay}>
                    <BambiniText variant="h3" style={{ fontSize: 24 }}>✨</BambiniText>
                </View>
            )}

            {/* Title + age range */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <BambiniText variant="body" weight="semibold" color={theme.text} style={{ flex: 1, fontSize: 15 }}>
                    {currentStatus === 'achieved' ? '✅ ' : ''}{item.title}
                </BambiniText>
                {item.age_min_months != null && (
                    <BambiniText variant="caption" color={theme.textSecondary} style={{ fontSize: 10, marginLeft: 8 }}>
                        {item.age_min_months}–{item.age_max_months}m
                    </BambiniText>
                )}
            </View>

            {/* Description */}
            <BambiniText variant="caption" color={theme.textSecondary} style={{ lineHeight: 19, marginBottom: 10 }}>
                {item.description}
            </BambiniText>

            {/* Mascot tip speech bubble */}
            {item.tip && (
                <View style={styles.mascotTipContainer}>
                    <View style={styles.mascotAvatar}>
                        <BambiniText variant="body" style={{ fontSize: 18 }}>
                            {TIP_MASCOTS[item.id.charCodeAt(0) % TIP_MASCOTS.length]}
                        </BambiniText>
                    </View>
                    <View style={styles.speechBubble}>
                        <View style={styles.speechPointer} />
                        <BambiniText variant="caption" color="#5B4A1E" style={{ lineHeight: 17, fontStyle: 'italic' }}>
                            {item.tip}
                        </BambiniText>
                    </View>
                </View>
            )}

            {/* Unanswered nudge */}
            {isUnanswered && (
                <View style={styles.nudgeBanner}>
                    <BambiniText variant="caption" color="#B45309" style={{ fontSize: 11 }}>
                        👋 Can your child do this?
                    </BambiniText>
                </View>
            )}

            {/* 3-button feedback */}
            <View style={styles.feedbackRow}>
                {STATUS_OPTIONS.map((opt) => {
                    const isSelected = currentStatus === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => handleStatus(item.id, opt.value)}
                            activeOpacity={0.75}
                            style={[
                                styles.feedbackBtn,
                                {
                                    backgroundColor: isSelected ? opt.color : '#f9f5ea',
                                    borderColor: isSelected ? opt.color : theme.border,
                                },
                            ]}
                        >
                            <BambiniText
                                variant="caption"
                                weight={isSelected ? 'bold' : 'medium'}
                                color={isSelected ? '#FFFFFF' : theme.textSecondary}
                                style={{ fontSize: 12 }}
                            >
                                {opt.label}
                            </BambiniText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    childChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        borderRadius: 24,
        borderWidth: 1,
        padding: 4,
        marginBottom: 28,
    },
    tabSegment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    emptyState: { marginTop: 40, alignItems: 'center', padding: 32 },
    // Overview
    summaryCard: {
        borderRadius: 16, borderWidth: 1,
        padding: 20, marginBottom: 24,
    },
    chartWrapper: {
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 16, borderWidth: 1,
        paddingVertical: 16, marginBottom: 24,
    },
    legendGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        gap: 10, marginBottom: 24,
    },
    legendItem: {
        width: '47%', borderRadius: 12,
        borderWidth: 1, padding: 12,
    },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    // Milestones age-stage
    stageSectionLabel: {
        marginBottom: 10,
        letterSpacing: 0.8,
    },
    stageChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    stageSummaryCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 18,
        marginBottom: 24,
    },
    progressCircleOuter: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    // Legacy / shared
    filterPill: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
    },
    instructionBox: {
        borderRadius: 12, borderWidth: 1,
        padding: 12, marginBottom: 24,
    },
    milestonesGroupHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 10,
    },
    milestoneCard: {
        padding: 16, borderRadius: 16, marginBottom: 14,
        borderWidth: 1.5,
        shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    domainPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    tipBox: {
        borderRadius: 10, borderWidth: 1,
        paddingHorizontal: 12, paddingVertical: 8,
        marginBottom: 12,
    },
    feedbackRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    feedbackBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },
    // Accordion
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    accordionBody: {
        paddingTop: 8,
        paddingLeft: 4,
    },
    sparkleOverlay: {
        position: 'absolute',
        top: 8,
        right: 12,
        zIndex: 10,
    },
    nudgeBanner: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    // Mascot tip speech bubble
    mascotTipContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 8,
    },
    mascotAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    speechBubble: {
        flex: 1,
        backgroundColor: '#FFFDF5',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        position: 'relative',
    },
    speechPointer: {
        position: 'absolute',
        left: -6,
        top: 10,
        width: 0,
        height: 0,
        borderTopWidth: 6,
        borderBottomWidth: 6,
        borderRightWidth: 6,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: '#FDE68A',
    },
});

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab({ childId, childName, theme }: { childId: string; childName: string; theme: any }) {
    const { data: observations, isLoading } = useChildObservations(childId);

    const groupedObservations = useMemo(() => {
        if (!observations) return {};
        const groups: Record<string, any[]> = {};
        observations.forEach((obs: any) => {
            const dateStr = new Date(obs.created_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(obs);
        });
        return groups;
    }, [observations]);

    if (isLoading) {
        return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />;
    }

    if (!observations || observations.length === 0) {
        return (
            <View style={{ padding: 24, alignItems: 'center', marginTop: 40 }}>
                <BambiniText variant="body" color={theme.textSecondary} style={{ textAlign: 'center' }}>
                    No activities completed yet. Whenever {childName} finishes an activity, it will show up here in their timeline!
                </BambiniText>
            </View>
        );
    }

    return (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {Object.entries(groupedObservations).map(([dateLabel, obsList]) => (
                <View key={dateLabel} style={{ marginBottom: 24 }}>
                    <BambiniText variant="caption" weight="bold" color={theme.textSecondary} style={{ marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 4 }}>
                        {dateLabel}
                    </BambiniText>
                    {obsList.map((obs: any, index: number) => {
                        const act = obs.activities;
                        if (!act) return null;
                        const domainColor = getDomainColor(act.domain);
                        const emoji = getDomainEmoji(act.domain);

                        return (
                            <View key={obs.id} style={{ flexDirection: 'row', marginBottom: 16 }}>
                                {/* Timeline Line & Dot */}
                                <View style={{ alignItems: 'center', marginRight: 12, width: 24 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: domainColor, zIndex: 1 }} />
                                    {index !== obsList.length - 1 && (
                                        <View style={{ width: 2, flex: 1, backgroundColor: theme.border, marginTop: -4, marginBottom: -20, zIndex: 0 }} />
                                    )}
                                </View>

                                {/* Content Card */}
                                <View style={[styles.milestoneCard, { flex: 1, backgroundColor: theme.surface, borderColor: theme.border, marginTop: -4 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <BambiniText variant="h3" weight="bold" color={theme.text}>
                                                {act.title}
                                            </BambiniText>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                                <View style={[styles.domainPill, { backgroundColor: `${domainColor}15` }]}>
                                                    <BambiniText variant="caption" weight="bold" color={domainColor}>
                                                        {emoji} {act.domain}
                                                    </BambiniText>
                                                </View>
                                                {obs.rating && obs.rating !== 'completed' && (
                                                    <View style={[styles.domainPill, { backgroundColor: theme.border }]}>
                                                        <BambiniText variant="caption" color={theme.textSecondary}>
                                                            {obs.rating === 'loved_it' ? '✨ Loved it' : obs.rating === 'just_okay' ? '👍 Just okay' : '💪 Too hard'}
                                                        </BambiniText>
                                                    </View>
                                                )}
                                            </View>

                                            {obs.note ? (
                                                <BambiniText variant="body" color={theme.textSecondary} style={{ marginTop: 10, fontStyle: 'italic' }}>
                                                    "{obs.note}"
                                                </BambiniText>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

