import { BambiniText } from '@/components/design-system/BambiniText';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCreateHealthLog } from '@/hooks/useData';
import * as Haptics from 'expo-haptics';
import { Camera, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const COMMON_SYMPTOMS = [
    'Fever', 'Cough', 'Runny Nose', 'Vomiting', 'Diarrhea', 'Rash', 'Poor Appetite', 'Lethargy', 'Pain/Crying'
];

const SEVERITIES = ['Mild', 'Moderate', 'Severe'];

export function SymptomLogModal({ childId, visible, onClose }: { childId: string; visible: boolean; onClose: () => void }) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const { mutate: createLog, isPending } = useCreateHealthLog();

    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [severity, setSeverity] = useState('Mild');
    const [notes, setNotes] = useState('');

    const toggleSymptom = (s: string) => {
        Haptics.selectionAsync();
        if (selectedSymptoms.includes(s)) {
            setSelectedSymptoms(prev => prev.filter(item => item !== s));
        } else {
            setSelectedSymptoms(prev => [...prev, s]);
        }
    };

    const handleSave = () => {
        if (selectedSymptoms.length === 0 && !notes) {
            alert('Please select a symptom or enter a note.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        createLog({
            childId,
            logDate: new Date().toISOString().split('T')[0],
            symptoms: selectedSymptoms,
            severity,
            notes,
        }, {
            onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                handleClose();
            },
            onError: (err) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                console.error("Failed to save health log", err);
            }
        });
    };

    const handleClose = () => {
        setSelectedSymptoms([]);
        setSeverity('Mild');
        setNotes('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: '#FDFBF2' }]}>
                    <View style={styles.header}>
                        <BambiniText variant="h2" weight="bold" color={theme.text}>
                            Log Symptoms
                        </BambiniText>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X color={theme.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <BambiniText variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
                            What symptoms is your child experiencing today?
                        </BambiniText>

                        {/* Symptoms Multi-select */}
                        <View style={styles.chipContainer}>
                            {COMMON_SYMPTOMS.map((symptom) => {
                                const isSelected = selectedSymptoms.includes(symptom);
                                return (
                                    <TouchableOpacity
                                        key={symptom}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor: isSelected ? theme.primary + '20' : theme.surface,
                                                borderColor: isSelected ? theme.primary : theme.border,
                                            }
                                        ]}
                                        onPress={() => toggleSymptom(symptom)}
                                    >
                                        <BambiniText
                                            variant="caption"
                                            weight={isSelected ? "bold" : "regular"}
                                            color={isSelected ? theme.primary : theme.text}
                                        >
                                            {symptom}
                                        </BambiniText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Severity Selector */}
                        <BambiniText variant="h3" weight="bold" color={theme.text} style={{ marginTop: 24, marginBottom: 12 }}>
                            Severity
                        </BambiniText>
                        <View style={styles.severityContainer}>
                            {SEVERITIES.map(s => {
                                const isSelected = severity === s;
                                let bgColor = theme.surface;
                                let color = theme.textSecondary;
                                if (isSelected) {
                                    if (s === 'Mild') { bgColor = '#4CAF50'; color = '#FFFFFF'; }
                                    if (s === 'Moderate') { bgColor = '#FF9800'; color = '#FFFFFF'; }
                                    if (s === 'Severe') { bgColor = '#F44336'; color = '#FFFFFF'; }
                                }
                                return (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.severityBtn, { backgroundColor: bgColor, borderColor: theme.border, borderWidth: isSelected ? 0 : 1 }]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSeverity(s);
                                        }}
                                    >
                                        <BambiniText variant="body" weight={isSelected ? "bold" : "medium"} color={color}>
                                            {s}
                                        </BambiniText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Notes */}
                        <BambiniText variant="h3" weight="bold" color={theme.text} style={{ marginTop: 24, marginBottom: 8 }}>
                            Notes
                        </BambiniText>
                        <TextInput
                            style={[styles.textArea, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                            placeholder="Add additional details, temperature, meds given..."
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            numberOfLines={4}
                            value={notes}
                            onChangeText={setNotes}
                        />

                        {/* Optional Photo Attachment */}
                        <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Camera color={theme.textSecondary} size={20} />
                            <BambiniText variant="body" color={theme.textSecondary} style={{ marginLeft: 8 }}>
                                Attach Photo (Optional)
                            </BambiniText>
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity
                            style={[
                                styles.submitBtn,
                                { backgroundColor: (selectedSymptoms.length > 0 || notes) && !isPending ? theme.primary : '#D1D1D6' }
                            ]}
                            disabled={isPending || (selectedSymptoms.length === 0 && !notes)}
                            onPress={handleSave}
                        >
                            {isPending ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <BambiniText variant="body" weight="bold" color="#FFFFFF">
                                    Save Log
                                </BambiniText>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        paddingHorizontal: 24,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    severityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    severityBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    photoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        backgroundColor: '#FDFBF2',
    },
    submitBtn: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
