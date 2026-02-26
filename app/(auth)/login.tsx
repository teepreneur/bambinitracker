import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniInput } from '@/components/design-system/BambiniInput';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
    const router = useRouter();
    const theme = Colors.light;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message.includes('YOUR_SUPABASE_URL')) {
                Alert.alert('Configuration Required', 'Please set your Supabase URL and Anon Key in lib/supabase.ts');
            } else {
                Alert.alert('Error', error.message);
            }
        } else {
            router.replace('/(tabs)');
        }
        setLoading(false);
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <BambiniText variant="h1" weight="bold">Welcome Back</BambiniText>
                    <BambiniText variant="body" color="#636E72" style={styles.subtitle}>
                        Sign in to continue tracking growth
                    </BambiniText>
                </View>

                <View style={styles.form}>
                    <BambiniInput
                        label="Email"
                        placeholder="john@example.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <BambiniInput
                        label="Password"
                        placeholder="Your password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <BambiniButton
                        title="Log In"
                        loading={loading}
                        onPress={signInWithEmail}
                        style={styles.submitBtn}
                    />

                    <TouchableOpacity style={styles.forgotPass}>
                        <BambiniText variant="body" color={theme.textSecondary}>Forgot Password?</BambiniText>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <BambiniText variant="body">Don't have an account? </BambiniText>
                    <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                        <BambiniText variant="body" color={theme.primary} weight="bold">Sign Up</BambiniText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
    },
    subtitle: {
        marginTop: 8,
    },
    form: {
        marginBottom: 20,
    },
    submitBtn: {
        marginTop: 12,
    },
    forgotPass: {
        marginTop: 16,
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
    },
});
