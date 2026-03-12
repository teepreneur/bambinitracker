import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniSkeleton } from '@/components/design-system/BambiniSkeleton';
import { BambiniText } from '@/components/design-system/BambiniText';
import { ChildAvatar } from '@/components/design-system/ChildAvatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useActivitiesLibrary, useChildActivities, useChildren } from '@/hooks/useData';
import { getAgeInMonths } from '@/utils/childAge';
import { DOMAINS, getActivityEmoji, getDomainColor } from '@/utils/ui';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ActivitiesScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();

    const { data: activities = [], isLoading } = useActivitiesLibrary();
    const { data: children, isLoading: loadingChildren } = useChildren();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('All'); // Keep 'All' as initial state for domain filter

    // Default to the first child if none is explicitly selected
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    // Automatically select the first child when data loads if none selected
    React.useEffect(() => {
        if (children && children.length > 0 && !selectedChildId) {
            setSelectedChildId(children[0].id);
        }
    }, [children]);

    const activeChild = children?.find(c => c.id === selectedChildId) || (children && children.length > 0 ? children[0] : null);
    const childId = activeChild?.id || null;

    // Get today's assigned activities to exclude them from recommendations. 
    // Pass undefined for ageDays to avoid triggering top-off generation from this screen.
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysActivities = [] } = useChildActivities(childId, undefined, today);

    // 1. Calculate Recommended Activities (Age-appropriate, NOT assigned today)
    const recommendedActivities = useMemo(() => {
        if (!activities || !activeChild) return [];

        const ageMonths = getAgeInMonths(activeChild.dob);
        const assignedIds = new Set(todaysActivities.map((a: any) => a.id));

        return activities.filter(activity => {
            const minAge = activity.min_age_months || 0;
            const maxAge = activity.max_age_months || 999;
            const isAgeAppropriate = ageMonths >= minAge && ageMonths <= maxAge;
            const isNotAssignedToday = !assignedIds.has(activity.id);

            return isAgeAppropriate && isNotAssignedToday;
        }).slice(0, 5); // Top 5
    }, [activities, activeChild, todaysActivities]);

    // 2. Calculate Browse Activities
    const browseActivities = useMemo(() => {
        if (!activities) return [];

        const recommendedIds = new Set(recommendedActivities.map(a => a.id));

        return activities.filter(activity => {
            // If they are searching or filtering by domain, we should probably search EVERYTHING.
            // But if there's no active search/filter, we exclude recommended logic to prevent dupes on screen.
            if (searchQuery === '' && selectedDomain === 'All' && recommendedIds.has(activity.id)) return false;

            const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                activity.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDomain = selectedDomain === 'All' || activity.domain === selectedDomain;

            return matchesSearch && matchesDomain;
        });
    }, [activities, recommendedActivities, searchQuery, selectedDomain]);

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f9f5ea' }}>
            {/* Sticky Header with Search */}
            <View style={[styles.header, { backgroundColor: '#f9f5ea' }]}>
                <BambiniText variant="h1" weight="bold" style={styles.title}>Discover</BambiniText>
                <BambiniText variant="body" color={theme.textSecondary} style={styles.subtitle}>
                    Explore developmental activities
                </BambiniText>

                <View style={[styles.searchContainer, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}>
                    <Search color={theme.textSecondary} size={20} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search activities..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* 0. Children Selector */}
                {children && children.length > 1 && (
                    <View style={styles.childScrollContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.childScroll}
                        >
                            {children.map((child) => (
                                <View key={child.id} style={styles.childItemContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.childAvatarBorder,
                                            { borderColor: selectedChildId === child.id ? theme.primary : 'transparent', borderWidth: 2 }
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedChildId(child.id);
                                        }}
                                    >
                                        <ChildAvatar photoUrl={child.photo_url} size={54} />
                                    </TouchableOpacity>
                                    <BambiniText
                                        variant="caption"
                                        weight={selectedChildId === child.id ? "bold" : "medium"}
                                        color={selectedChildId === child.id ? theme.text : theme.textSecondary}
                                        style={styles.childNameText}
                                    >
                                        {child.name}
                                    </BambiniText>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* 1. Recommended Horizontal Section (Only show if not searching/filtering) */}
                {searchQuery === '' && selectedDomain === 'All' && recommendedActivities.length > 0 && (
                    <View style={styles.recommendedSection}>
                        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                            <BambiniText variant="h3" weight="bold" color={theme.text}>
                                Recommended for {activeChild?.name || 'Your Child'}
                            </BambiniText>
                            <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 2 }}>
                                Perfect for their current age stage
                            </BambiniText>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                            snapToInterval={280 + 16} // Hero card width + gap
                            decelerationRate="fast"
                        >
                            {recommendedActivities.map((activity) => {
                                const domainColor = getDomainColor(activity.domain);
                                const emoji = getActivityEmoji(activity.title);

                                return (
                                    <TouchableOpacity
                                        key={`hero-${activity.id}`}
                                        activeOpacity={0.85}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            router.push({
                                                pathname: '/activity/[id]',
                                                params: { id: activity.id, childId: childId as string }
                                            });
                                        }}
                                        style={[
                                            styles.heroCard,
                                            {
                                                backgroundColor: domainColor + '10', // Glassy vibrant bg
                                                borderColor: domainColor + '30',
                                            }
                                        ]}
                                    >
                                        <View style={[styles.heroBadge, { backgroundColor: domainColor + '20' }]}>
                                            <BambiniText variant="caption" weight="bold" color={domainColor}>
                                                {activity.domain}
                                            </BambiniText>
                                        </View>

                                        <View style={styles.heroEmojiContainer}>
                                            <Text style={styles.heroEmoji}>{emoji}</Text>
                                        </View>

                                        <View style={styles.heroContent}>
                                            <BambiniText variant="h3" weight="bold" color={theme.text} numberOfLines={2}>
                                                {activity.title}
                                            </BambiniText>
                                            <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 4 }}>
                                                ⏳ {activity.estimated_duration_minutes || 10} min
                                            </BambiniText>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Main Filter Pills Header for Browse Collection */}
                <View style={{ backgroundColor: '#f9f5ea', paddingBottom: 16, paddingTop: 10 }}>
                    <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                        <BambiniText variant="h3" weight="bold" color={theme.text}>
                            Browse Collection
                        </BambiniText>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.pillsContainer}
                    >
                        <TouchableOpacity
                            style={[
                                styles.pill,
                                selectedDomain === 'All' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { backgroundColor: '#FFFFFF', borderColor: theme.border }
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedDomain('All');
                            }}
                        >
                            <BambiniText weight="semibold" color={selectedDomain === 'All' ? '#FFFFFF' : theme.textSecondary}>
                                All
                            </BambiniText>
                        </TouchableOpacity>

                        {DOMAINS.map((domain) => {
                            const isSelected = selectedDomain === domain;
                            const domainColor = getDomainColor(domain);
                            return (
                                <TouchableOpacity
                                    key={domain}
                                    style={[
                                        styles.pill,
                                        isSelected
                                            ? { backgroundColor: domainColor, borderColor: domainColor }
                                            : { backgroundColor: '#FFFFFF', borderColor: theme.border }
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedDomain(domain);
                                    }}
                                >
                                    <BambiniText weight="semibold" color={isSelected ? '#FFFFFF' : theme.textSecondary}>
                                        {domain}
                                    </BambiniText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Browse Activity List */}
                <View style={styles.listContainer}>
                    {isLoading ? (
                        <>
                            <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
                            <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
                            <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
                        </>
                    ) : browseActivities.length === 0 ? (
                        <View style={styles.emptyState}>
                            <BambiniText variant="h2" weight="bold" style={{ textAlign: 'center', marginTop: 40 }}>
                                No activities found
                            </BambiniText>
                            <BambiniText variant="body" color={theme.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                                Try adjusting your search or domain filter
                            </BambiniText>
                        </View>
                    ) : (
                        browseActivities.map((activity) => {
                            const domainColor = getDomainColor(activity.domain);
                            const emoji = getActivityEmoji(activity.title);

                            return (
                                <TouchableOpacity
                                    key={`browse-${activity.id}`}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        router.push({
                                            pathname: '/activity/[id]',
                                            params: { id: activity.id, childId: childId as string }
                                        });
                                    }}
                                    activeOpacity={0.7} // Improved un-pressed state fading
                                >
                                    <BambiniCard
                                        style={[
                                            styles.activityCard,
                                            {
                                                backgroundColor: '#FFFFFF',
                                                borderColor: 'rgba(0,0,0,0.05)', // Softer subtle border
                                                borderWidth: 1.5,
                                                shadowColor: '#000', // Classic subtle shadow instead of bright colored shadow
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 10,
                                                elevation: 2,
                                            }
                                        ]}
                                    >
                                        <View style={styles.activityRow}>
                                            <View style={[styles.iconContainer, { backgroundColor: domainColor + '15' }]}>
                                                <Text style={{ fontSize: 26, includeFontPadding: false }}>{emoji}</Text>
                                            </View>
                                            <View style={styles.activityInfo}>
                                                <BambiniText variant="body" weight="bold" style={{ fontSize: 17 }}>{activity.title}</BambiniText>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
                                                    <View style={[styles.miniBadge, { backgroundColor: domainColor + '20' }]}>
                                                        <BambiniText variant="caption" weight="bold" color={domainColor} style={{ fontSize: 11 }}>
                                                            {activity.domain}
                                                        </BambiniText>
                                                    </View>
                                                    <BambiniText variant="caption" color={theme.textSecondary}>
                                                        •  {activity.estimated_duration_minutes || 10} min
                                                    </BambiniText>
                                                </View>
                                            </View>
                                        </View>
                                    </BambiniCard>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60, // Safe area top equivalent
        paddingHorizontal: 20,
        paddingBottom: 16,
        zIndex: 10,
    },
    title: {
        marginBottom: 4,
    },
    subtitle: {
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Nunito-Medium',
        fontSize: 16,
    },
    childScrollContainer: {
        marginBottom: 20,
        paddingTop: 10,
    },
    childScroll: {
        paddingHorizontal: 20,
        gap: 16,
    },
    childItemContainer: {
        alignItems: 'center',
    },
    childAvatarBorder: {
        padding: 2,
        borderRadius: 40,
        marginBottom: 6,
    },
    childNameText: {
        fontSize: 13,
    },
    pillsContainer: {
        paddingHorizontal: 20,
        gap: 10,
    },
    pill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recommendedSection: {
        marginBottom: 20,
        paddingTop: 10,
    },
    heroCard: {
        width: 280,
        height: 180,
        borderRadius: 28,
        borderWidth: 1.5,
        padding: 20,
        justifyContent: 'space-between',
    },
    heroBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    heroEmojiContainer: {
        position: 'absolute',
        right: 20,
        top: 30,
        opacity: 0.9,
    },
    heroEmoji: {
        fontSize: 54,
        includeFontPadding: false,
    },
    heroContent: {
        marginTop: 'auto',
    },
    listContainer: {
        paddingHorizontal: 20,
        gap: 16,
    },
    activityCard: {
        marginBottom: 0,
        borderRadius: 24,
        padding: 16,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    activityInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    miniBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
