import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { ArrowLeft, Clock, Puzzle, Target, CheckCircle2 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/lib/supabase';

export default function ActivityDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchActivity();
    }, [id]);

    async function fetchActivity() {
        try {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) setActivity(data);
        } catch (error: any) {
            console.error('Error fetching activity details:', error.message);
            Alert.alert('Error', 'Could not load activity details.');
            router.back();
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!activity) return null;

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
            {/* Header / Nav */}
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft color={theme.text} size={24} />
                </TouchableOpacity>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
                <View style={[styles.domainBadge, { backgroundColor: theme.primary + '20' }]}>
                    <BambiniText variant="caption" color={theme.primary} weight="bold">{activity.domain}</BambiniText>
                </View>
                <BambiniText variant="h1" weight="bold" style={styles.title}>{activity.title}</BambiniText>
                <BambiniText variant="body" color={theme.textSecondary} style={styles.description}>
                    {activity.description}
                </BambiniText>
            </View>

            {/* Meta Tags */}
            <View style={styles.metaRow}>
                <View style={styles.metaTag}>
                    <Target size={16} color={theme.textSecondary} />
                    <BambiniText variant="caption" style={{ marginLeft: 6 }}>Age: {activity.age_band}</BambiniText>
                </View>
                <View style={styles.metaTag}>
                    <Clock size={16} color={theme.textSecondary} />
                    <BambiniText variant="caption" style={{ marginLeft: 6 }}>10-15 Min</BambiniText>
                </View>
            </View>

            {/* Materials */}
            {activity.materials && activity.materials.length > 0 && (
                <BambiniCard variant="elevated" padding="medium" style={styles.materialsCard}>
                    <View style={styles.sectionHeaderRow}>
                        <Puzzle size={20} color={theme.secondary} />
                        <BambiniText variant="h3" weight="semibold" style={{ marginLeft: 8 }}>Materials Needed</BambiniText>
                    </View>
                    {activity.materials.map((material: string, index: number) => (
                        <View key={index} style={styles.bulletItem}>
                            <View style={[styles.bullet, { backgroundColor: theme.secondary }]} />
                            <BambiniText variant="body">{material}</BambiniText>
                        </View>
                    ))}
                </BambiniCard>
            )}

            {/* Instructions */}
            <View style={styles.instructionsSection}>
                <BambiniText variant="h3" weight="bold" style={styles.sectionTitle}>Instructions</BambiniText>
                {activity.instructions.map((step: string, index: number) => (
                    <View key={index} style={styles.instructionStepRow}>
                        <View style={[styles.stepNumberContainer, { backgroundColor: theme.primary + '20' }]}>
                            <BambiniText variant="caption" weight="bold" color={theme.primary}>{index + 1}</BambiniText>
                        </View>
                        <BambiniText variant="body" style={styles.stepText}>{step}</BambiniText>
                    </View>
                ))}
            </View>

            {/* Action Area */}
            <View style={styles.actionArea}>
                <BambiniButton
                    title="Mark Complete & Leave Feedback"
                    onPress={() => Alert.alert('Coming Soon', 'Feedback module will be implemented in the next phase.')}
                />
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navHeader: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    titleSection: {
        paddingHorizontal: 24,
        marginTop: 10,
    },
    domainBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    title: {
        marginBottom: 8,
    },
    description: {
        lineHeight: 24,
    },
    metaRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 16,
        gap: 12,
    },
    metaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    materialsCard: {
        marginHorizontal: 24,
        marginTop: 24,
        backgroundColor: '#FFF9EF', // Light orange tint
        borderColor: '#FFE0B2',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 12,
        marginLeft: 4,
    },
    instructionsSection: {
        paddingHorizontal: 24,
        marginTop: 32,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    instructionStepRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    stepNumberContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    stepText: {
        flex: 1,
        lineHeight: 24,
    },
    actionArea: {
        paddingHorizontal: 24,
        marginTop: 40,
    }
});
