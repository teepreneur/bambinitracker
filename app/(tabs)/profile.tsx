import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import { UserPlus, ChevronRight, Settings, LogOut } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [role, setRole] = useState('parent');

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserName(user.user_metadata?.full_name || 'User Name');
                setUserEmail(user.email || '');
                setRole(user.user_metadata?.role || 'parent');
            }
        }
        fetchUser();
    }, []);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(auth)/welcome');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                    <BambiniText variant="h1" color={theme.primary} weight="bold">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </BambiniText>
                </View>
                <BambiniText variant="h2" weight="bold" style={{ marginTop: 16 }}>{userName}</BambiniText>
                <BambiniText variant="body" color={theme.textSecondary}>
                    {role.charAt(0).toUpperCase() + role.slice(1)} Profile • {userEmail}
                </BambiniText>
            </View>

            <View style={styles.section}>
                <BambiniText variant="label" weight="semibold" style={styles.sectionLabel}>Management</BambiniText>
                <BambiniCard padding="none" variant="flat" style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/(tabs)/add-child')}
                    >
                        <View style={styles.menuIconContainer}>
                            <UserPlus size={20} color={theme.primary} />
                        </View>
                        <BambiniText style={{ flex: 1, marginLeft: 12 }}>Add another child</BambiniText>
                        <ChevronRight size={18} color={theme.tabIconDefault} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Settings size={20} color={theme.primary} />
                        </View>
                        <BambiniText style={{ flex: 1, marginLeft: 12 }}>Account Settings</BambiniText>
                        <ChevronRight size={18} color={theme.tabIconDefault} />
                    </TouchableOpacity>
                </BambiniCard>
            </View>

            <View style={styles.section}>
                <BambiniButton
                    title="Sign Out"
                    variant="outline"
                    onPress={handleSignOut}
                    style={styles.signOutBtn}
                    textStyle={{ color: '#FF6B6B' }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        marginBottom: 12,
        marginLeft: 4,
        opacity: 0.6,
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D4DFE6',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8FBFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F7',
        marginHorizontal: 16,
    },
    signOutBtn: {
        borderColor: '#FF6B6B',
    },
});
