import React from 'react';
import { View, StyleSheet, ViewStyle, ShadowStyleProp } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface BambiniCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'elevated' | 'flat' | 'outline';
    padding?: 'none' | 'small' | 'medium' | 'large';
}

export function BambiniCard({
    children,
    style,
    variant = 'elevated',
    padding = 'medium'
}: BambiniCardProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'small': return 12;
            case 'medium': return 20;
            case 'large': return 28;
            default: return 20;
        }
    };

    return (
        <View style={[
            styles.card,
            { backgroundColor: theme.surface || '#FFFFFF', padding: getPadding() },
            variant === 'elevated' && styles.elevated,
            variant === 'outline' && { borderWidth: 1, borderColor: '#D4DFE6' },
            style
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    elevated: {
        shadowColor: '#2D3436',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
});
