import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import Colors from '@/constants/Colors';
import { Sparkles, Camera, BarChart2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        title: 'Personalized activities',
        description: 'Daily curated activities tailored to your child’s developmental stage.',
        icon: Sparkles,
        color: '#A67BB5',
    },
    {
        title: 'Capture every moment',
        description: 'Document progress with photos, video, and notes shared between home and school.',
        icon: Camera,
        color: '#4ECDC4',
    },
    {
        title: 'Track their growth',
        description: 'Visual insights across five key domains to see how they flourish.',
        icon: BarChart2,
        color: '#8DC63F',
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const theme = Colors.light;
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            router.push('/(auth)/signup');
        }
    };

    const Icon = SLIDES[currentSlide].icon;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.skipContainer}>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                    <BambiniText variant="body" color={theme.tabIconDefault}>Skip</BambiniText>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: SLIDES[currentSlide].color + '20' }]}>
                    <Icon color={SLIDES[currentSlide].color} size={64} />
                </View>

                <View style={styles.textContainer}>
                    <BambiniText variant="h1" weight="bold" style={styles.title}>
                        {SLIDES[currentSlide].title}
                    </BambiniText>
                    <BambiniText variant="body" style={styles.description}>
                        {SLIDES[currentSlide].description}
                    </BambiniText>
                </View>

                <View style={styles.indicatorContainer}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                { backgroundColor: index === currentSlide ? theme.primary : '#D4DFE6' }
                            ]}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <BambiniButton
                    title={currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    onPress={handleNext}
                    style={styles.button}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skipContainer: {
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.7,
    },
    indicatorContainer: {
        flexDirection: 'row',
        marginTop: 40,
    },
    indicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    button: {
        width: '100%',
    },
});
