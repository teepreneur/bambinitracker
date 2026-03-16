import React, { useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { G, Line, Polygon, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BambiniText } from '../design-system/BambiniText';
import { 
    useMilestonesCatalog, 
    useChildMilestones, 
    useChildObservations, 
    useToggleChildMilestone, 
    useMilestoneSynthesis,
    MilestoneStatus
} from '@/hooks/useData';
import { getAgeInMonths } from '@/utils/childAge';
import { DOMAIN_CONFIG } from '@/utils/ui';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.78;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE * 0.36;
const RADAR_DOMAINS = DOMAIN_CONFIG;

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

interface OverviewTabProps {
    childId: string;
    childName: string;
    childDob: string;
    theme: any;
}

export function OverviewTab({ childId, childName, childDob, theme }: OverviewTabProps) {
    const { data: catalog } = useMilestonesCatalog();
    const { data: achievedMilestones, isLoading } = useChildMilestones(childId);
    const { mutate: toggleMilestone } = useToggleChildMilestone();

    const [hiddenPrompts, setHiddenPrompts] = useState<Record<string, boolean>>({});

    const statusMap = useMemo(() => {
        const map: Record<string, MilestoneStatus> = {};
        achievedMilestones?.forEach((cm: any) => {
            map[cm.milestone_id] = cm.status as MilestoneStatus;
        });
        return map;
    }, [achievedMilestones]);

    const domainScores = useMemo(() => {
        if (!catalog || !childDob) return RADAR_DOMAINS.map(() => 0);
        const childAgeMonths = getAgeInMonths(childDob);

        return RADAR_DOMAINS.map(({ key }) => {
            // Only evaluate milestones that are appropriate for the child's current age
            const relevantMilestones = catalog.filter((m: any) => 
                m.domain?.toLowerCase() === key && 
                m.age_months <= childAgeMonths + 2 // Slight buffer for forward-looking progress
            );

            if (relevantMilestones.length === 0) return 0;

            const score = relevantMilestones.reduce((sum: number, m: any) => sum + statusScore(statusMap[m.id]), 0);
            return Math.min(100, Math.round((score / relevantMilestones.length) * 100));
        });
    }, [catalog, statusMap, childDob]);

    const childAgeMonths = useMemo(() => getAgeInMonths(childDob), [childDob]);
    
    const relevantCatalog = useMemo(() => {
        if (!catalog) return [];
        return catalog.filter((m: any) => m.age_months <= childAgeMonths + 2);
    }, [catalog, childAgeMonths]);

    const totalAnswered = relevantCatalog.filter(m => statusMap[m.id] !== undefined).length;
    const totalAchieved = relevantCatalog.filter(m => statusMap[m.id] === 'achieved').length;
    const totalMilestones = relevantCatalog.length;
    const overallPct = totalMilestones > 0 ? Math.min(100, Math.round((totalAchieved / totalMilestones) * 100)) : 0;

    const radarPoints = RADAR_DOMAINS.map((_, i) => radarCoord(domainScores[i] || 2, i, RADAR_DOMAINS.length));
    const radarPolygonPoints = radarPoints.map(p => `${p.x},${p.y}`).join(' ');
    const gridRings = [20, 40, 60, 80, 100].map(pct =>
        RADAR_DOMAINS.map((_, i) => radarCoord(pct, i, RADAR_DOMAINS.length)).map(p => `${p.x},${p.y}`).join(' ')
    );

    const { data: aiInsight } = useMilestoneSynthesis(childId, childName, Math.floor(getAgeInMonths(childDob)));

    return (
        <View>
            {aiInsight && !hiddenPrompts[aiInsight.milestone.id] && (
                <View style={[styles.nudgeBanner, { backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', marginBottom: 16, width: '100%' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                        <Sparkles size={16} color="#0284C7" />
                        <BambiniText variant="caption" weight="bold" color="#0284C7">
                            AI Observation Insight
                        </BambiniText>
                    </View>
                    <BambiniText variant="body" color={theme.text}>
                        {aiInsight.reasoning} Is {childName} showing signs of:
                    </BambiniText>
                    <View style={{ backgroundColor: '#ffffffaa', padding: 12, borderRadius: 12, marginVertical: 10, borderWidth: 1, borderColor: '#0000000a' }}>
                        <BambiniText variant="body" weight="bold" color={theme.text}>
                            {aiInsight.milestone.title}
                        </BambiniText>
                        <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 2 }}>
                            {aiInsight.milestone.description}
                        </BambiniText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            style={[styles.miniActionBtn, { flex: 1, backgroundColor: '#0284C7', alignItems: 'center', paddingVertical: 10 }]}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                toggleMilestone({
                                    childId,
                                    milestoneId: aiInsight.milestone.id,
                                    status: aiInsight.suggested_status
                                });
                            }}
                        >
                            <BambiniText variant="caption" weight="bold" color="#FFFFFF">Yes, {aiInsight.suggested_status === 'achieved' ? 'Mastered!' : 'Emerging'}</BambiniText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.miniActionBtn, { flex: 1, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', alignItems: 'center', paddingVertical: 10 }]}
                            onPress={() => {
                                setHiddenPrompts(prev => ({ ...prev, [aiInsight.milestone.id]: true }));
                            }}
                        >
                            <BambiniText variant="caption" weight="bold" color="#0284C7">Not Yet</BambiniText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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

const styles = StyleSheet.create({
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
    nudgeBanner: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    miniActionBtn: {
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    }
});
