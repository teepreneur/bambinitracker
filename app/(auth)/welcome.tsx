import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import Colors from '@/constants/Colors';

export default function WelcomeScreen() {
    const router = useRouter();
    const theme = Colors.light;

    return (
        <LinearGradient
            colors={[theme.primary, '#1EA69F']}
            style={styles.container}
        >
            <SafeAreaView style={styles.content}>
                <View style={styles.logoContainer}>
                    {/* Logo would go here. For now using text */}
                    <BambiniText variant="h1" color="#FFFFFF" weight="bold" style={styles.logoText}>
                        bambini
                    </BambiniText>
                    <View style={styles.logoDecorations}>
                        <View style={[styles.dot, { backgroundColor: '#F5A623' }]} />
                        <View style={[styles.dot, { backgroundColor: '#8DC63F' }]} />
                        <View style={[styles.dot, { backgroundColor: '#A67BB5' }]} />
                    </View>
                    <BambiniText variant="body" color="#FFFFFF" style={styles.tagline}>
                        Watch them grow, every step of the way
                    </BambiniText>
                </View>

                <View style={styles.footer}>
                    <BambiniButton
                        title="Get Started"
                        variant="secondary"
                        onPress={() => router.push('/(auth)/onboarding')}
                        style={styles.button}
                    />
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <BambiniText variant="body" color="#FFFFFF" weight="semibold" style={styles.loginLink}>
                            I have an account
                        </BambiniText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 56,
    },
    logoDecorations: {
        flexDirection: 'row',
        marginTop: -10,
        marginBottom: 20,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginHorizontal: 4,
    },
    tagline: {
        textAlign: 'center',
        fontSize: 18,
        opacity: 0.9,
    },
    footer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        width: '100%',
        marginBottom: 20,
    },
    loginLink: {
        marginTop: 10,
    },
});
