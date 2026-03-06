import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BambiniText } from './BambiniText';

interface BambiniInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    isPassword?: boolean;
}

export function BambiniInput({ label, error, containerStyle, isPassword, ...props }: BambiniInputProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <BambiniText variant="label" weight="semibold" style={styles.label}>
                    {label}
                </BambiniText>
            )}
            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: 'rgba(255, 255, 255, 0.65)', // Soft translucent white instead of harsh solid white
                    borderColor: error ? '#FF6B6B' : 'rgba(43, 196, 169, 0.15)' // Faint primary teal border instead of harsh gray
                }
            ]}>
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholderTextColor="#636E72"
                    secureTextEntry={isPassword ? !isPasswordVisible : props.secureTextEntry}
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        {isPasswordVisible ? (
                            <EyeOff color="#9AA6B2" size={20} />
                        ) : (
                            <Eye color="#9AA6B2" size={20} />
                        )}
                    </TouchableOpacity>
                )}
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
        borderWidth: 1, // Thinner border for a more elegant, subtle look
        borderRadius: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    eyeIcon: {
        padding: 8,
        marginLeft: 8,
    },
    errorText: {
        marginTop: 4,
        marginLeft: 4,
    },
});
