import React, { useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Sparkles, ChevronRight, CheckCircle2, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { BambiniText } from '../design-system/BambiniText';
import { BambiniButton } from '../design-system/BambiniButton';
import { 
    useMilestonesCatalog, 
    useChildMilestones, 
    useToggleChildMilestone, 
    useMilestoneSynthesis,
    MilestoneStatus
} from '@/hooks/useData';
import { getAgeInMonths } from '@/utils/childAge';
import { getDomainColor, getDomainEmoji } from '@/utils/ui';

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

function getDefaultStageIndex(ageMonths: number): number {
    for (let i = AGE_STAGES.length - 1; i >= 0; i--) {
        if (ageMonths >= AGE_STAGES[i].minAge) return i;
    }
    return 0;
}

interface MilestonesTabProps {
    childId: string;
    childDob?: string;
    theme: any;
}

export function MilestonesTab({ childId, childDob, theme }: MilestonesTabProps) {
    const ageMonths = getAgeInMonths(childDob);
    const defaultStage = getDefaultStageIndex(ageMonths);

    const { data: catalog, isLoading: loadingCatalog } = useMilestonesCatalog();
    const { data: achievedMilestones, isLoading: loadingAchieved } = useChildMilestones(childId);
    const { mutate: setMilestoneStatus } = useToggleChildMilestone();
    const [selectedStageIndex, setSelectedStageIndex] = useState(defaultStage);
    const [activeDomain, setActiveDomain] = useState<string | null>(null);
    const [showAIModal, setShowAIModal] = useState(false);

    const { data: aiInsight, isLoading: isAILoading } = useMilestoneSynthesis(childId, 'your child', ageMonths);
    const { mutate: toggleMilestone } = useToggleChildMilestone();

    const statusMap = useMemo(() => {
        const map: Record<string, MilestoneStatus> = {};
        achievedMilestones?.forEach((cm: any) => {
            map[cm.milestone_id] = cm.status as MilestoneStatus;
        });
        return map;
    }, [achievedMilestones]);

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

    return (
        <View style={{ width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <BambiniText variant="caption" weight="bold" color={theme.textSecondary} style={styles.stageSectionLabel}>
                    {childDob ? `YOUR CHILD IS ${ageMonths} MONTHS OLD` : 'BROWSE BY AGE'}
                </BambiniText>
                
                <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#BAE6FD' }}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setShowAIModal(true);
                    }}
                >
                    <Sparkles size={14} color="#0284C7" />
                    <BambiniText variant="caption" weight="bold" color="#0284C7">AI Insight</BambiniText>
                </TouchableOpacity>
            </View>

            <Modal visible={showAIModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { padding: 24, maxHeight: '80%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ backgroundColor: '#F0F9FF', padding: 8, borderRadius: 12 }}>
                                    <Sparkles size={24} color="#0284C7" />
                                </View>
                                <BambiniText variant="h3" weight="bold">Progress Insight</BambiniText>
                            </View>
                            <TouchableOpacity onPress={() => setShowAIModal(false)}>
                                <BambiniText color={theme.textSecondary}>Close</BambiniText>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {isAILoading ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#0284C7" />
                                    <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 12 }}>
                                        Synthesizing your observations...
                                    </BambiniText>
                                </View>
                            ) : aiInsight ? (
                                <View>
                                    <BambiniText variant="body" color={theme.text} style={{ lineHeight: 22 }}>
                                        {aiInsight.reasoning}
                                    </BambiniText>
                                    
                                    <View style={{ marginTop: 24, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#EDF2F7' }}>
                                        <BambiniText variant="caption" weight="bold" color={theme.textSecondary} style={{ marginBottom: 12, textTransform: 'uppercase' }}>
                                            Suggested Milestone
                                        </BambiniText>
                                        <BambiniText variant="body" weight="bold" color={theme.text}>
                                            {aiInsight.milestone.title}
                                        </BambiniText>
                                        <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 4 }}>
                                            {aiInsight.milestone.description}
                                        </BambiniText>
                                        
                                        <BambiniButton 
                                            title={`Mark as ${aiInsight.suggested_status === 'achieved' ? 'Mastered' : 'Emerging'}`}
                                            style={{ marginTop: 16, backgroundColor: '#0284C7' }}
                                            onPress={() => {
                                                toggleMilestone({
                                                    childId,
                                                    milestoneId: aiInsight.milestone.id,
                                                    status: aiInsight.suggested_status
                                                });
                                                setShowAIModal(false);
                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                            }}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <BambiniText variant="body" color={theme.textSecondary} style={{ textAlign: 'center' }}>
                                        Keep logging your observations in the activities tab! Once you have at least one note with detail, I'll be able to synthesize it into developmental insights.
                                    </BambiniText>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
                                setActiveDomain(null);
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

            {activeDomain ? (
                <MilestoneTileBoard
                    domain={activeDomain}
                    items={currentItems.filter(m => m.domain?.toLowerCase() === activeDomain)}
                    statusMap={statusMap}
                    handleStatus={handleStatus}
                    onBack={() => setActiveDomain(null)}
                    theme={theme}
                />
            ) : (
                <DomainHub
                    items={currentItems}
                    statusMap={statusMap}
                    onSelectDomain={setActiveDomain}
                    theme={theme}
                />
            )}
        </View>
    );
}

function DomainHub({ items, statusMap, onSelectDomain, theme }: any) {
    const grouped = useMemo(() => {
        const map = new Map<string, any[]>();
        items.forEach((item: any) => {
            const key = (item.domain ?? 'Other').toLowerCase();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        });
        return Array.from(map.entries());
    }, [items]);

    return (
        <View style={styles.domainGrid}>
            {grouped.map(([domainKey, domainItems]) => {
                const domainColor = getDomainColor(domainKey);
                const emoji = getDomainEmoji(domainKey);
                const achievedCount = domainItems.filter((m: any) => statusMap[m.id] === 'achieved').length;
                const progress = domainItems.length > 0 ? achievedCount / domainItems.length : 0;
                const domainLabel = domainKey.charAt(0).toUpperCase() + domainKey.slice(1);

                return (
                    <TouchableOpacity
                        key={domainKey}
                        onPress={() => onSelectDomain(domainKey)}
                        activeOpacity={0.8}
                        style={[styles.domainHubCard, { borderColor: theme.border }]}
                    >
                        <View style={[styles.domainHubIcon, { backgroundColor: domainColor + '20' }]}>
                            <BambiniText style={{ fontSize: 24 }}>{emoji}</BambiniText>
                        </View>
                        <BambiniText variant="body" weight="bold" color={theme.text} style={{ marginTop: 12 }}>
                            {domainLabel}
                        </BambiniText>
                        <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 2 }}>
                            {achievedCount}/{domainItems.length} achieved
                        </BambiniText>
                        
                        <View style={[styles.progressTrack, { backgroundColor: theme.border, marginTop: 12, height: 4 }]}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: domainColor }]} />
                        </View>
                        
                        <View style={styles.hubForwardIcon}>
                            <ChevronRight size={16} color={theme.textSecondary} />
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function MilestoneTileBoard({ domain, items, statusMap, handleStatus, onBack, theme }: any) {
    const domainColor = getDomainColor(domain);
    const emoji = getDomainEmoji(domain);

    return (
        <View style={{ width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronRight size={24} color={theme.text} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <View style={{ marginLeft: 8 }}>
                    <BambiniText variant="h2" weight="bold">{emoji} {domain.charAt(0).toUpperCase() + domain.slice(1)}</BambiniText>
                    <BambiniText variant="caption" color={theme.textSecondary}>{items.length} Achievements</BambiniText>
                </View>
            </View>

            <View style={styles.tileGrid}>
                {items.map((item: any) => (
                    <MilestoneTile
                        key={item.id}
                        item={item}
                        currentStatus={statusMap[item.id]}
                        domainColor={domainColor}
                        handleStatus={handleStatus}
                        theme={theme}
                    />
                ))}
            </View>
        </View>
    );
}

function MilestoneTile({ item, currentStatus, domainColor, handleStatus, theme }: any) {
    const isAchieved = currentStatus === 'achieved';
    const isEmerging = currentStatus === 'emerging';
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsDetailsVisible(!isDetailsVisible);
            }}
            style={[
                styles.milestoneTile,
                {
                    backgroundColor: isAchieved ? domainColor : (isEmerging ? domainColor + '20' : theme.surface),
                    borderColor: isAchieved ? domainColor : (isEmerging ? domainColor : theme.border),
                    borderWidth: isAchieved ? 0 : 1,
                },
            ]}
        >
            <View style={styles.tileContent}>
                <View style={styles.tileHeader}>
                    <BambiniText 
                        variant="caption" 
                        weight="bold" 
                        color={isAchieved ? '#FFFFFF' : (isEmerging ? domainColor : theme.text)}
                        numberOfLines={2}
                        style={{ textAlign: 'center', fontSize: 11 }}
                    >
                        {item.title}
                    </BambiniText>
                </View>
                
                <View style={[styles.tileBadge, { backgroundColor: isAchieved ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)' }]}>
                    {isAchieved ? (
                        <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                        <BambiniText style={{ fontSize: 14 }}>{getDomainEmoji(item.domain)}</BambiniText>
                    )}
                </View>
            </View>

            <TouchableOpacity 
                style={styles.tileCheckmark}
                onPress={(e) => {
                    e.stopPropagation();
                    handleStatus(item.id, isAchieved ? 'not_yet' : 'achieved');
                }}
            >
                <CheckCircle2 size={22} color={isAchieved ? '#FFFFFF' : '#E0E0E0'} fill={isAchieved ? '#22C55E' : 'rgba(0,0,0,0.05)'} />
            </TouchableOpacity>

            {isDetailsVisible && (
                <View style={styles.tileDetailsOverlay}>
                    <BambiniText variant="caption" color={theme.text} weight="bold" style={{ marginBottom: 8, textAlign: 'center', fontSize: 10 }}>
                        {item.title}
                    </BambiniText>
                    <View style={{ width: '100%', gap: 5 }}>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleStatus(item.id, 'achieved'); setIsDetailsVisible(false); }} style={[styles.miniActionBtn, { backgroundColor: domainColor, paddingVertical: 6 }]}>
                            <BambiniText variant="caption" weight="bold" color="#FFFFFF" style={{ fontSize: 10, textAlign: 'center' }}>Mastered</BambiniText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleStatus(item.id, 'emerging'); setIsDetailsVisible(false); }} style={[styles.miniActionBtn, { backgroundColor: '#F5A623', paddingVertical: 6 }]}>
                            <BambiniText variant="caption" weight="bold" color="#FFFFFF" style={{ fontSize: 10, textAlign: 'center' }}>Sometimes</BambiniText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleStatus(item.id, 'not_yet'); setIsDetailsVisible(false); }} style={[styles.miniActionBtn, { backgroundColor: theme.border, paddingVertical: 6 }]}>
                            <BambiniText variant="caption" weight="bold" color={theme.textSecondary} style={{ fontSize: 10, textAlign: 'center' }}>Not Yet</BambiniText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    stageSectionLabel: { marginBottom: 10, letterSpacing: 0.8 },
    stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
    domainGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 10 },
    domainHubCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1 },
    domainHubIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    hubForwardIcon: { position: 'absolute', top: 16, right: 16 },
    progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
    tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    milestoneTile: { width: '48%', aspectRatio: 1, borderRadius: 20, padding: 12, marginBottom: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    tileContent: { alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' },
    tileHeader: { marginBottom: 8, paddingHorizontal: 4 },
    tileBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    tileCheckmark: { position: 'absolute', top: 6, right: 6 },
    tileDetailsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.96)', padding: 10, justifyContent: 'center', alignItems: 'center' },
    miniActionBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});
