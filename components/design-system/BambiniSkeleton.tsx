import React from 'react';
import { Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
}

export const BambiniSkeleton = ({ width, height, borderRadius, style }: SkeletonProps) => {
    const opacity = new Animated.Value(0.3);

    Animated.loop(
        Animated.sequence([
            Animated.timing(opacity, {
                toValue: 0.7,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
            }),
        ])
    ).start();

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height: height as any,
                    borderRadius: borderRadius || 8,
                    backgroundColor: '#E5E0D8',
                    opacity,
                },
                style,
            ]}
        />
    );
};
