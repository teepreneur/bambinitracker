import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniText } from '@/components/design-system/BambiniText';
import { GrowthLogModal } from '@/components/GrowthLogModal';
import { SymptomLogModal } from '@/components/SymptomLogModal';
import { VaccinationCard } from '@/components/VaccinationCard';
import { useGrowthMeasurements, useHealthLogs, useVaccinations } from '@/hooks/useData';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Activity, Calendar, ChevronDown, ChevronRight, Plus, Ruler, Scale, Shield, Sparkles } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const EPI_SCHEDULE = [
    { name: 'BCG', dose: 1, ageDue: 'Birth', description: 'Protects against severe forms of Tuberculosis (TB).' },
    { name: 'OPV 0', dose: 0, ageDue: 'Birth', description: 'Oral Polio Vaccine to prevent poliomyelitis.' },
    { name: 'OPV 1', dose: 1, ageDue: '6 weeks', description: 'Oral Polio Vaccine to prevent poliomyelitis.' },
    { name: 'Pentavalent 1', dose: 1, ageDue: '6 weeks', description: 'Protects against Diphtheria, Pertussis, Tetanus, Hepatitis B, and Hib.' },
    { name: 'PCV 1', dose: 1, ageDue: '6 weeks', description: 'Pneumococcal Conjugate Vaccine protects against pneumonia and meningitis.' },
    { name: 'Rotavirus 1', dose: 1, ageDue: '6 weeks', description: 'Protects against severe rotavirus diarrhea.' },
    { name: 'OPV 2', dose: 2, ageDue: '10 weeks', description: 'Oral Polio Vaccine to prevent poliomyelitis.' },
    { name: 'Pentavalent 2', dose: 2, ageDue: '10 weeks', description: 'Protects against Diphtheria, Pertussis, Tetanus, Hepatitis B, and Hib.' },
    { name: 'PCV 2', dose: 2, ageDue: '10 weeks', description: 'Pneumococcal Conjugate Vaccine protects against pneumonia and meningitis.' },
    { name: 'Rotavirus 2', dose: 2, ageDue: '10 weeks', description: 'Protects against severe rotavirus diarrhea.' },
    { name: 'OPV 3', dose: 3, ageDue: '14 weeks', description: 'Oral Polio Vaccine to prevent poliomyelitis.' },
    { name: 'Pentavalent 3', dose: 3, ageDue: '14 weeks', description: 'Protects against Diphtheria, Pertussis, Tetanus, Hepatitis B, and Hib.' },
    { name: 'PCV 3', dose: 3, ageDue: '14 weeks', description: 'Pneumococcal Conjugate Vaccine protects against pneumonia and meningitis.' },
    { name: 'Measles-Rubella 1', dose: 1, ageDue: '9 months', description: 'Protects against measles and rubella.' },
    { name: 'Yellow Fever', dose: 1, ageDue: '9 months', description: 'Protects against the yellow fever virus.' },
    { name: 'Measles-Rubella 2', dose: 2, ageDue: '18 months', description: 'Booster dose for measles and rubella.' },
    { name: 'MenA', dose: 1, ageDue: '18 months', description: 'Protects against Meningitis A.' },
];

const HEALTH_TIPS = [
    "Skin-to-skin contact helps regulate your baby's heart rate and temperature.",
    "Tummy time for a few minutes daily helps build strong neck and shoulder muscles.",
    "Fever after a vaccination is common. Ensure your baby is well hydrated.",
    "Frequent, consistent hand-washing is the best defense against germs in the house.",
    "A consistent bedtime routine helps signal to your baby that it's time to sleep.",
    "Did you know? Babies often sleep 14-17 hours a day in short intervals.",
    "Talk and sing to your baby often—it significantly boosts their language development!"
];

