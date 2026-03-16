import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { CheckCircle2, Star, Sparkles, X, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BambiniText } from './design-system/BambiniText';
import { BambiniButton } from './design-system/BambiniButton';
import { MilestoneStatus } from '@/hooks/useData';
import { getDomainColor, getDomainEmoji } from '@/utils/ui';

interface MilestoneConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    childName: string;
    milestone: {
        id: string;
        title: string;
        description: string;
        domain: string;
    } | null;
    onConfirm: (status: MilestoneStatus) => void;
}

export function MilestoneConfirmationModal({
    visible,
    onClose,
    childName,
    milestone,
    onConfirm
}: MilestoneConfirmationModalProps) {
    const insets = useSafeAreaInsets();
    if (!milestone) return null;

    const domainColor = getDomainColor(milestone.domain);
    const emoji = getDomainEmoji(milestone.domain);

    const handleSelectStatus = (status: MilestoneStatus) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onConfirm(status);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[
                    styles.modalContent,
                    { 
                        paddingBottom: Math.max(insets.bottom, 20) + 20,
                        backgroundColor: '#f9f5ea'
                    }
                ]}>
                    <View style={styles.dragHandle} />
                    
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: domainColor + '15' }]}>
                            <Star size={24} color={domainColor} fill={domainColor} />
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color="#666666" size={20} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <BambiniText variant="h2" weight="bold" style={styles.title}>
                            Milestone Moment! ✨
                        </BambiniText>
                        
                        <BambiniText variant="body" color="#555555" style={styles.subtitle}>
                            Based on this activity, is {childName} showing signs of mastering this milestone?
                        </BambiniText>

                        <View style={[styles.milestoneCard, { borderColor: domainColor + '30' }]}>
                            <View style={styles.milestoneHeader}>
                                <BambiniText style={{ fontSize: 24 }}>{emoji}</BambiniText>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <BambiniText variant="h3" weight="bold" color={domainColor}>
                                        {milestone.domain}
                                    </BambiniText>
                                    <BambiniText variant="body" weight="bold" style={{ marginTop: 2 }}>
                                        {milestone.title}
                                    </BambiniText>
                                </View>
                            </View>
                            <BambiniText variant="caption" color="#666666" style={styles.milestoneDescription}>
                                {milestone.description}
                            </BambiniText>
                        </View>

                        <View style={styles.optionsContainer}>
                            <TouchableOpacity 
                                style={[styles.optionButton, { borderColor: '#22C55E' }]}
                                onPress={() => handleSelectStatus('achieved')}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#DCFCE7' }]}>
                                    <CheckCircle2 color="#22C55E" size={20} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <BambiniText variant="body" weight="bold" color="#1A1A1A">Mastered!</BambiniText>
                                    <BambiniText variant="caption" color="#666666">They can do this consistently</BambiniText>
                                </View>
                                <ChevronRight color="#E0E0E0" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.optionButton, { borderColor: '#F5A623' }]}
                                onPress={() => handleSelectStatus('emerging')}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                                    <Sparkles color="#F5A623" size={20} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <BambiniText variant="body" weight="bold" color="#1A1A1A">Emerging</BambiniText>
                                    <BambiniText variant="caption" color="#666666">Starting to show signs of this</BambiniText>
                                </View>
                                <ChevronRight color="#E0E0E0" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.optionButton, { borderColor: '#E0E0E0' }]}
                                onPress={() => handleSelectStatus('not_yet')}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#F3F4F6' }]}>
                                    <X color="#666666" size={20} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <BambiniText variant="body" weight="bold" color="#1A1A1A">Not Yet</BambiniText>
                                    <BambiniText variant="caption" color="#666666">Still working on it</BambiniText>
                                </View>
                                <ChevronRight color="#E0E0E0" size={20} />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <BambiniButton
                        title="Decide Later"
                        onPress={onClose}
                        variant="outline"
                        style={{ marginTop: 12 }}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 12,
        maxHeight: '90%',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 8,
    },
    subtitle: {
        lineHeight: 22,
        marginBottom: 20,
    },
    milestoneCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    milestoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    milestoneDescription: {
        lineHeight: 18,
    },
    optionsContainer: {
        gap: 12,
        marginBottom: 24,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        gap: 12,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
