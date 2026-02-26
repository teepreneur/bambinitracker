import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface BambiniButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function BambiniButton({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    style,
    textStyle,
    disabled,
    ...props
}: BambiniButtonProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getVariantStyle = () => {
        switch (variant) {
            case 'primary': return { backgroundColor: theme.primary };
            case 'secondary': return { backgroundColor: theme.secondary };
            case 'outline': return {
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: theme.primary
            };
            case 'ghost': return { backgroundColor: 'transparent' };
            default: return { backgroundColor: theme.primary };
        }
    };

    const getTextColor = () => {
        if (variant === 'outline' || variant === 'ghost') return theme.primary;
        return '#FFFFFF';
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'small': return { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 };
            case 'medium': return { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 };
            case 'large': return { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 20 };
            default: return { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 };
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getSizeStyle(),
                getVariantStyle(),
                disabled && styles.disabled,
                style
            ]}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[
                    styles.text,
                    { color: getTextColor() },
                    size === 'small' && { fontSize: 14 },
                    size === 'large' && { fontSize: 18 },
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    text: {
        fontFamily: 'Nunito-Bold', // Note: We need to ensure Nunito is loaded
        fontSize: 16,
        fontWeight: '700',
    },
    disabled: {
        opacity: 0.5,
    },
});
