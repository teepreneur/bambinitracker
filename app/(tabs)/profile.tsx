import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniText } from '@/components/design-system/BambiniText';
import { ChildAvatar } from '@/components/design-system/ChildAvatar';
import { ParentAvatar } from '@/components/design-system/ParentAvatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useChildren, useProfile } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import {
    Bell, ChevronRight, Edit3,
    Info,
    Link2, LogOut,
    UserPlus
} from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const { data: profile } = useProfile();
    const { data: allChildren } = useChildren();
    const children = allChildren || [];

    const userName = profile?.name || profile?.authUser?.user_metadata?.full_name || 'Parent';
    const userEmail = profile?.email || profile?.authUser?.email || '';
    const userRole = profile?.role || profile?.authUser?.user_metadata?.role || 'parent';
    const avatarUrl = profile?.avatar_url;

    const initials = userName
        .split(' ')
        .map((n: string) => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                            Alert.alert('Error', error.message);
                        } else {
                            router.replace('/(auth)/welcome');
                        }
                    },
                },
            ]
        );
    };

    const getChildAge = (dob: string) => {
        const dobDate = new Date(dob);
        const today = new Date();
        const diffMs = today.getTime() - dobDate.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days < 30) return `${days} days`;
        const months = Math.floor(days / 30.4375);
        if (months < 24) return `${months} mo`;
        const years = Math.floor(months / 12);
        return `${years} yr${years > 1 ? 's' : ''}`;
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: '#FDFBF2' }]}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <ParentAvatar avatarUrl={avatarUrl} initials={initials} size={88} />
                    <TouchableOpacity
                        style={styles.editAvatarBadge}
                        onPress={() => router.push('/edit-profile')}
                    >
                        <Edit3 color="#FFFFFF" size={12} />
                    </TouchableOpacity>
                </View>
                <BambiniText variant="h1" weight="bold" style={{ marginTop: 16, fontSize: 24 }}>
                    {userName}
                </BambiniText>
                <View style={styles.roleChip}>
                    <View style={[styles.roleDot, { backgroundColor: userRole === 'teacher' ? '#F5A623' : '#26B8B8' }]} />
                    <BambiniText variant="caption" weight="bold" color={userRole === 'teacher' ? '#F5A623' : '#26B8B8'}>
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </BambiniText>
                </View>
                <BambiniText variant="caption" color="#8E8E93" style={{ marginTop: 4 }}>
                    {userEmail}
                </BambiniText>
            </View>

            {/* My Children Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <BambiniText variant="h2" weight="bold" style={{ fontSize: 18 }}>My Children</BambiniText>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/add-child')}>
                        <View style={styles.addChildMini}>
                            <UserPlus color="#26B8B8" size={16} />
                            <BambiniText variant="caption" weight="bold" color="#26B8B8" style={{ marginLeft: 4 }}>
                                Add
                            </BambiniText>
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.childrenScroll}
                >
                    {children.map((child: any) => (
                        <TouchableOpacity
                            key={child.id}
                            style={styles.childCard}
                            onPress={() => router.push({
                                pathname: '/edit-child',
                                params: { childId: child.id }
                            })}
                            activeOpacity={0.8}
                        >
                            <View style={styles.childAvatarWrap}>
                                <ChildAvatar photoUrl={child.photo_url} size={52} />
                            </View>
                            <BambiniText variant="body" weight="bold" color="#1A1A1A" numberOfLines={1} style={{ marginTop: 10, textAlign: 'center' }}>
                                {child.name}
                            </BambiniText>
                            <BambiniText variant="caption" color="#8E8E93" style={{ marginTop: 2 }}>
                                {child.dob ? getChildAge(child.dob) : '—'}
                            </BambiniText>
                            <View style={styles.editBadge}>
                                <Edit3 color="#26B8B8" size={12} />
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Add Child Card */}
                    <TouchableOpacity
                        style={[styles.childCard, styles.addChildCard]}
                        onPress={() => router.push('/(tabs)/add-child')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.addChildCircle}>
                            <UserPlus color="#26B8B8" size={24} />
                        </View>
                        <BambiniText variant="caption" weight="bold" color="#26B8B8" style={{ marginTop: 10, textAlign: 'center' }}>
                            Add Child
                        </BambiniText>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Teacher Sharing Section */}
            <View style={styles.section}>
                <BambiniText variant="h2" weight="bold" style={{ fontSize: 18, marginBottom: 12 }}>Teacher Sharing</BambiniText>
                <BambiniCard style={styles.menuCard} variant="flat" padding="none">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/invite-teacher')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#FFF3E0' }]}>
                            <Link2 size={20} color="#F5A623" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <BambiniText variant="body" weight="bold">Invite Teacher</BambiniText>
                            <BambiniText variant="caption" color="#8E8E93">
                                Generate a code for your child's teacher
                            </BambiniText>
                        </View>
                        <ChevronRight size={18} color="#C0C0C0" />
                    </TouchableOpacity>
                </BambiniCard>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
                <BambiniText variant="h2" weight="bold" style={{ fontSize: 18, marginBottom: 12 }}>Account</BambiniText>
                <BambiniCard style={styles.menuCard} variant="flat" padding="none">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/edit-profile')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#E3F2FD' }]}>
                            <Edit3 size={20} color="#2196F3" />
                        </View>
                        <BambiniText style={{ flex: 1, marginLeft: 12 }}>Edit Profile</BambiniText>
                        <ChevronRight size={18} color="#C0C0C0" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconContainer, { backgroundColor: '#E8F5E9' }]}>
                            <Bell size={20} color="#4CAF50" />
                        </View>
                        <BambiniText style={{ flex: 1, marginLeft: 12 }}>Notifications</BambiniText>
                        <ChevronRight size={18} color="#C0C0C0" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/about')}>
                        <View style={[styles.menuIconContainer, { backgroundColor: '#F3E5F5' }]}>
                            <Info size={20} color="#9C27B0" />
                        </View>
                        <BambiniText style={{ flex: 1, marginLeft: 12 }}>About Bambini</BambiniText>
                        <ChevronRight size={18} color="#C0C0C0" />
                    </TouchableOpacity>
                </BambiniCard>
            </View>

            {/* Sign Out */}
            <View style={[styles.section, { marginTop: 8 }]}>
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <LogOut size={18} color="#FF6B6B" />
                    <BambiniText variant="body" weight="bold" color="#FF6B6B" style={{ marginLeft: 8 }}>
                        Sign Out
                    </BambiniText>
                </TouchableOpacity>
            </View>

            <BambiniText variant="caption" color="#C0C0C0" style={{ textAlign: 'center', marginTop: 16 }}>
                Bambini Tracker v1.0.0
            </BambiniText>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#26B8B8',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#26B8B8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F5A623',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FDFBF2',
    },
    roleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F8F5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    roleDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addChildMini: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F8F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    childrenScroll: {
        gap: 12,
        paddingRight: 20,
    },
    childCard: {
        width: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8F1F5',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    childAvatarWrap: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    editBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E8F8F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addChildCard: {
        borderStyle: 'dashed',
        borderColor: '#26B8B8',
        backgroundColor: '#F8FFFE',
        justifyContent: 'center',
    },
    addChildCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#E8F8F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8F1F5',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F7',
        marginHorizontal: 16,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF5F5',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
});
