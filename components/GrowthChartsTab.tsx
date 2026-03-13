import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniText } from '@/components/design-system/BambiniText';
import { WHO_STANDARDS } from '@/constants/who_standards';
import { useGrowthMeasurements } from '@/hooks/useData';
import { differenceInMonths, format } from 'date-fns';
import { Activity, Ruler, Scale, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

type MetricType = 'weight' | 'height' | 'head';

export function GrowthChartsTab({ child, theme }: { child: any; theme: any }) {
    const { data: measurements, isLoading } = useGrowthMeasurements(child?.id);

    // Parse measurement data into format expected by gifted-charts
    const getChartData = (metric: MetricType) => {
        if (!measurements || measurements.length === 0) return { childData: [], whoData: [] };

        const childData: any[] = [];
        const whoData: any[] = [];
        const gender = child?.gender === 'girl' ? 'girl' : 'boy';

        // Ensure array is sorted by date ascending for charts
        const sorted = [...measurements]
            .filter((m: any) => {
                if (metric === 'weight') return m.weight_kg != null;
                if (metric === 'height') return m.height_cm != null;
                return m.head_circumference_cm != null;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sorted.forEach((m: any) => {
            let val = 0;
            if (metric === 'weight') val = m.weight_kg;
            else if (metric === 'height') val = m.height_cm;
            else val = m.head_circumference_cm;

            const dateObj = new Date(m.date);
            const label = format(dateObj, 'MMM d');

            // Calculate child's age in months at time of measurement to look up WHO standard
            // Fallback to 0 if dob is missing, cap at 24 months (the length of our WHO array)
            const ageMonths = child?.dob ? Math.max(0, Math.min(24, differenceInMonths(dateObj, new Date(child.dob)))) : 0;
            const whoVal = WHO_STANDARDS[metric][gender][ageMonths];

            childData.push({
                value: val,
                label,
                dataPointText: val.toString(),
            });

            whoData.push({
                value: whoVal,
                // Label omitted to prevent double labels, visually identical position
                hideDataPoint: true,
            });
        });

        return { childData, whoData };
    };

    // --- Insight Logic ---
    const getGrowthInsight = () => {
        if (!measurements || measurements.length === 0) return null;

        const latest = [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const dateObj = new Date(latest.date);
        const ageMonths = child?.dob ? Math.max(0, Math.min(24, differenceInMonths(dateObj, new Date(child.dob)))) : 0;
        const gender = child?.gender === 'girl' ? 'girl' : 'boy';

        const weightStatus = latest.weight_kg && latest.weight_kg >= WHO_STANDARDS.weight[gender][ageMonths] ? 'above' : 'below';
        const heightStatus = latest.height_cm && latest.height_cm >= WHO_STANDARDS.height[gender][ageMonths] ? 'above' : 'below';

        let message = '';
        if (measurements.length === 1) {
            message = `${child.name}'s first measurements are logged! Consistency is key to seeing a clear growth trend.`;
        } else {
            message = `${child.name} is making great progress. `;
            if (weightStatus === 'above' && heightStatus === 'above') {
                message += `Growth is looking strong and healthy according to the latest benchmarks.`;
            } else {
                message += `The charts show a steady growth pattern. Keep logging to track those beautiful milestones!`;
            }
        }

        return { message };
    };

    const insight = getGrowthInsight();

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    if (!measurements || measurements.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <BambiniText variant="h3" color={theme.textSecondary} style={{ textAlign: 'center', marginHorizontal: 32 }}>
                    No growth data logged yet. Add measurements in the Health tab!
                </BambiniText>
            </View>
        );
    }

    const metricConfig = [
        { id: 'weight', color: '#10B981', label: 'Weight (kg)', icon: Scale },
        { id: 'height', color: '#3B82F6', label: 'Height (cm)', icon: Ruler },
        { id: 'head', color: '#8B5CF6', label: 'Head (cm)', icon: Activity },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Growth Insight Card */}
            {insight && (
                <BambiniCard variant="flat" style={[styles.insightCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                    <View style={styles.insightHeader}>
                        <View style={[styles.insightIconBox, { backgroundColor: '#3B82F615' }]}>
                            <Sparkles color="#3B82F6" size={20} />
                        </View>
                        <BambiniText variant="h3" weight="bold" color="#0369A1">Growth Insight</BambiniText>
                    </View>
                    <BambiniText variant="body" color="#0EA5E9" style={{ lineHeight: 22 }}>
                        {insight.message}
                    </BambiniText>
                </BambiniCard>
            )}

            {metricConfig.map((config) => {
                const { childData, whoData } = getChartData(config.id as MetricType);
                const Icon = config.icon;

                return (
                    <View key={config.id} style={[styles.chartCard, { marginBottom: 24 }]}>
                        <View style={styles.chartHeader}>
                            <View style={[styles.iconBox, { backgroundColor: config.color + '20' }]}>
                                <Icon color={config.color} size={24} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <BambiniText variant="h3" weight="bold" color="#1F2937">
                                    {config.label}
                                </BambiniText>
                                <BambiniText variant="caption" color="#6B7280">
                                    Growth over time
                                </BambiniText>
                            </View>
                        </View>

                        {childData.length > 0 ? (
                            <View style={styles.chartWrapper}>
                                <LineChart
                                    data={childData}
                                    data2={whoData}
                                    width={width - 90}
                                    height={220}
                                    spacing={60}
                                    initialSpacing={20}
                                    color={config.color}
                                    color2="#D1D5DB"            // Grey color for WHO standard
                                    thickness={4}
                                    thickness2={2}
                                    strokeDashArray2={[5, 5]}   // Dashed line for WHO standard
                                    startFillColor={config.color}
                                    endFillColor={config.color}
                                    startOpacity={0.2}
                                    endOpacity={0.0}
                                    dataPointsColor={config.color}
                                    dataPointsRadius={6}
                                    textShiftY={-10}
                                    textFontSize={12}
                                    textColor={config.color}
                                    yAxisColor="#E5E7EB"
                                    xAxisColor="#E5E7EB"
                                    yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'Nunito-SemiBold' }}
                                    xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'Nunito-SemiBold' }}
                                    hideRules
                                    isAnimated
                                />
                                {/* Small Legend */}
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, marginRight: 10, gap: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={{ width: 12, height: 4, backgroundColor: config.color, borderRadius: 2 }} />
                                        <BambiniText variant="caption" color={theme.textSecondary}>Child</BambiniText>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={{ width: 12, height: 2, backgroundColor: '#D1D5DB', borderRadius: 1 }} />
                                        <BambiniText variant="caption" color={theme.textSecondary}>WHO 50th %ile</BambiniText>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.emptyChart}>
                                <BambiniText variant="body" color={theme.textSecondary} style={{ textAlign: 'center' }}>
                                    No {config.label} data logged yet.
                                </BambiniText>
                            </View>
                        )}
                    </View>
                );
            })}
        </ScrollView>
    );
}

// Added Sparkles to imports (assumed or will check)

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    insightCard: {
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 24,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    insightIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    centerContainer: {
        flex: 1,
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartWrapper: {
        marginLeft: -10, // Adjust to pull chart closer to left edge
    },
    emptyChart: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
    }
});
