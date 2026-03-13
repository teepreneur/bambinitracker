import { BambiniText } from '@/components/design-system/BambiniText';
import { useLogVaccination } from '@/hooks/useData';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

export function VaccinationCard({ vaccineDef, record, childId, theme, hideAgeDue = false }: any) {
    const isCompleted = !!record;
    const { mutate: logVax, isPending } = useLogVaccination();
    const [localLoading, setLocalLoading] = useState(false);

    const handleMarkGiven = () => {
        if (isCompleted || isPending || localLoading) return;
        setLocalLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        logVax({
            childId,
            vaccineName: vaccineDef.name,
            doseNumber: vaccineDef.dose,
            givenDate: new Date().toISOString().split('T')[0]
        }, {
            onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setLocalLoading(false);
            },
            onError: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setLocalLoading(false);
            }
        });
    };

    return (
        <View style={[styles.card, { backgroundColor: isCompleted ? '#E8F5E9' : theme.surface }]}>
            <View style={styles.leftContent}>
                <BambiniText variant="body" weight="bold" color={theme.text}>
                    {vaccineDef.name}
                </BambiniText>
                {vaccineDef.description && (
                    <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 2, marginBottom: 6, lineHeight: 16 }}>
                        {vaccineDef.description}
                    </BambiniText>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 6 }}>
                        <BambiniText variant="caption" weight="bold" color={theme.primary} style={{ fontSize: 10 }}>
                            {vaccineDef.dose === 0 ? 'Birth Dose' : `Shot ${vaccineDef.dose}`}
                        </BambiniText>
                    </View>
                    {!hideAgeDue && (
                        <BambiniText variant="caption" color={theme.textSecondary}>
                            Due: {vaccineDef.ageDue}
                        </BambiniText>
                    )}
                </View>

                {isCompleted && (
                    <BambiniText variant="caption" color="#4CAF50" style={{ marginTop: 4, fontWeight: 'bold' }}>
                        ✓ Given on {format(new Date(record.given_date), 'MMM d, yyyy')}
                    </BambiniText>
                )}
            </View>

            <View style={styles.rightContent}>
                {isCompleted ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#C8E6C9' }]}>
                        <Check color="#2E7D32" size={16} />
                        <BambiniText variant="caption" weight="bold" color="#4CAF50" style={{ marginLeft: 4 }}>
                            Complete
                        </BambiniText>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }]}
                        onPress={handleMarkGiven}
                        disabled={isPending || localLoading}
                    >
                        {localLoading || isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <BambiniText variant="caption" weight="bold" color="#FFFFFF">
                                    Mark Given
                                </BambiniText>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 24,
    },
    leftContent: {
        flex: 1,
        marginRight: 10,
    },
    rightContent: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    }
});
