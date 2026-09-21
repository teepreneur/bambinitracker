import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniInput } from '@/components/design-system/BambiniInput';
import { BambiniText } from '@/components/design-system/BambiniText';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { clearAppCache } from '@/lib/query';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function SignUpScreen() {
    const router = useRouter();
    const theme = Colors.light;

    const [role, setRole] = useState<'parent' | 'teacher'>('parent');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        // Validate name
        if (!trimmedName || trimmedName.length < 2) {
            Alert.alert('Name Required', 'Please enter your full name (at least 2 characters).');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail) {
            Alert.alert('Email Required', 'Please enter your email address.');
            return;
        }
        if (!emailRegex.test(trimmedEmail)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        await clearAppCache();

        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
                data: {
                    full_name: trimmedName,
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
            await clearAppCache();
            router.replace('/(tabs)');
        }
        setLoading(false);
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#f9f5ea' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft color={theme.text} size={28} />
                    </TouchableOpacity>
                    <BambiniText variant="h1" weight="bold">Create Account</BambiniText>
                    <BambiniText variant="body" color="#636E72" style={styles.subtitle}>
                        Start tracking your child's journey
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
                        isPassword
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
    scrollContent: {
        padding: 24,
    },
    header: {
        marginTop: 10,
        marginBottom: 32,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        marginLeft: -8,
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
