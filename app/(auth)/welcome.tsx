import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.content}>
                <View style={styles.topSection}>
                    <View style={styles.logoWrapper}>
                        <Svg width="220" height="70" style={styles.logoOverlay} pointerEvents="none">
                            <Path d="M 60 20 Q 80 45 95 35 Q 150 -5 210 25" fill="none" stroke="#D1E8E8" strokeWidth="3" strokeLinecap="round" />
                            <Polygon points="60,10 63,16 70,17 65,22 66,29 60,25 54,29 55,22 50,17 57,16" fill="#F5A623" />
                            <Rect x="88" y="28" width="14" height="14" fill="#8DC63F" rx="3" transform="rotate(-15, 95, 35)" />
                            <Circle cx="210" cy="25" r="8" fill="#A67BB5" />
                        </Svg>
                        <BambiniText variant="h1" color="#2BC4A9" weight="bold" style={styles.logoText}>
                            bambini
                        </BambiniText>
                    </View>

                    <BambiniText variant="h3" weight="regular" color="#8A7B76" style={styles.tagline}>
                        Watch them grow, every step of the way
                    </BambiniText>
                </View>

                <View style={[styles.illustrationContainer, { backgroundColor: '#f9f5ea' }]}>
                    <Image
                        source={require('@/assets/images/onboarding/welcome_illustration.png')}
                        style={styles.illustration}
                        resizeMode="cover"
                    />
                </View>

                <View style={styles.footer}>
                    <BambiniButton
                        title="Get Started"
                        variant="primary"
                        onPress={() => router.push('/(auth)/onboarding')}
                        style={styles.button}
                    />
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <BambiniText variant="body" color="#136F6D" weight="semibold" style={styles.loginLink}>
                            I have an account
                        </BambiniText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f5ea', // Updated to user's requested color
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topSection: {
        marginTop: 60,
        alignItems: 'center',
    },
    logoWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoOverlay: {
        position: 'absolute',
        top: -15,
        left: '50%',
        marginLeft: -110,
        zIndex: 10,
    },
    logoText: {
        fontSize: 56,
        lineHeight: 64, // Explicitly overriding the default 34px lineHeight to prevent cutoff
        letterSpacing: -1.5, // Tighten spacing for a custom wordmark feel
        zIndex: 1,
        // Premium subtle text shadow to lift it off the background
        textShadowColor: 'rgba(0, 0, 0, 0.05)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 26, // Keep it breathable
    },
    illustrationContainer: {
        flex: 1,
        width: width, // Expand to take full width to bleed edges
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    illustration: {
        width: width * 1.1, // Oversize slightly so edges aren't visible
        height: width * 1.1,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 20,
    },
    button: {
        width: '85%',
        maxWidth: 340,
        marginBottom: 24,
    },
    loginLink: {
        marginTop: 10,
        paddingBottom: 20,
    },
});
