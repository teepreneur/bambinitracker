import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniSkeleton } from '@/components/design-system/BambiniSkeleton';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useActivitiesLibrary } from '@/hooks/useData';
import { DOMAINS, getActivityEmoji, getDomainColor } from '@/utils/ui';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ActivitiesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const { data: allActivities, isLoading } = useActivitiesLibrary();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('All');

    // Filter activities based on search query and selected domain
    const filteredActivities = useMemo(() => {
        if (!allActivities) return [];

        return allActivities.filter(activity => {
            const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                activity.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDomain = selectedDomain === 'All' || activity.domain === selectedDomain;

            return matchesSearch && matchesDomain;
        });
    }, [allActivities, searchQuery, selectedDomain]);

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
                stickyHeaderIndices={[0]} // If we wanted the filter pills to stick, we'd wrap them. For now, letting them scroll.
            >
                {/* Domain Filter Pills */}
                <View>
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
                            onPress={() => setSelectedDomain('All')}
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
                                    onPress={() => setSelectedDomain(domain)}
                                >
                                    <BambiniText weight="semibold" color={isSelected ? '#FFFFFF' : theme.textSecondary}>
                                        {domain}
                                    </BambiniText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Activity List */}
                <View style={styles.listContainer}>
                    {isLoading ? (
                        <>
                            <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
                            <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
                            <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
                        </>
                    ) : filteredActivities.length === 0 ? (
                        <View style={styles.emptyState}>
                            <BambiniText variant="h2" weight="bold" style={{ textAlign: 'center', marginTop: 40 }}>
                                No activities found
                            </BambiniText>
                            <BambiniText variant="body" color={theme.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                                Try adjusting your search or domain filter
                            </BambiniText>
                        </View>
                    ) : (
                        filteredActivities.map((activity) => {
                            const domainColor = getDomainColor(activity.domain);
                            const emoji = getActivityEmoji(activity.title);

                            return (
                                <TouchableOpacity
                                    key={activity.id}
                                    onPress={() => router.push(`/activity/${activity.id}`)}
                                    activeOpacity={0.8}
                                >
                                    <BambiniCard
                                        style={[
                                            styles.activityCard,
                                            {
                                                backgroundColor: '#FFFFFF',
                                                borderColor: domainColor + '40',
                                                borderWidth: 1.5,
                                                shadowColor: domainColor,
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.15,
                                                shadowRadius: 12,
                                                elevation: 4,
                                            }
                                        ]}
                                    >
                                        <View style={styles.activityRow}>
                                            <View style={[styles.iconContainer, { backgroundColor: domainColor + '20' }]}>
                                                <BambiniText style={{ fontSize: 24 }}>{emoji}</BambiniText>
                                            </View>
                                            <View style={styles.activityInfo}>
                                                <BambiniText variant="h3" weight="semibold">{activity.title}</BambiniText>
                                                <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 4 }}>
                                                    {activity.domain} • {activity.estimated_duration_minutes || 10} min
                                                </BambiniText>
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
    pillsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
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
    listContainer: {
        paddingHorizontal: 20,
        gap: 16,
    },
    activityCard: {
        marginBottom: 0,
        borderRadius: 24,
        padding: 20,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    activityInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
