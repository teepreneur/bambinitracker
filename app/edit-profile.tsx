import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniInput } from '@/components/design-system/BambiniInput';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useProfile, useUpdateProfile } from '@/hooks/useData';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { PARENT_AVATARS, ParentAvatar } from '@/components/design-system/ParentAvatar';

export default function EditProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const { data: profile } = useProfile();
    const updateProfile = useUpdateProfile();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            setName(profile.name || profile.authUser?.user_metadata?.full_name || '');
            setEmail(profile.email || profile.authUser?.email || '');
            setPhone(profile.phone || '');
            setAvatarUrl(profile.avatar_url || null);
        }
    }, [profile]);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required.');
            return;
        }

        updateProfile.mutate(
            {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                avatar_url: avatarUrl || undefined,
            },
            {
                onSuccess: () => {
                    Alert.alert('Success', 'Profile updated!', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                },
                onError: (err) => {
                    Alert.alert('Error', err.message || 'Failed to update profile.');
                },
            }
        );
    };

    const initials = name ? name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2) : 'U';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#FDFBF2' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ChevronLeft color="#1A1A1A" size={28} />
                    </TouchableOpacity>
                    <BambiniText variant="h2" weight="bold" style={{ fontSize: 20 }}>Edit Profile</BambiniText>
                    <View style={{ width: 44 }} />
                </View>

                {/* Avatar Display */}
                <View style={styles.avatarSection}>
                    <ParentAvatar avatarUrl={avatarUrl} initials={initials} size={100} />
                </View>

                {/* Avatar Selection */}
                <BambiniText variant="label" weight="semibold" style={{ marginBottom: 12, marginLeft: 4, opacity: 0.6 }}>
                    Choose Avatar
                </BambiniText>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.avatarScroll}
                    style={{ marginBottom: 24, flexGrow: 0 }}
                >
                    {Object.keys(PARENT_AVATARS).map((key) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.avatarChoice,
                                avatarUrl === key && styles.avatarChoiceActive
                            ]}
                            onPress={() => setAvatarUrl(key)}
                        >
                            <ParentAvatar avatarUrl={key} size={48} />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[
                            styles.avatarChoice,
                            { backgroundColor: '#F1F5F7', borderWidth: 1, borderColor: '#D4DFE6', borderStyle: 'dashed' },
                            !avatarUrl && styles.avatarChoiceActive
                        ]}
                        onPress={() => setAvatarUrl(null)}
                    >
                        <BambiniText variant="body" weight="bold" color="#8E8E93" style={{ fontSize: 14 }}>
                            {initials}
                        </BambiniText>
                    </TouchableOpacity>
                </ScrollView>

                {/* Form */}
                <View style={styles.form}>
                    <BambiniInput
                        label="Full Name"
                        placeholder="Enter your name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <BambiniInput
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <BambiniInput
                        label="Phone (optional)"
                        placeholder="Enter phone number"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Save Button */}
                <View style={styles.footer}>
                    <BambiniButton
                        title={updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                        onPress={handleSave}
                        disabled={updateProfile.isPending}
                        style={{ borderRadius: 28 }}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingBottom: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        marginBottom: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#26B8B8',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#26B8B8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    avatarScroll: {
        gap: 12,
        paddingRight: 10,
    },
    avatarChoice: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarChoiceActive: {
        borderWidth: 2,
        borderColor: '#26B8B8',
        transform: [{ scale: 1.1 }],
    },
    form: {
        marginBottom: 24,
    },
    footer: {
        paddingHorizontal: 12,
    },
});
