import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniText } from '@/components/design-system/BambiniText';
import { ChildAvatar } from '@/components/design-system/ChildAvatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useChildren, useGenerateInviteCode } from '@/hooks/useData';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronLeft, Clock, Copy, Link2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function InviteTeacherScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const { data: allChildren } = useChildren();
    const children = allChildren || [];
    const generateCode = useGenerateInviteCode();

    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        if (!selectedChildId) {
            Alert.alert('Select a child', 'Please choose which child you want to share with a teacher.');
            return;
        }

        generateCode.mutate(selectedChildId, {
            onSuccess: (data) => {
                setGeneratedCode(data.code);
                setExpiresAt(data.expires_at);
            },
            onError: (err) => {
                Alert.alert('Error', err.message || 'Failed to generate invite code.');
            },
        });
    };

    const handleCopy = async () => {
        if (generatedCode) {
            await Clipboard.setStringAsync(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatExpiry = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        return `${hours} hours`;
    };

    const selectedChildName = children.find((c: any) => c.id === selectedChildId)?.name || '';

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#FDFBF2' }}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft color="#1A1A1A" size={28} />
                </TouchableOpacity>
                <BambiniText variant="h2" weight="bold" style={{ fontSize: 20 }}>Invite Teacher</BambiniText>
                <View style={{ width: 44 }} />
            </View>

            {/* Intro */}
            <View style={styles.introSection}>
                <View style={styles.introIcon}>
                    <Link2 color="#F5A623" size={32} />
                </View>
                <BambiniText variant="h2" weight="bold" color="#1A1A1A" style={{ textAlign: 'center', marginTop: 16 }}>
                    Share with Teacher
                </BambiniText>
                <BambiniText variant="body" color="#8E8E93" style={{ textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 20 }}>
                    Generate a code your child's teacher can use to add them to their account. The teacher will be able to view activities and log observations.
                </BambiniText>
            </View>

            {/* Select Child */}
            {!generatedCode && (
                <>
                    <BambiniText variant="label" weight="semibold" style={styles.label}>Select a child</BambiniText>
                    <View style={styles.childGrid}>
                        {children.map((child: any) => (
                            <TouchableOpacity
                                key={child.id}
                                style={[
                                    styles.childOption,
                                    selectedChildId === child.id && styles.childOptionActive,
                                ]}
                                onPress={() => setSelectedChildId(child.id)}
                                activeOpacity={0.8}
                            >
                                <ChildAvatar photoUrl={child.photo_url} size={44} />
                                <BambiniText
                                    variant="body"
                                    weight={selectedChildId === child.id ? 'bold' : 'medium'}
                                    color={selectedChildId === child.id ? '#26B8B8' : '#555555'}
                                    style={{ marginTop: 8, textAlign: 'center' }}
                                    numberOfLines={1}
                                >
                                    {child.name}
                                </BambiniText>
                                {selectedChildId === child.id && (
                                    <View style={styles.selectedCheck}>
                                        <CheckCircle2 color="#26B8B8" size={16} fill="#E8F8F5" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Generate Button */}
                    <View style={styles.generateSection}>
                        <BambiniButton
                            title={generateCode.isPending ? 'Generating...' : 'Generate Invite Code'}
                            onPress={handleGenerate}
                            disabled={!selectedChildId || generateCode.isPending}
                            style={{ borderRadius: 28 }}
                        />
                    </View>
                </>
            )}

            {/* Code Display */}
            {generatedCode && (
                <View style={styles.codeSection}>
                    <BambiniCard style={styles.codeCard} variant="flat" padding="none">
                        <BambiniText variant="caption" weight="bold" color="#8E8E93" style={{ marginBottom: 8 }}>
                            INVITE CODE FOR {selectedChildName.toUpperCase()}
                        </BambiniText>

                        {/* Code Display */}
                        <View style={styles.codeDisplay}>
                            {generatedCode.split('').map((char, idx) => (
                                <View key={idx} style={styles.codeChar}>
                                    <BambiniText variant="h1" weight="bold" color="#1A1A1A" style={{ fontSize: 32 }}>
                                        {char}
                                    </BambiniText>
                                </View>
                            ))}
                        </View>

                        {/* Copy Button */}
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.8}>
                            {copied ? (
                                <>
                                    <CheckCircle2 color="#4CAF50" size={18} />
                                    <BambiniText variant="body" weight="bold" color="#4CAF50" style={{ marginLeft: 8 }}>
                                        Copied!
                                    </BambiniText>
                                </>
                            ) : (
                                <>
                                    <Copy color="#26B8B8" size={18} />
                                    <BambiniText variant="body" weight="bold" color="#26B8B8" style={{ marginLeft: 8 }}>
                                        Copy Code
                                    </BambiniText>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Expiry Info */}
                        {expiresAt && (
                            <View style={styles.expiryRow}>
                                <Clock color="#F5A623" size={14} />
                                <BambiniText variant="caption" color="#F5A623" weight="medium" style={{ marginLeft: 6 }}>
                                    Valid for {formatExpiry(expiresAt)}
                                </BambiniText>
                            </View>
                        )}
                    </BambiniCard>

                    {/* Instructions */}
                    <BambiniCard style={styles.instructionsCard} variant="flat" padding="none">
                        <BambiniText variant="body" weight="bold" color="#1A1A1A" style={{ marginBottom: 8 }}>
                            How it works
                        </BambiniText>
                        <View style={styles.stepRow}>
                            <View style={styles.stepBubble}>
                                <BambiniText variant="caption" weight="bold" color="#26B8B8">1</BambiniText>
                            </View>
                            <BambiniText variant="body" color="#555555" style={{ flex: 1 }}>
                                Share this code with your child's teacher
                            </BambiniText>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.stepBubble}>
                                <BambiniText variant="caption" weight="bold" color="#26B8B8">2</BambiniText>
                            </View>
                            <BambiniText variant="body" color="#555555" style={{ flex: 1 }}>
                                Teacher enters the code in their Bambini app
                            </BambiniText>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.stepBubble}>
                                <BambiniText variant="caption" weight="bold" color="#26B8B8">3</BambiniText>
                            </View>
                            <BambiniText variant="body" color="#555555" style={{ flex: 1 }}>
                                They can now view activities and log observations
                            </BambiniText>
                        </View>
                    </BambiniCard>

                    {/* Generate another */}
                    <TouchableOpacity
                        style={styles.generateAnother}
                        onPress={() => {
                            setGeneratedCode(null);
                            setExpiresAt(null);
                            setSelectedChildId(null);
                        }}
                    >
                        <BambiniText variant="body" weight="bold" color="#26B8B8">
                            Generate Another Code
                        </BambiniText>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingBottom: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        marginBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    introSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    introIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFF3E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        marginBottom: 12,
        marginLeft: 4,
        opacity: 0.6,
    },
    childGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    childOption: {
        width: '30%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E8F1F5',
        position: 'relative',
    },
    childOptionActive: {
        borderColor: '#26B8B8',
        backgroundColor: '#F0FFFE',
    },
    selectedCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    generateSection: {
        paddingHorizontal: 12,
    },
    codeSection: {
        marginTop: 8,
    },
    codeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E8F1F5',
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    codeDisplay: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    codeChar: {
        width: 48,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#F8F6EE',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E8E4D4',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F8F5',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginBottom: 16,
    },
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    instructionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8F1F5',
        padding: 20,
        marginBottom: 16,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    stepBubble: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E8F8F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    generateAnother: {
        alignItems: 'center',
        paddingVertical: 16,
    },
});
