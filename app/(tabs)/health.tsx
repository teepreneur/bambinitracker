import { BambiniText } from '@/components/design-system/BambiniText';
import { ChildAvatar } from '@/components/design-system/ChildAvatar';
import { HealthTabView } from '@/components/HealthTabView';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useChildren } from '@/hooks/useData';
import { useDoctorSummary } from '@/hooks/useDoctorSummary';
import * as Haptics from 'expo-haptics';
import { FileText } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HealthScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const [selectedChildIndex, setSelectedChildIndex] = useState(0);

    const { data: children, isLoading: loadingChildren } = useChildren();
    const child = children?.[selectedChildIndex];
    const { generateDoctorSummary, isGenerating } = useDoctorSummary();

    const handleShareSummary = async () => {
        if (!child) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const pdfUri = await generateDoctorSummary(child.id);
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(pdfUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `${child.name}'s Doctor Visit Report`,
                    UTI: 'com.adobe.pdf', // For iOS
                });
            } else {
                Alert.alert("Error", "Sharing is not available on this device.");
            }
        } catch (error) {
            Alert.alert("Error", "Could not generate doctor report. Please try again.");
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: '#f9f5ea' }]}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <BambiniText variant="h1" weight="bold" color={theme.text} style={{ fontSize: 24 }}>
                        Health
                    </BambiniText>
                    <BambiniText variant="caption" color={theme.textSecondary}>
                        Track vaccinations and wellness
                    </BambiniText>
                </View>
            </View>

            {/* Child Selector */}
            {loadingChildren ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginBottom: 24 }} />
            ) : children && children.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 24 }}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                >
                    {children.map((c: any, i: number) => {
                        const isSelected = i === selectedChildIndex;
                        return (
                            <TouchableOpacity
                                key={c.id}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedChildIndex(i);
                                }}
                                style={[
                                    styles.childChip,
                                    {
                                        backgroundColor: isSelected ? theme.primary : theme.surface,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                    },
                                ]}
                            >
                                <ChildAvatar photoUrl={c.photo_url} size={28} />
                                <BambiniText
                                    variant="caption"
                                    weight={isSelected ? 'bold' : 'medium'}
                                    color={isSelected ? '#FFFFFF' : theme.text}
                                    style={{ marginLeft: 6 }}
                                >
                                    {c.name}
                                </BambiniText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            ) : null}

            {/* Content */}
            {!child ? (
                <View style={styles.emptyState}>
                    <BambiniText variant="body" color={theme.textSecondary}>
                        No child profile found. Add a child to get started.
                    </BambiniText>
                </View>
            ) : (
                <HealthTabView child={child} theme={theme} />
            )}

            {/* Doctor Summary Share Button at the bottom */}
            {child && (
                <TouchableOpacity
                    style={[styles.summaryButton, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}
                    onPress={handleShareSummary}
                    disabled={isGenerating}
                    activeOpacity={0.7}
                >
                    {isGenerating ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <>
                            <FileText color={theme.primary} size={20} style={{ marginRight: 8 }} />
                            <BambiniText variant="body" weight="bold" color={theme.primary}>
                                Prepare Doctor Visit Report
                            </BambiniText>
                        </>
                    )}
                </TouchableOpacity>
            )}

            {/* Disclaimer */}
            <View style={{ paddingHorizontal: 40, marginTop: 10, paddingBottom: 20 }}>
                <BambiniText variant="caption" color={theme.textSecondary} style={{ textAlign: 'center', opacity: 0.6, fontSize: 11 }}>
                    ⚠️ This report is for informational purposes. Always consult a professional for medical concerns.
                </BambiniText>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    childChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingLeft: 6,
        paddingRight: 16,
        borderRadius: 24,
        borderWidth: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    summaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 24,
        marginHorizontal: 20,
        marginTop: 24,
        borderWidth: 1,
    },
});
