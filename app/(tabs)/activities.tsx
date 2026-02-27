import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { PlayCircle, Brain, Activity, MessageSquare, Paintbrush, Users } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/lib/supabase';

export default function ActivitiesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    async function fetchActivities() {
        try {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('min_age_months', { ascending: true });

            if (error) throw error;
            if (data) setActivities(data);
        } catch (error: any) {
            console.error('Error fetching activities:', error.message);
        } finally {
            setLoading(false);
        }
    }

    const getDomainIcon = (domain: string, color: string) => {
        switch (domain) {
            case 'Cognitive': return <Brain color={color} size={28} />;
            case 'Physical': return <Activity color={color} size={28} />;
            case 'Language': return <MessageSquare color={color} size={28} />;
            case 'Creative': return <Paintbrush color={color} size={28} />;
            case 'Social': return <Users color={color} size={28} />;
            default: return <PlayCircle color={color} size={28} />;
        }
    };

    const getDomainColor = (domain: string) => {
        switch (domain) {
            case 'Cognitive': return theme.primary;
            case 'Physical': return theme.secondary;
            case 'Language': return theme.success;
            case 'Creative': return theme.accent;
            case 'Social': return '#FF6B6B';
            default: return theme.text;
        }
    };

    const renderActivity = ({ item }: { item: any }) => {
        const domainColor = getDomainColor(item.domain);

        return (
            <TouchableOpacity onPress={() => router.push(`/activity/${item.id}` as any)}>
                <BambiniCard padding="small" style={styles.activityCard}>
                    <View style={styles.activityRow}>
                        <View style={[styles.iconContainer, { backgroundColor: domainColor + '20' }]}>
                            {getDomainIcon(item.domain, domainColor)}
                        </View>
                        <View style={styles.activityInfo}>
                            <BambiniText variant="h3" weight="semibold">{item.title}</BambiniText>
                            <BambiniText variant="caption" color={theme.textSecondary}>
                                {item.domain} • Ages: {item.age_band}
                            </BambiniText>
                        </View>
                    </View>
                </BambiniCard>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <BambiniText variant="h1" weight="bold" style={styles.title}>Activity Library</BambiniText>
            <BambiniText variant="body" color={theme.textSecondary} style={styles.subtitle}>
                Discover age-appropriate developmental activities.
            </BambiniText>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderActivity}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        marginTop: 10,
    },
    subtitle: {
        marginTop: 8,
        marginBottom: 20,
    },
    listContent: {
        paddingBottom: 40,
        gap: 12,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityCard: {
        marginBottom: 12,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    activityInfo: {
        flex: 1,
    }
});
