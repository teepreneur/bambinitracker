import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import Colors from '@/constants/Colors';

export default function WelcomeScreen() {
    const router = useRouter();
    const theme = Colors.light;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.primary, '#1EA69F']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
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
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginBtn}>
                            <BambiniText variant="body" color="#FFFFFF" weight="bold">
                                I have an account
                            </BambiniText>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: width > 350 ? 56 : 48,
        letterSpacing: -1,
        marginBottom: 4,
    },
    logoDecorations: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 4,
    },
    tagline: {
        textAlign: 'center',
        fontSize: width > 350 ? 18 : 16,
        opacity: 0.95,
        lineHeight: 24,
    },
    footer: {
        width: '100%',
        paddingBottom: 40,
        alignItems: 'center',
    },
    button: {
        width: '100%',
        marginBottom: 20,
    },
    loginBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
});
