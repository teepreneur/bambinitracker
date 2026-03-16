import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Sparkles, Star, Trophy, X } from 'lucide-react-native';
import { BambiniText } from './design-system/BambiniText';
import { BambiniButton } from './design-system/BambiniButton';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface CelebrationOverlayProps {
    visible: boolean;
    onClose: () => void;
    completedCount: number;
    goal: number;
    activityTitle: string;
}

export function CelebrationOverlay({ visible, onClose, completedCount, goal, activityTitle }: CelebrationOverlayProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    
    const insets = useSafeAreaInsets();
    
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [staggerAnims] = useState([
        new Animated.Value(0), // Title
        new Animated.Value(0), // Subtitle
        new Animated.Value(0), // Progress
        new Animated.Value(0), // Actions
    ]);

    useEffect(() => {
        if (visible) {
            // Main entry
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Staggered content
            Animated.stagger(150, staggerAnims.map(anim => 
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                })
            )).start();
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.8);
            staggerAnims.forEach(a => a.setValue(0));
        }
    }, [visible]);

    const handleShare = async () => {
        const message = `Just finished "${activityTitle}" with my little one on Bambini! 🎊 We've done ${completedCount}/${goal} activities today. Tracking every milestone! 👶✨`;
        
        try {
            const result = await Share.share({
                message,
                title: 'Bambini Achievement',
            });
            if (result.action === Share.sharedAction) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Sharing error:', error);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <LottieView
                    source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_u4yrau.json' }}
                    autoPlay
                    loop={false}
                    style={styles.lottieConfetti}
                />

                <Animated.View 
                    style={[
                        styles.content, 
                        { 
                            backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                            maxHeight: height - (insets.top + insets.bottom + 100),
                        }
                    ]}
                >
                    <TouchableOpacity 
                        style={[styles.closeButton, { top: 16 }]} 
                        onPress={onClose} 
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <X color="#A0A0A0" size={20} />
                    </TouchableOpacity>

                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        bounces={false}
                    >
                        <Animated.View style={[styles.header, { opacity: staggerAnims[0], transform: [{ translateY: staggerAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                            <LinearGradient
                                colors={['#8DC63F', '#26B8B8']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconCircle}
                            >
                                <Trophy color="#FFFFFF" size={44} />
                            </LinearGradient>
                            
                            <BambiniText variant="h1" weight="bold" style={styles.title}>
                                Magic Moment! ✨
                            </BambiniText>
                            
                            <Animated.View style={{ opacity: staggerAnims[1], transform: [{ translateY: staggerAnims[1].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
                                <BambiniText variant="body" style={styles.subtitle}>
                                    You just captured a beautiful milestone:
                                </BambiniText>
                                <BambiniText variant="h2" weight="bold" color={theme.text} style={styles.activityName}>
                                    {activityTitle}
                                </BambiniText>
                            </Animated.View>
                        </Animated.View>

                        {/* Progress Indicators */}
                        <Animated.View 
                            style={[
                                styles.progressContainer,
                                { 
                                    opacity: staggerAnims[2],
                                    transform: [{ translateY: staggerAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                                }
                            ]}
                        >
                            <View style={styles.statsRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Star size={14} color="#F5A623" fill="#F5A623" />
                                    <BambiniText variant="h3" weight="bold" style={{ marginLeft: 6 }}>Daily Ritual</BambiniText>
                                </View>
                                <BambiniText variant="h3" weight="bold" color="#26B8B8">
                                    {completedCount}/{goal}
                                </BambiniText>
                            </View>
                            
                            <View style={[styles.progressTrack, { backgroundColor: '#F3F4F6' }]}>
                                <Animated.View 
                                    style={[
                                        styles.progressBar, 
                                        { 
                                            width: `${Math.min((completedCount / goal) * 100, 100)}%`,
                                            backgroundColor: '#26B8B8'
                                        }
                                    ]} 
                                />
                            </View>
                            
                            <BambiniText variant="caption" color="#6B7280" style={styles.progressText} weight="medium">
                                {completedCount === 0 ? "Starting the journey..." : 
                                 completedCount >= goal 
                                    ? "Goal crushed! You're an amazing parent! 🏆" 
                                    : `${goal - completedCount} more to reach your daily goal.`}
                            </BambiniText>
                        </Animated.View>

                        <Animated.View 
                            style={[
                                styles.footer,
                                { 
                                    opacity: staggerAnims[3],
                                    transform: [{ translateY: staggerAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                                }
                            ]}
                        >
                            <BambiniButton 
                                title="Share Achievement" 
                                onPress={handleShare}
                                variant="outline"
                                style={styles.shareButton}
                                leftIcon={<Share2 size={18} color={theme.text} />}
                            />
                            <BambiniButton 
                                title="Keep Nurturing" 
                                onPress={onClose}
                                style={styles.continueButton}
                                rightIcon={<Sparkles size={18} color="#FFFFFF" />}
                            />
                        </Animated.View>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    lottieConfetti: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1001,
        pointerEvents: 'none',
    },
    content: {
        width: width * 0.9,
        borderRadius: 40,
        zIndex: 1002,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 48,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        zIndex: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#26B8B8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    title: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 34,
    },
    subtitle: {
        color: '#6B7280',
        marginBottom: 4,
        textAlign: 'center',
        fontSize: 14,
    },
    activityName: {
        textAlign: 'center',
        fontSize: 18,
        paddingHorizontal: 8,
        lineHeight: 24,
    },
    progressContainer: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTrack: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        borderRadius: 6,
    },
    progressText: {
        textAlign: 'center',
        fontSize: 12,
    },
    footer: {
        width: '100%',
        gap: 12,
        marginBottom: 8,
    },
    shareButton: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        borderWidth: 2,
    },
    continueButton: {
        width: '100%',
        height: 58,
        borderRadius: 18,
        backgroundColor: '#26B8B8',
        shadowColor: '#26B8B8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
});
