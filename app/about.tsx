import { BambiniText } from '@/components/design-system/BambiniText';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, Star } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AboutScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FDFBF2' }}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ChevronLeft color="#1A1A1A" size={28} />
                    </TouchableOpacity>
                    <BambiniText variant="h2" weight="bold" style={{ fontSize: 20 }}>About Bambini</BambiniText>
                    <View style={{ width: 44 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <View style={styles.iconPlaceholder}>
                            <Star color="#FFFFFF" size={48} fill="#FFFFFF" />
                        </View>
                        <BambiniText variant="h1" color="#26B8B8" weight="bold" style={styles.appName}>
                            Bambini Tracker
                        </BambiniText>
                        <BambiniText variant="body" color="#8E8E93" style={styles.version}>
                            Version 1.0.0
                        </BambiniText>
                    </View>

                    <View style={styles.missionCard}>
                        <BambiniText variant="body" color="#4A4A4A" style={styles.missionText}>
                            Empowering parents and teachers to track early childhood development together.
                            We believe that every milestone matters, and capturing them should be simple, collaborative, and joyful.
                        </BambiniText>
                    </View>

                    <View style={styles.footer}>
                        <BambiniText variant="caption" color="#A0A0A0" style={{ textAlign: 'center' }}>
                            Designed with <Heart size={12} color="#EF476F" fill="#EF476F" /> for growing minds.
                        </BambiniText>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        marginBottom: 40,
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
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: '#FFD166',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#FFD166',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        transform: [{ rotate: '10deg' }],
    },
    appName: {
        fontSize: 28,
        marginBottom: 8,
    },
    version: {
        fontSize: 14,
        letterSpacing: 1,
    },
    missionCard: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#E8F1F5',
    },
    missionText: {
        textAlign: 'center',
        lineHeight: 24,
        fontSize: 16,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 20,
    },
});
