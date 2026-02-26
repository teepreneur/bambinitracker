import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface BambiniTextProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button' | 'label';
    weight?: 'regular' | 'medium' | 'semibold' | 'bold';
    color?: string;
}

export function BambiniText({
    style,
    variant = 'body',
    weight,
    color,
    ...props
}: BambiniTextProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getVariantStyle = () => {
        switch (variant) {
            case 'h1': return styles.h1;
            case 'h2': return styles.h2;
            case 'h3': return styles.h3;
            case 'body': return styles.body;
            case 'caption': return styles.caption;
            case 'button': return styles.button;
            case 'label': return styles.label;
            default: return styles.body;
        }
    };

    const getWeightStyle = () => {
        const isHeading = ['h1', 'h2', 'h3'].includes(variant);
        const defaultFont = isHeading ? 'Nunito' : 'Inter';

        const fontSuffix = (w?: string) => {
            switch (w) {
                case 'regular': return 'Regular';
                case 'medium': return 'Medium';
                case 'semibold': return 'SemiBold';
                case 'bold': return 'Bold';
                default: return isHeading ? 'Bold' : 'Regular';
            }
        };

        return { fontFamily: `${defaultFont}-${fontSuffix(weight)}` };
    };

    return (
        <Text
            style={[
                getVariantStyle(),
                getWeightStyle(),
                { color: color || theme.text },
                style
            ]}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    h1: { fontSize: 28, lineHeight: 34 },
    h2: { fontSize: 22, lineHeight: 28 },
    h3: { fontSize: 18, lineHeight: 24 },
    body: { fontSize: 16, lineHeight: 22 },
    caption: { fontSize: 13, lineHeight: 18 },
    button: { fontSize: 16, lineHeight: 20 },
    label: { fontSize: 14, lineHeight: 18 },
});
