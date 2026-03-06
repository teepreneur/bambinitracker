import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        title: 'Personalized activities',
        description: 'Daily curated activities tailored to your child’s developmental stage.',
        image: require('@/assets/images/onboarding/onboarding_slide_1.png'),
        color: '#e9d8f9', // User-provided exact match for Slide 1
    },
    {
        title: 'Capture every moment',
        description: 'Document progress with photos, video, and notes shared between home and school.',
        image: require('@/assets/images/onboarding/onboarding_slide_2.png'),
        color: '#f8d3cd', // User-provided exact match for Slide 2
    },
    {
        title: 'Track their growth',
        description: 'Visual insights across five key domains to see how they flourish.',
        image: require('@/assets/images/onboarding/onboarding_slide_3.png'),
        color: '#d2decd', // User-provided exact match for Slide 3
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const currentSlideData = SLIDES[currentSlide];

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            const nextSlide = currentSlide + 1;
            scrollRef.current?.scrollTo({ x: nextSlide * width, animated: true });
            setCurrentSlide(nextSlide);
        } else {
            router.push('/(auth)/signup');
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / width);
        if (currentIndex !== currentSlide && currentIndex >= 0 && currentIndex < SLIDES.length) {
            setCurrentSlide(currentIndex);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentSlideData.color }]}>
            {/* Header: Back & Skip */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ChevronLeft color="#2D3A3A" size={28} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                    <BambiniText variant="body" color="#5C6B73" weight="semibold">Skip</BambiniText>
                </TouchableOpacity>
            </View>

            {/* Swipeable Content */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {SLIDES.map((slide, index) => {
                    return (
                        <View key={index} style={[styles.slideContent, { backgroundColor: slide.color }]}>
                            <View style={styles.imageContainer}>
                                <Image source={slide.image} style={styles.slideImage} resizeMode="contain" />
                            </View>

                            <View style={styles.textContainer}>
                                <BambiniText variant="h1" weight="bold" color="#2D3A3A" style={styles.title}>
                                    {slide.title}
                                </BambiniText>
                                <BambiniText variant="body" color="#5C6B73" style={styles.description}>
                                    {slide.description}
                                </BambiniText>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Static Footer: Indicators & Button */}
            <View style={styles.footerContainer}>
                <View style={styles.indicatorContainer}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                { backgroundColor: index === currentSlide ? '#136F6D' : '#D1E8E8' }
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.buttonWrapper}>
                    <BambiniButton
                        title={currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        onPress={handleNext}
                        style={styles.button}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        height: 60,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -10,
    },
    scrollView: {
        flex: 1,
    },
    slideContent: {
        width: width,
        alignItems: 'center',
        paddingTop: 0, // No top padding
    },
    imageContainer: {
        width: width,
        height: width * 1.05, // Slight bleed height
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 24,
    },
    slideImage: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        width: width,
        paddingHorizontal: 32, // Apply horizontal padding ONLY to text, so image bleeds full width
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        textAlign: 'center',
        lineHeight: 24,
    },
    footerContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    indicatorContainer: {
        flexDirection: 'row',
        marginBottom: 32,
    },
    indicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    buttonWrapper: {
        width: '100%',
    },
    button: {
        width: '100%',
    },
});
