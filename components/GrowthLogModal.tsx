import { BambiniText } from '@/components/design-system/BambiniText';
import { useAddGrowthMeasurement, useDeleteGrowthMeasurement, useUpdateGrowthMeasurement } from '@/hooks/useData';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Activity, Calendar as CalendarIcon, Ruler, Scale, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface GrowthLogModalProps {
    childId: string;
    visible: boolean;
    onClose: () => void;
    measurementToEdit?: any; // The growth record object if editing
}

export function GrowthLogModal({ childId, visible, onClose, measurementToEdit }: GrowthLogModalProps) {
    const { mutate: logGrowth, isPending: isAdding } = useAddGrowthMeasurement();
    const { mutate: updateGrowth, isPending: isUpdating } = useUpdateGrowthMeasurement();
    const { mutate: deleteGrowth, isPending: isDeleting } = useDeleteGrowthMeasurement();

    const isPending = isAdding || isUpdating || isDeleting;

    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [headCirc, setHeadCirc] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Sync state with measurementToEdit when modal opens/changes
    useEffect(() => {
        if (measurementToEdit) {
            setWeight(measurementToEdit.weight_kg ? measurementToEdit.weight_kg.toString() : '');
            setHeight(measurementToEdit.height_cm ? measurementToEdit.height_cm.toString() : '');
            setHeadCirc(measurementToEdit.head_circumference_cm ? measurementToEdit.head_circumference_cm.toString() : '');
            setDate(measurementToEdit.date ? new Date(measurementToEdit.date) : new Date());
        } else {
            setWeight('');
            setHeight('');
            setHeadCirc('');
            setDate(new Date());
        }
    }, [measurementToEdit, visible]);

    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleSave = () => {
        if (!weight && !height && !headCirc) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const payload = {
            child_id: childId,
            date: date.toISOString().split('T')[0],
            weight_kg: weight ? parseFloat(weight) : null,
            height_cm: height ? parseFloat(height) : null,
            head_circumference_cm: headCirc ? parseFloat(headCirc) : null,
        };

        const callbacks = {
            onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onClose();
            },
            onError: (error: any) => {
                console.error('Growth Log Error:', error);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                alert('Failed to save measurements. Please try again.');
            }
        };

        if (measurementToEdit) {
            updateGrowth({ ...payload, id: measurementToEdit.id }, callbacks);
        } else {
            logGrowth(payload, callbacks);
        }
    };

    const handleDelete = () => {
        if (!measurementToEdit) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        deleteGrowth({ id: measurementToEdit.id }, {
            onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onClose();
            },
            onError: (error) => {
                console.error('Delete Error:', error);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                alert('Failed to delete measurement.');
            }
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.modalContent}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <BambiniText variant="h2" weight="bold" color="#1F2937">
                                    {measurementToEdit ? 'Edit Growth' : 'Log Growth'}
                                </BambiniText>
                                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <X color="#6B7280" size={24} />
                                </TouchableOpacity>
                            </View>

                            {/* Date Picker */}
                            <TouchableOpacity
                                style={styles.dateRow}
                                activeOpacity={0.7}
                                onPress={() => setShowDatePicker(!showDatePicker)}
                            >
                                <CalendarIcon color="#6B7280" size={16} />
                                <BambiniText variant="body" color="#4B5563" style={{ marginLeft: 6 }}>
                                    {format(date, 'MMMM d, yyyy')}
                                </BambiniText>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    maximumDate={new Date()}
                                    onChange={onChangeDate}
                                />
                            )}

                            {/* Inputs */}
                            <View style={styles.formSection}>
                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Scale color="#10B981" size={18} />
                                        <BambiniText variant="body" weight="bold" color="#374151" style={{ marginLeft: 8 }}>
                                            Weight (kg)
                                        </BambiniText>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 5.2"
                                        keyboardType="decimal-pad"
                                        value={weight}
                                        onChangeText={setWeight}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Ruler color="#3B82F6" size={18} />
                                        <BambiniText variant="body" weight="bold" color="#374151" style={{ marginLeft: 8 }}>
                                            Height (cm)
                                        </BambiniText>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 62.5"
                                        keyboardType="decimal-pad"
                                        value={height}
                                        onChangeText={setHeight}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Activity color="#8B5CF6" size={18} />
                                        <BambiniText variant="body" weight="bold" color="#374151" style={{ marginLeft: 8 }}>
                                            Head Circumference (cm)
                                        </BambiniText>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 40.0"
                                        keyboardType="decimal-pad"
                                        value={headCirc}
                                        onChangeText={setHeadCirc}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={[
                                    styles.saveBtn,
                                    (!weight && !height && !headCirc) && { opacity: 0.5 }
                                ]}
                                onPress={handleSave}
                                disabled={isPending || (!weight && !height && !headCirc)}
                            >
                                {isPending ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <BambiniText variant="body" weight="bold" color="#FFFFFF">
                                        {measurementToEdit ? 'Update Measurements' : 'Save Measurements'}
                                    </BambiniText>
                                )}
                            </TouchableOpacity>

                            {/* Delete Button */}
                            {measurementToEdit && (
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={handleDelete}
                                    disabled={isPending}
                                >
                                    <Trash2 color="#EF4444" size={18} style={{ marginRight: 6 }} />
                                    <BambiniText variant="body" weight="bold" color="#EF4444">
                                        Delete Measurement
                                    </BambiniText>
                                </TouchableOpacity>
                            )}

                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FDFBF2',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginBottom: 24,
    },
    formSection: {
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        fontFamily: 'Nunito-SemiBold',
        color: '#1F2937',
    },
    saveBtn: {
        backgroundColor: '#F98B28', // Using theme.primary equivalent
        paddingVertical: 18,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#F98B28',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 12,
    },
    deleteBtn: {
        flexDirection: 'row',
        paddingVertical: 18,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
    }
});
