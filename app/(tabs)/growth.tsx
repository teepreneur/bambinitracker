import { BambiniText } from '@/components/design-system/BambiniText';
import { ChildAvatar } from '@/components/design-system/ChildAvatar';
import { GrowthChartsTab } from '@/components/GrowthChartsTab';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useChildren } from '@/hooks/useData';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Modular Tab Components
import { OverviewTab } from '@/components/growth/OverviewTab';
import { MilestonesTab } from '@/components/growth/MilestonesTab';
import { TimelineTab } from '@/components/growth/TimelineTab';

export default function GrowthScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const params = useLocalSearchParams<{ tab?: string }>();
    const [activeTab, setActiveTab] = useState<'Overview' | 'Milestones' | 'Timeline' | 'Health'>(
        (params.tab as any) || 'Overview'
    );
    const [selectedChildIndex, setSelectedChildIndex] = useState(0);

    // Sync tab if param changes while on screen
    useEffect(() => {
        if (params.tab && (params.tab === 'Overview' || params.tab === 'Milestones' || params.tab === 'Timeline' || params.tab === 'Health')) {
            setActiveTab(params.tab as any);
        }
    }, [params.tab]);

    const { data: children, isLoading: loadingChildren } = useChildren();
    const child = children?.[selectedChildIndex];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: '#f9f5ea' }]}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={[styles.header, { marginTop: Math.max(insets.top, 20) + 10 }]}>
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
                                router.setParams({ tab });
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
                <OverviewTab childId={child.id} childName={child.name} childDob={child.dob} theme={theme} />
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
});

