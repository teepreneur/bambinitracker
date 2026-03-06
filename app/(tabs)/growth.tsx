import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniText } from '@/components/design-system/BambiniText';
import { ChildAvatar } from '@/components/design-system/ChildAvatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.75;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE * 0.4;

const DOMAINS = [
    { name: 'Cognitive', color: '#9D78DD', value: 80 },
    { name: 'Physical', color: '#79C37A', value: 65 },
    { name: 'Language', color: '#F5A623', value: 90 },
    { name: 'Social', color: '#26B8B8', value: 85 },
    { name: 'Creative', color: '#F5D547', value: 70 },
];

export default function GrowthScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const [activeTab, setActiveTab] = useState('Chart');

    // Radar Chart Math Calculations
    const getCoordinatesForValue = (value: number, index: number, total: number) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        // value is a percentage (0-100)
        const pointRadius = (value / 100) * RADIUS;
        const x = CENTER + pointRadius * Math.cos(angle);
        const y = CENTER + pointRadius * Math.sin(angle);
        return { x, y };
    };

    const radarPoints = DOMAINS.map((domain, i) => getCoordinatesForValue(domain.value, i, DOMAINS.length));
    const radarPolygonPoints = radarPoints.map(p => `${p.x},${p.y}`).join(' ');

    // Generate grid rings
    const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0].map(scale => {
        const points = DOMAINS.map((_, i) => getCoordinatesForValue(scale * 100, i, DOMAINS.length));
        return points.map(p => `${p.x},${p.y}`).join(' ');
    });

    return (
        <ScrollView style={[styles.container, { backgroundColor: '#FDFBF2' }]} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <BambiniText variant="h1" weight="bold" color="#333333" style={{ fontSize: 24 }}>Growth Radar</BambiniText>

                <View style={[styles.headerAvatarBorder, { borderColor: '#3DBBB8' }]}>
                    <ChildAvatar photoUrl={null} size={42} />
                </View>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                {['Chart', 'Milestones', 'Timeline'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tabSegment,
                                isActive && { backgroundColor: '#3DBBB8' }
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <BambiniText
                                variant="caption"
                                weight={isActive ? "bold" : "medium"}
                                color={isActive ? "#FFFFFF" : "#333333"}
                            >
                                {tab}
                            </BambiniText>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Content Area */}
            {activeTab === 'Chart' && (
                <View style={styles.chartSection}>
                    {/* SVG Radar Chart */}
                    <View style={styles.chartWrapper}>
                        <Svg height={CHART_SIZE} width={CHART_SIZE}>
                            {/* Grid Rings */}
                            {gridRings.map((points, index) => (
                                <Polygon
                                    key={`ring-${index}`}
                                    points={points}
                                    fill="none"
                                    stroke="#E5E0D8"
                                    strokeWidth="1"
                                />
                            ))}

                            {/* Axis Lines */}
                            {DOMAINS.map((_, i) => {
                                const endPoint = getCoordinatesForValue(100, i, DOMAINS.length);
                                return (
                                    <Line
                                        key={`axis-${i}`}
                                        x1={CENTER}
                                        y1={CENTER}
                                        x2={endPoint.x}
                                        y2={endPoint.y}
                                        stroke="#E5E0D8"
                                        strokeWidth="1"
                                    />
                                );
                            })}

                            {/* Data Polygon */}
                            <G>
                                <Polygon
                                    points={radarPolygonPoints}
                                    fill="#3DBBB8"
                                    fillOpacity="0.3"
                                    stroke="#3DBBB8"
                                    strokeWidth="2"
                                />
                                {/* Value Markers */}
                                {radarPoints.map((point, i) => (
                                    <Circle
                                        key={`marker-${i}`}
                                        cx={point.x}
                                        cy={point.y}
                                        r="4"
                                        fill={DOMAINS[i].color}
                                    />
                                ))}
                            </G>

                            {/* Labels */}
                            {DOMAINS.map((domain, i) => {
                                // Push labels out slightly further than the outermost ring
                                const labelPoint = getCoordinatesForValue(115, i, DOMAINS.length);
                                return (
                                    <SvgText
                                        key={`label-${i}`}
                                        x={labelPoint.x}
                                        y={labelPoint.y + 4} // slight vertical shift for centering
                                        fontSize="12"
                                        fill="#555555"
                                        textAnchor="middle"
                                        fontWeight="500"
                                    >
                                        {domain.name}
                                    </SvgText>
                                );
                            })}
                        </Svg>
                    </View>

                    {/* Legend */}
                    <View style={styles.legendContainer}>
                        <View style={styles.legendRow}>
                            {DOMAINS.slice(0, 3).map((domain) => (
                                <View key={domain.name} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: domain.color }]} />
                                    <BambiniText variant="caption" color="#555555">{domain.name}</BambiniText>
                                </View>
                            ))}
                        </View>
                        <View style={styles.legendRow}>
                            {DOMAINS.slice(3).map((domain) => (
                                <View key={domain.name} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: domain.color }]} />
                                    <BambiniText variant="caption" color="#555555">{domain.name}</BambiniText>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Analysis Summary */}
                    <BambiniCard style={styles.summaryCard} variant="elevated">
                        <BambiniText variant="body" color="#333333">
                            <BambiniText variant="body" weight="bold" color="#000000">Strongest Areas: </BambiniText>
                            Ama Jr. excels in Language and Social development.
                        </BambiniText>
                    </BambiniCard>

                </View>
            )}

            {activeTab !== 'Chart' && (
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                    <BambiniText variant="body" color="#8E8E93">{activeTab} view coming soon.</BambiniText>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 24,
    },
    headerAvatarBorder: {
        borderWidth: 2,
        borderRadius: 25,
        padding: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3EFE6', // slightly darker tan for the inactive area
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#3DBBB8',
        overflow: 'hidden',
        marginBottom: 32,
    },
    tabSegment: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartSection: {
        alignItems: 'center',
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    legendContainer: {
        width: '100%',
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E8F1F5',
    }
});
