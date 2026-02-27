import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniInput } from '@/components/design-system/BambiniInput';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
    const router = useRouter();
    const theme = Colors.light;

    const [role, setRole] = useState<'parent' | 'teacher'>('parent');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    role: role,
                },
            },
        });

        if (error) {
            if (error.message.includes('YOUR_SUPABASE_URL')) {
                Alert.alert('Configuration Required', 'Please set your Supabase URL and Anon Key in lib/supabase.ts');
            } else {
                Alert.alert('Error', error.message);
            }
        } else if (!session) {
            Alert.alert('Check your email!', 'We have sent a confirmation link to your email address.');
            router.push('/(auth)/login');
        } else {
            router.replace('/(tabs)');
        }
        setLoading(false);
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft color={theme.text} size={28} />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <BambiniText variant="h1" weight="bold">Create Account</BambiniText>
                    <BambiniText variant="body" color="#636E72" style={styles.subtitle}>
                        Join the Bambini community today
                    </BambiniText>
                </View>

                {/* Role Toggle */}
                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[styles.roleOption, role === 'parent' && { backgroundColor: theme.primary }]}
                        onPress={() => setRole('parent')}
                    >
                        <BambiniText variant="body" weight="semibold" color={role === 'parent' ? '#FFFFFF' : theme.text}>
                            I'm a Parent
                        </BambiniText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleOption, role === 'teacher' && { backgroundColor: theme.primary }]}
                        onPress={() => setRole('teacher')}
                    >
                        <BambiniText variant="body" weight="semibold" color={role === 'teacher' ? '#FFFFFF' : theme.text}>
                            I'm a Teacher
                        </BambiniText>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <BambiniInput
                        label="Full Name"
                        placeholder="John Doe"
                        value={name}
                        onChangeText={setName}
                    />
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
                        placeholder="Min. 8 characters"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <BambiniButton
                        title="Sign Up"
                        loading={loading}
                        onPress={signUpWithEmail}
                        style={styles.submitBtn}
                    />
                </View>

                <View style={styles.footer}>
                    <BambiniText variant="body">Already have an account? </BambiniText>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <BambiniText variant="body" color={theme.primary} weight="bold">Log In</BambiniText>
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginTop: 10,
        marginBottom: 32,
    },
    subtitle: {
        marginTop: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F7',
        borderRadius: 16,
        padding: 6,
        marginBottom: 32,
    },
    roleOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    form: {
        marginBottom: 20,
    },
    submitBtn: {
        marginTop: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
});