export function HealthTabView({ child, theme }: { child: any; theme: any }) {
    const { data: vaccinations, isLoading: loadingVax } = useVaccinations(child?.id);
    const { data: healthLogs, isLoading: loadingLogs } = useHealthLogs(child?.id);
    const { data: growthData, isLoading: loadingGrowth } = useGrowthMeasurements(child?.id);

    const [isSymptomModalVisible, setIsSymptomModalVisible] = useState(false);
    const [isGrowthModalVisible, setIsGrowthModalVisible] = useState(false);
    const [measurementToEdit, setMeasurementToEdit] = useState<any>(null);

    // Default the first two groups to be expanded
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Birth': true,
        '6 weeks': true
    });

    // Select two daily rotating health tips
    const dailyTips = useMemo(() => {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = (today.getTime() - start.getTime()) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

        const index1 = dayOfYear % HEALTH_TIPS.length;
        const index2 = (dayOfYear + 1) % HEALTH_TIPS.length;
        return [HEALTH_TIPS[index1], HEALTH_TIPS[index2]];
    }, []);

    // Group vaccines by ageDue
    const groupedVaccines = useMemo(() => {
        const groups: Record<string, typeof EPI_SCHEDULE> = {};
        EPI_SCHEDULE.forEach(vax => {
            if (!groups[vax.ageDue]) groups[vax.ageDue] = [];
            groups[vax.ageDue].push(vax);
        });
        return groups;
    }, []);

    const handleOpenSymptomModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSymptomModalVisible(true);
    };

    const handleOpenGrowthModal = (measurement?: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setMeasurementToEdit(measurement || null);
        setIsGrowthModalVisible(true);
    };

    const toggleGroup = (ageStr: string) => {
        Haptics.selectionAsync();
        setExpandedGroups(prev => ({
            ...prev,
            [ageStr]: !prev[ageStr]
        }));
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'mild': return '#4CAF50';
            case 'moderate': return '#FF9800';
            case 'severe': return '#F44336';
            default: return theme.textSecondary;
        }
    };

    return (
        <View style={styles.container}>
            {/* Quick Health Insights */}
            <BambiniCard variant="flat" style={[styles.insightsCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                <View style={[styles.insightHeaderRow, { alignItems: 'center', marginBottom: 12 }]}>
                    <View style={[styles.insightIconBox, { backgroundColor: '#3B82F615' }]}>
                        <Sparkles color="#3B82F6" size={20} />
                    </View>
                    <BambiniText variant="h3" weight="bold" color="#0369A1">Quick Wellness Tip</BambiniText>
                </View>
                <View style={{ gap: 8 }}>
                    {dailyTips.map((tip, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <BambiniText variant="caption" color="#0EA5E9" style={{ marginRight: 6, lineHeight: 18 }}>•</BambiniText>
                            <BambiniText variant="caption" color="#0EA5E9" style={{ flex: 1, lineHeight: 18 }}>
                                {tip}
                            </BambiniText>
                        </View>
                    ))}
                </View>
            </BambiniCard>

            {/* Growth Measurements Input */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Scale color={theme.primary} size={22} style={{ marginRight: 8 }} />
                    <BambiniText variant="h2" weight="bold" color={theme.text}>Growth Measurements</BambiniText>
                </View>

                {/* Log Button */}
                <TouchableOpacity
                    style={[styles.growthLogButton, { backgroundColor: theme.primary + '15' }]}
                    onPress={() => handleOpenGrowthModal()}
                    activeOpacity={0.8}
                >
                    <Plus color={theme.primary} size={20} />
                    <BambiniText variant="body" weight="bold" color={theme.primary} style={{ marginLeft: 8 }}>
                        Log Weight & Height
                    </BambiniText>
                </TouchableOpacity>

                {/* Most Recent Measurement Snippet */}
                {loadingGrowth ? (
                    <ActivityIndicator color={theme.primary} />
                ) : growthData && growthData.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
                    >
                        {[...growthData].reverse().map((measurement: any) => (
                            <TouchableOpacity
                                key={measurement.id}
                                style={[styles.recentGrowthCard, { minWidth: 260 }]}
                                onPress={() => handleOpenGrowthModal(measurement)}
                                activeOpacity={0.7}
                            >
                                <View style={{ position: 'absolute', top: 12, right: 16 }}>
                                    <BambiniText variant="caption" color={theme.primary} weight="bold">
                                        {format(new Date(measurement.date), 'MMM d, yyyy')}
                                    </BambiniText>
                                </View>

                                <View style={[styles.growthMetric, { marginTop: 16 }]}>
                                    <Scale color={theme.textSecondary} size={16} style={{ marginBottom: 4 }} />
                                    <BambiniText variant="h3" weight="bold" color={theme.text}>
                                        {measurement.weight_kg || '--'} kg
                                    </BambiniText>
                                    <BambiniText variant="caption" color={theme.textSecondary}>Weight</BambiniText>
                                </View>
                                <View style={[styles.growthMetricDivider, { marginTop: 16 }]} />
                                <View style={[styles.growthMetric, { marginTop: 16 }]}>
                                    <Ruler color={theme.textSecondary} size={16} style={{ marginBottom: 4 }} />
                                    <BambiniText variant="h3" weight="bold" color={theme.text}>
                                        {measurement.height_cm || '--'} cm
                                    </BambiniText>
                                    <BambiniText variant="caption" color={theme.textSecondary}>Height</BambiniText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : null}
            </View>

            {/* Vaccination Tracker */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Shield color={theme.primary} size={22} style={{ marginRight: 8 }} />
                    <BambiniText variant="h2" weight="bold" color={theme.text}>Vaccination Tracker</BambiniText>
                </View>
                <BambiniText variant="caption" color={theme.textSecondary} style={{ marginBottom: 16 }}>
                    Based on standard Ghana EPI schedule.
                </BambiniText>

                {loadingVax ? (
                    <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
                ) : (
                    <View style={styles.vaccinationGroups}>
                        {Object.entries(groupedVaccines).map(([ageStr, vaccines]) => {
                            const isExpanded = expandedGroups[ageStr];
                            return (
                                <View key={ageStr} style={styles.vaxGroupBlock}>
                                    {/* Age Group Header */}
                                    <TouchableOpacity
                                        style={[
                                            styles.vaxGroupHeader,
                                            {
                                                backgroundColor: '#FFFFFF',
                                                padding: 16,
                                                borderRadius: 20,
                                                borderWidth: 1,
                                                borderColor: isExpanded ? theme.primary : theme.border,
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: isExpanded ? 0.08 : 0.04,
                                                shadowRadius: 12,
                                                elevation: 2
                                            }
                                        ]}
                                        onPress={() => toggleGroup(ageStr)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.ageIconBox, { backgroundColor: isExpanded ? theme.primary : theme.primary + '15' }]}>
                                                <Calendar color={isExpanded ? '#FFFFFF' : theme.primary} size={18} />
                                            </View>
                                            <View>
                                                <BambiniText variant="h3" weight="bold" color={theme.text}>
                                                    {ageStr}
                                                </BambiniText>
                                                <BambiniText variant="caption" color={theme.primary} style={{ marginTop: 2, fontWeight: 'bold' }}>
                                                    {isExpanded ? 'Tap to close' : `${vaccines.length} vaccine${vaccines.length !== 1 ? 's' : ''} • Tap to view`}
                                                </BambiniText>
                                            </View>
                                        </View>

                                        <View style={[styles.chevronBox, { backgroundColor: isExpanded ? theme.primary + '15' : theme.surface }]}>
                                            {isExpanded ? (
                                                <ChevronDown color={theme.primary} size={20} />
                                            ) : (
                                                <ChevronRight color={theme.textSecondary} size={20} />
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    {/* List of vaccines for this age */}
                                    {isExpanded && (
                                        <View style={styles.vaccinationList}>
                                            {vaccines.map((vax, index) => {
                                                const record = vaccinations?.find((v: any) => v.vaccine_name === vax.name && v.dose_number === vax.dose);
                                                return (
                                                    <VaccinationCard
                                                        key={`${vax.name}-${vax.dose}-${index}`}
                                                        vaccineDef={vax}
                                                        record={record}
                                                        childId={child.id}
                                                        theme={theme}
                                                        hideAgeDue={true}
                                                    />
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Symptom Logger */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Activity color="#F44336" size={22} style={{ marginRight: 8 }} />
                    <BambiniText variant="h2" weight="bold" color={theme.text}>Symptoms & Illnesses</BambiniText>
                </View>

                {/* Log Button */}
                <TouchableOpacity
                    style={[styles.logButton, { backgroundColor: theme.primary }]}
                    onPress={handleOpenSymptomModal}
                    activeOpacity={0.8}
                >
                    <Plus color="#FFFFFF" size={20} />
                    <BambiniText variant="body" weight="bold" color="#FFFFFF" style={{ marginLeft: 8 }}>
                        Log Symptom Today
                    </BambiniText>
                </TouchableOpacity>

                {/* Recent Logs List */}
                {loadingLogs ? (
                    <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
                ) : healthLogs && healthLogs.length > 0 ? (
                    <View style={styles.logsList}>
                        {healthLogs.slice(0, 5).map((log: any) => (
                            <View key={log.id} style={[styles.logItem, { borderColor: theme.border }]}>
                                <View style={styles.logHeader}>
                                    <BambiniText variant="caption" weight="bold" color={theme.text}>
                                        {format(new Date(log.log_date), 'MMM d, yyyy')}
                                    </BambiniText>
                                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(log.severity) + '20' }]}>
                                        <BambiniText variant="caption" weight="bold" color={getSeverityColor(log.severity)}>
                                            {log.severity}
                                        </BambiniText>
                                    </View>
                                </View>
                                {log.symptoms && log.symptoms.length > 0 && (
                                    <BambiniText variant="body" color={theme.textSecondary} style={{ marginTop: 6 }}>
                                        {log.symptoms.join(', ')}
                                    </BambiniText>
                                )}
                                {log.notes && (
                                    <BambiniText variant="caption" color={theme.textSecondary} style={{ marginTop: 4, fontStyle: 'italic' }}>
                                        "{log.notes}"
                                    </BambiniText>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={[styles.emptyLogs, { backgroundColor: theme.surface }]}>
                        <Activity color={theme.textSecondary} size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
                        <BambiniText variant="body" color={theme.textSecondary} style={{ textAlign: 'center' }}>
                            No symptoms logged yet. Safe & healthy!
                        </BambiniText>
                    </View>
                )}
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
                <BambiniText variant="caption" color={theme.textSecondary} style={{ textAlign: 'center', opacity: 0.7 }}>
                    ⚠️ This page is for tracking purposes only. Always consult a healthcare professional for medical concerns or emergencies.
                </BambiniText>
            </View>

            {/* Modals */}
            <SymptomLogModal
                childId={child.id}
                visible={isSymptomModalVisible}
                onClose={() => setIsSymptomModalVisible(false)}
            />
            <GrowthLogModal
                childId={child.id}
                visible={isGrowthModalVisible}
                onClose={() => {
                    setIsGrowthModalVisible(false);
                    setMeasurementToEdit(null);
                }}
                measurementToEdit={measurementToEdit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    insightsCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
    },
    insightIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    insightHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    vaccinationGroups: {
        gap: 16,
    },
    vaxGroupBlock: {
        // dynamic styles
    },
    vaxGroupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    ageIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    chevronBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vaccinationList: {
        gap: 12,
        marginTop: 8,
    },
    logButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 28,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    logsList: {
        gap: 16,
    },
    logItem: {
        borderWidth: 0,
        borderRadius: 24,
        padding: 20,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    emptyLogs: {
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    disclaimerContainer: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    growthLogButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 20,
        marginBottom: 16,
    },
    recentGrowthCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    growthMetric: {
        flex: 1,
        alignItems: 'center',
    },
    growthMetricDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#F3F4F6',
    }
});
