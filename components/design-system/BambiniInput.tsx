import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { BambiniText } from './BambiniText';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface BambiniInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export function BambiniInput({ label, error, containerStyle, ...props }: BambiniInputProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <BambiniText variant="label" weight="semibold" style={styles.label}>
                    {label}
                </BambiniText>
            )}
            <View style={[
                styles.inputContainer,
                { backgroundColor: theme.surface || '#FFFFFF', borderColor: error ? '#FF6B6B' : '#D4DFE6' }
            ]}>
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholderTextColor="#636E72"
                    {...props}
                />
            </View>
            {error && (
                <BambiniText variant="caption" color="#FF6B6B" style={styles.errorText}>
                    {error}
                </BambiniText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        height: 56,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    errorText: {
        marginTop: 4,
        marginLeft: 4,
    },
});
