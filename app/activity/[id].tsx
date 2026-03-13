import { ActivityFeedbackModal } from '@/components/ActivityFeedbackModal';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniSkeleton } from '@/components/design-system/BambiniSkeleton';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCompleteActivity } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { getActivityEmoji, getDomainColor } from '@/utils/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, CheckCircle2, ChevronLeft, Clock, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ActivityDetailScreen() {
    const { id, childId } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const queryClient = useQueryClient();

    // Fetch the actual activity from Supabase
    const { data: activity, isLoading } = useQuery({
        queryKey: ['activity_detail', id],
        enabled: !!id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },
    });

    // Check if this activity has been completed
    const { data: isCompleted } = useQuery({
        queryKey: ['activity_completed', id, childId],
        enabled: !!id && !!childId,
        queryFn: async () => {
            const { data } = await supabase
                .from('observations')
                .select('id')
                .eq('activity_id', id)
                .eq('child_id', childId)
                .limit(1);
            return data && data.length > 0;
        },
    });

    const completeActivity = useCompleteActivity();
    const [justCompleted, setJustCompleted] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleOpenModal = () => {
        if (!childId || !id) {
            Alert.alert("Error", "Missing child or activity information.");
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsSuccess(false);
        setModalVisible(true);
    };

    const handleFeedbackSubmit = (rating: string, note: string, mediaUrls: string[]) => {
        completeActivity.mutate(
            { childId: childId as string, activityId: id as string, rating, note, mediaUrls },
            {
                onSuccess: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setJustCompleted(true);
                    setIsSuccess(true);
                    queryClient.invalidateQueries({ queryKey: ['activity_completed', id, childId] });
                },
                onError: (err) => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    Alert.alert("Error", err.message || "Failed to mark as complete.");
                }
            }
        );
    };

    const domainColor = getDomainColor(activity?.domain || 'Cognitive');
    const emoji = getActivityEmoji(activity?.title || '');
    const completed = isCompleted || justCompleted;

    const instructions: string[] = activity?.instructions || [];
    const materials: string[] = activity?.materials || [];
    const tips: string[] = activity?.tips || [];

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#f9f5ea' }]}>
                <View style={[styles.heroHeader, { backgroundColor: '#FFFFFF', paddingBottom: 60 }]}>
                    <TouchableOpacity style={styles.backButtonFloating} onPress={() => router.back()}>
                        <ChevronLeft color="#1A1A1A" size={28} />
                    </TouchableOpacity>
                    <BambiniSkeleton width={120} height={120} borderRadius={60} style={{ alignSelf: 'center', marginTop: 100 }} />
                </View>
                <View style={styles.bodyContainer}>
                    <BambiniSkeleton width="80%" height={32} borderRadius={8} style={{ marginBottom: 16 }} />
                    <BambiniSkeleton width="40%" height={20} borderRadius={8} style={{ marginBottom: 24 }} />
                    <BambiniSkeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 24 }} />
                </View>
            </View>
        );
    }

    if (!activity) {
        return (
            <View style={[styles.container, { backgroundColor: '#f9f5ea', justifyContent: 'center', alignItems: 'center' }]}>
                <TouchableOpacity style={styles.backButtonFloating} onPress={() => router.back()}>
                    <ChevronLeft color="#1A1A1A" size={28} />
                </TouchableOpacity>
                <BambiniText variant="h2" weight="bold" color={theme.textSecondary}>Activity not found</BambiniText>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f9f5ea' }}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Header - White Card with Shadow */}
                <View style={[styles.heroHeader, {
                    shadowColor: domainColor,
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.15,
                    shadowRadius: 32,
                    elevation: 10,
                }]}>
                    <TouchableOpacity style={styles.backButtonFloating} onPress={() => router.back()}>
                        <ChevronLeft color="#1A1A1A" size={28} />
                    </TouchableOpacity>

                    {/* Massive Immersive Emoji Container */}
                    <View style={styles.emojiContainer}>
                        <View style={[styles.emojiBackgroundRingLarge, { backgroundColor: domainColor + '08' }]} />
                        <View style={[styles.emojiBackgroundRingMedium, { backgroundColor: domainColor + '15' }]} />
                        <View style={[styles.emojiBackgroundRingSmall, { backgroundColor: domainColor + '25' }]} />
                        <BambiniText style={styles.immersiveEmoji}>{emoji}</BambiniText>
                    </View>

                    <BambiniText variant="h1" weight="bold" style={{ fontSize: 28, color: '#1A1A1A', textAlign: 'center', marginTop: 16 }}>
                        {activity.title}
                    </BambiniText>

                    <View style={styles.metaRow}>
                        <View style={[styles.domainBadgeHeader, { borderColor: domainColor, borderWidth: 1, backgroundColor: '#FFFFFF' }]}>
                            <BambiniText variant="caption" weight="bold" color={domainColor}>
                                {activity.domain}
                            </BambiniText>
                        </View>
                        {activity.estimated_duration_minutes && (
                            <View style={[styles.metaPill, { backgroundColor: '#F0F0F0' }]}>
                                <Clock color="#8E8E93" size={14} />
                                <BambiniText variant="caption" weight="bold" color="#8E8E93" style={{ marginLeft: 4 }}>
                                    {activity.estimated_duration_minutes} min
                                </BambiniText>
                            </View>
                        )}
                        {completed && (
                            <View style={[styles.metaPill, { backgroundColor: '#E8F5E9' }]}>
                                <CheckCircle2 color="#4CAF50" size={14} />
                                <BambiniText variant="caption" weight="bold" color="#4CAF50" style={{ marginLeft: 4 }}>
                                    Done
                                </BambiniText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Content Body */}
                <View style={styles.bodyContainer}>

                    {/* Description */}
                    <BambiniText variant="body" color="#555555" style={styles.description}>
                        {activity.description}
                    </BambiniText>

                    {/* Extended Description */}
                    {activity.extended_description && (
                        <BambiniCard
                            style={[styles.extendedDescCard, { borderColor: domainColor + '30', borderWidth: 1 }]}
                            variant="flat"
                        >
                            <View style={styles.extendedDescHeader}>
                                <Sparkles color={domainColor} size={20} />
                                <BambiniText variant="h3" weight="bold" color="#1A1A1A" style={{ marginLeft: 8 }}>
                                    Why this matters
                                </BambiniText>
                            </View>
                            <BambiniText variant="body" color="#555555" style={{ lineHeight: 24, marginTop: 10 }}>
                                {activity.extended_description}
                            </BambiniText>
                        </BambiniCard>
                    )}

                    {/* Instructions Checklist */}
                    {instructions.length > 0 && (
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.iconHighlight, { backgroundColor: domainColor + '15' }]}>
                                    <BookOpen color={domainColor} size={22} />
                                </View>
                                <BambiniText variant="h2" weight="bold" color="#1A1A1A" style={{ marginLeft: 12 }}>
                                    How to play
                                </BambiniText>
                            </View>

                            <BambiniCard variant="elevated" style={styles.stepsCard}>
                                {instructions.map((step: string, index: number) => (
                                    <View key={index} style={[
                                        styles.instructionStep,
                                        index !== instructions.length - 1 && styles.stepDivider
                                    ]}>
                                        <View style={[styles.stepNumber, { backgroundColor: domainColor }]}>
                                            <BambiniText variant="caption" weight="bold" color="#FFFFFF">
                                                {index + 1}
                                            </BambiniText>
                                        </View>
                                        <BambiniText variant="body" color="#333333" style={styles.stepText}>
                                            {step}
                                        </BambiniText>
                                    </View>
                                ))}
                            </BambiniCard>
                        </View>
                    )}

                    {/* Materials */}
                    {materials.length > 0 && (
                        <View style={styles.sectionBlock}>
                            <BambiniText variant="h3" weight="bold" color="#1A1A1A" style={{ marginBottom: 12 }}>
                                You'll need
                            </BambiniText>
                            <View style={styles.materialsContainer}>
                                {materials.map((mat: string, idx: number) => (
                                    <View key={idx} style={[styles.materialPill, { borderColor: theme.border }]}>
                                        <BambiniText variant="body" color="#333333">{mat}</BambiniText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Tips */}
                    {tips.length > 0 && (
                        <View style={styles.sectionBlock}>
                            <BambiniText variant="h3" weight="bold" color="#1A1A1A" style={{ marginBottom: 16 }}>
                                💡 Helpful Tips
                            </BambiniText>
                            <View style={styles.tipsContainer}>
                                {tips.map((tip: string, idx: number) => (
                                    <View key={idx} style={styles.tipRow}>
                                        <View style={[styles.tipDot, { backgroundColor: domainColor }]} />
                                        <BambiniText variant="body" color="#555555" style={{ flex: 1, lineHeight: 22 }}>
                                            {tip}
                                        </BambiniText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Bottom Spacing for floating button */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Floating Complete Button */}
            {!completed ? (
                <View style={styles.floatingButtonContainer}>
                    <TouchableOpacity
                        style={[styles.completeButton, { backgroundColor: domainColor }]}
                        onPress={handleOpenModal}
                        activeOpacity={0.8}
                    >
                        <CheckCircle2 color="#FFFFFF" size={24} />
                        <BambiniText variant="h3" weight="bold" color="#FFFFFF" style={{ marginLeft: 12 }}>
                            Mark as Complete 🎉
                        </BambiniText>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.floatingButtonContainer}>
                    <View style={[styles.completeButton, { backgroundColor: '#4CAF50' }]}>
                        <CheckCircle2 color="#FFFFFF" size={24} />
                        <BambiniText variant="h3" weight="bold" color="#FFFFFF" style={{ marginLeft: 12 }}>
                            Activity Completed!
                        </BambiniText>
                    </View>
                </View>
            )}

            <ActivityFeedbackModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleFeedbackSubmit}
                isSubmitting={completeActivity.isPending}
                isSuccess={isSuccess}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroHeader: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        zIndex: 10,
        overflow: 'hidden', // Contain the large decorative rings
    },
    emojiContainer: {
        width: 220,
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 20,
        marginTop: 20,
    },
    emojiBackgroundRingLarge: {
        width: 280,
        height: 280,
        borderRadius: 140,
        position: 'absolute',
    },
    emojiBackgroundRingMedium: {
        width: 200,
        height: 200,
        borderRadius: 100,
        position: 'absolute',
    },
    emojiBackgroundRingSmall: {
        width: 140,
        height: 140,
        borderRadius: 70,
        position: 'absolute',
    },
    immersiveEmoji: {
        fontSize: 100,
        zIndex: 10,
        includeFontPadding: false,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    domainBadgeHeader: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    backButtonFloating: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f9f5ea',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 100,
    },
    bodyContainer: {
        paddingHorizontal: 20,
        paddingTop: 32,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    description: {
        lineHeight: 26,
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    sectionBlock: {
        marginBottom: 32,
    },
    extendedDescCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
    },
    extendedDescHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconHighlight: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 0,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
    },
    stepDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    stepText: {
        flex: 1,
        lineHeight: 24,
        fontSize: 15,
    },
    materialsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    materialPill: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    tipsContainer: {
        gap: 14,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 24,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    tipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
        marginTop: 8,
    },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: 40,
        backgroundColor: 'rgba(249, 245, 234, 0.95)',
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
    },
});
