import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { BambiniText } from '../design-system/BambiniText';
import { useChildObservations } from '@/hooks/useData';
import { getDomainColor, getDomainEmoji } from '@/utils/ui';
import { Sparkles, Camera, MapPin, Heart } from 'lucide-react-native';

interface TimelineTabProps {
    childId: string;
    childName: string;
    theme: any;
}

export function TimelineTab({ childId, childName, theme }: TimelineTabProps) {
    const { data: observations, isLoading } = useChildObservations(childId);

    const groupedObservations = useMemo(() => {
        if (!observations) return {};
        const groups: Record<string, any[]> = {};
        observations.forEach((obs: any) => {
            const dateStr = new Date(obs.created_at).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
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
            <View style={styles.emptyContainer}>
                <View style={styles.cameraIconBg}>
                    <Camera size={40} color={theme.primary} />
                </View>
                <BambiniText variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: 8 }}>
                    Your Activity Scrapbook
                </BambiniText>
                <BambiniText variant="body" color={theme.textSecondary} style={{ textAlign: 'center', paddingHorizontal: 32 }}>
                    Whenever {childName} finishes an activity with a photo, it will appear here in a beautiful chronological timeline.
                </BambiniText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {Object.entries(groupedObservations).map(([dateLabel, obsList]) => (
                <View key={dateLabel} style={styles.dateGroup}>
                    <View style={styles.dateHeader}>
                        <View style={styles.dateDot} />
                        <BambiniText variant="caption" weight="bold" color={theme.textSecondary} style={styles.dateText}>
                            {dateLabel}
                        </BambiniText>
                    </View>

                    {obsList.map((obs: any) => {
                        const act = obs.activities;
                        if (!act) return null;
                        const domainColor = getDomainColor(act.domain);
                        const hasImage = obs.media_urls && obs.media_urls.length > 0;

                        return (
                            <View key={obs.id} style={styles.scrapbookCardContainer}>
                                <TouchableOpacity activeOpacity={0.9} style={[styles.scrapbookCard, { borderColor: theme.border }]}>
                                    {hasImage ? (
                                        <View style={styles.imageHeader}>
                                            <Image source={{ uri: obs.media_urls[0] }} style={styles.observationImage} />
                                            <View style={[styles.domainBadge, { backgroundColor: domainColor }]}>
                                                <BambiniText variant="caption" weight="bold" color="#FFFFFF">
                                                    {getDomainEmoji(act.domain)} {act.domain}
                                                </BambiniText>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={[styles.patternHeader, { backgroundColor: domainColor + '10' }]}>
                                            <Sparkles size={32} color={domainColor} style={{ opacity: 0.3 }} />
                                            <View style={[styles.domainBadge, { backgroundColor: domainColor }]}>
                                                <BambiniText variant="caption" weight="bold" color="#FFFFFF">
                                                    {getDomainEmoji(act.domain)} {act.domain}
                                                </BambiniText>
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.cardContent}>
                                        <BambiniText variant="h3" weight="bold" color={theme.text} style={styles.cardTitle}>
                                            {act.title}
                                        </BambiniText>

                                        {obs.note ? (
                                            <BambiniText variant="body" color={theme.textSecondary} style={styles.noteText}>
                                                "{obs.note}"
                                            </BambiniText>
                                        ) : (
                                            <BambiniText variant="body" color={theme.textSecondary} style={[styles.noteText, { opacity: 0.5 }]}>
                                                No note added...
                                            </BambiniText>
                                        )}

                                        <View style={styles.cardFooter}>
                                            <View style={styles.footerItem}>
                                                <Heart size={14} color="#EC4899" />
                                                <BambiniText variant="caption" weight="bold" color="#EC4899" style={{ marginLeft: 4 }}>
                                                    {obs.rating === 'loved_it' ? 'LOVED IT' : 'COMPLETED'}
                                                </BambiniText>
                                            </View>
                                            <View style={styles.footerItem}>
                                                <MapPin size={14} color={theme.textTertiary} />
                                                <BambiniText variant="caption" color={theme.textTertiary} style={{ marginLeft: 4 }}>
                                                    Home
                                                </BambiniText>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    cameraIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    dateGroup: {
        marginBottom: 32,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#E5E7EB',
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginLeft: -19,
    },
    dateDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#26B8B8',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    dateText: {
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontSize: 12,
    },
    scrapbookCardContainer: {
        marginBottom: 24,
    },
    scrapbookCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    imageHeader: {
        width: '100%',
        height: 200,
        position: 'relative',
    },
    observationImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    patternHeader: {
        width: '100%',
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    domainBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    cardContent: {
        padding: 20,
    },
    cardTitle: {
        fontSize: 18,
        lineHeight: 24,
        marginBottom: 8,
    },
    noteText: {
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
