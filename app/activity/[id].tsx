import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniSkeleton } from '@/components/design-system/BambiniSkeleton';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCompleteActivity } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { getActivityEmoji, getDomainColor } from '@/utils/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

    // Check if this activity has been completed (has an observation)
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

    const handleComplete = () => {
        if (!childId || !id) {
            Alert.alert("Error", "Missing child or activity information.");
            return;
        }

        Alert.alert(
            "Complete Activity",
            "Mark this activity as done? 🎉",
            [
                { text: "Not yet", style: "cancel" },
                {
                    text: "Yes, done!",
                    style: "default",
                    onPress: () => {
                        completeActivity.mutate(
                            { childId: childId as string, activityId: id as string },
                            {
                                onSuccess: () => {
                                    setJustCompleted(true);
                                    queryClient.invalidateQueries({ queryKey: ['activity_completed', id, childId] });
                                },
                                onError: (err) => {
                                    Alert.alert("Error", err.message || "Failed to mark as complete.");
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    const domainColor = getDomainColor(activity?.domain || 'Cognitive');
    const emoji = getActivityEmoji(activity?.title || '');
    const completed = isCompleted || justCompleted;

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#FDFBF2' }]}>
                <View style={styles.headerContainer}>
                    <View style={[styles.mediaPlaceholder, { backgroundColor: '#E0E0E0' }]}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <ChevronLeft color="#1A1A1A" size={28} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.bodyContainer}>
                    <BambiniSkeleton width="80%" height={32} borderRadius={8} style={{ marginBottom: 16 }} />
                    <BambiniSkeleton width="40%" height={20} borderRadius={8} style={{ marginBottom: 24 }} />
                    <BambiniSkeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: 24 }} />
                    <BambiniSkeleton width="100%" height={120} borderRadius={12} />
                </View>
            </View>
        );
    }

    if (!activity) {
        return (
            <View style={[styles.container, { backgroundColor: '#FDFBF2', justifyContent: 'center', alignItems: 'center' }]}>
                <TouchableOpacity style={styles.backButtonFloating} onPress={() => router.back()}>
                    <ChevronLeft color="#1A1A1A" size={28} />
                </TouchableOpacity>
                <BambiniText variant="h2" weight="bold" color={theme.textSecondary}>Activity not found</BambiniText>
            </View>
        );
    }

    const instructions: string[] = activity.instructions || [];
    const materials: string[] = activity.materials || [];
    const tips: string[] = activity.tips || [];

    return (
        <View style={{ flex: 1, backgroundColor: '#FDFBF2' }}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header / Media Area */}
                <View style={styles.headerContainer}>
                    <View style={[styles.mediaPlaceholder, { backgroundColor: domainColor + '15' }]}>
                        <View style={styles.emojiContainer}>
                            <BambiniText style={{ fontSize: 72 }}>{emoji}</BambiniText>
                        </View>
                        <View style={[styles.domainBadgeHeader, { backgroundColor: domainColor + '25' }]}>
                            <BambiniText variant="caption" weight="bold" color={domainColor}>
                                {activity.domain}
                            </BambiniText>
                        </View>
                    </View>

                    {/* Back Button Overlay */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ChevronLeft color="#1A1A1A" size={28} />
                    </TouchableOpacity>
                </View>

                {/* Content Body */}
                <View style={styles.bodyContainer}>
                    <BambiniText variant="h1" weight="bold" style={{ fontSize: 26, color: '#1A1A1A', marginBottom: 12 }}>
                        {activity.title}
                    </BambiniText>

                    {/* Meta Pills */}
                    <View style={styles.metaRow}>
                        <View style={[styles.metaPill, { backgroundColor: domainColor + '15' }]}>
                            <View style={[styles.domainDot, { backgroundColor: domainColor }]} />
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
                        {activity.age_band && (
                            <View style={[styles.metaPill, { backgroundColor: '#E8F8F5' }]}>
                                <BambiniText variant="caption" weight="bold" color="#26B8B8">
                                    {activity.age_band}
                                </BambiniText>
                            </View>
                        )}
                        {completed && (
                            <View style={[styles.metaPill, { backgroundColor: '#E8F5E9' }]}>
                                <CheckCircle2 color="#4CAF50" size={14} />
                                <BambiniText variant="caption" weight="bold" color="#4CAF50" style={{ marginLeft: 4 }}>
                                    Completed
                                </BambiniText>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    <BambiniText variant="body" color="#555555" style={styles.description}>
                        {activity.description}
                    </BambiniText>

                    {/* Extended Description */}
                    {activity.extended_description && (
                        <BambiniCard style={styles.extendedDescCard} variant="flat">
                            <View style={styles.extendedDescHeader}>
                                <Sparkles color={domainColor} size={18} />
                                <BambiniText variant="body" weight="bold" color="#1A1A1A" style={{ marginLeft: 8 }}>
                                    Why this matters
                                </BambiniText>
                            </View>
                            <BambiniText variant="body" color="#555555" style={{ lineHeight: 24, marginTop: 8 }}>
                                {activity.extended_description}
                            </BambiniText>
                        </BambiniCard>
                    )}

                    {/* Instructions Checklist */}
                    {instructions.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <BookOpen color={domainColor} size={20} />
                                <BambiniText variant="h2" weight="bold" color="#1A1A1A" style={{ marginLeft: 8 }}>
                                    Step-by-step
                                </BambiniText>
                            </View>
                            <View style={styles.instructionsContainer}>
                                {instructions.map((step: string, index: number) => (
                                    <View key={index} style={styles.instructionStep}>
                                        <View style={[styles.stepNumber, { backgroundColor: domainColor + '15' }]}>
                                            <BambiniText variant="caption" weight="bold" color={domainColor}>
                                                {index + 1}
                                            </BambiniText>
                                        </View>
                                        <BambiniText variant="body" color="#333333" style={styles.stepText}>
                                            {step}
                                        </BambiniText>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Materials */}
                    {materials.length > 0 && (
                        <>
                            <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                                <BambiniText variant="h2" weight="bold" color="#1A1A1A">What you need</BambiniText>
                            </View>
                            <View style={styles.materialsContainer}>
                                {materials.map((mat: string, idx: number) => (
                                    <BambiniCard key={idx} padding="small" style={styles.materialCard} variant="flat">
                                        <BambiniText variant="body" color="#333333">{mat}</BambiniText>
                                    </BambiniCard>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Tips */}
                    {tips.length > 0 && (
                        <>
                            <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                                <BambiniText variant="h2" weight="bold" color="#1A1A1A">💡 Tips</BambiniText>
                            </View>
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
                        </>
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
                        onPress={handleComplete}
                        disabled={completeActivity.isPending}
                        activeOpacity={0.8}
                    >
                        <CheckCircle2 color="#FFFFFF" size={22} />
                        <BambiniText variant="body" weight="bold" color="#FFFFFF" style={{ marginLeft: 10 }}>
                            {completeActivity.isPending ? 'Saving...' : 'Mark as Complete'}
                        </BambiniText>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.floatingButtonContainer}>
                    <View style={[styles.completeButton, { backgroundColor: '#4CAF50' }]}>
                        <CheckCircle2 color="#FFFFFF" size={22} />
                        <BambiniText variant="body" weight="bold" color="#FFFFFF" style={{ marginLeft: 10 }}>
                            Activity Completed! 🎉
                        </BambiniText>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        width: '100%',
        height: 280,
        position: 'relative',
    },
    mediaPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    emojiContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    domainBadgeHeader: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButtonFloating: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    domainDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    description: {
        lineHeight: 24,
        marginBottom: 24,
    },
    extendedDescCard: {
        backgroundColor: '#F8F6EE',
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
        borderWidth: 0,
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
    instructionsContainer: {
        gap: 20,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
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
    },
    materialsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    materialCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8F1F5',
        borderRadius: 12,
    },
    tipsContainer: {
        gap: 12,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
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
        backgroundColor: 'rgba(253, 251, 242, 0.95)',
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
});
