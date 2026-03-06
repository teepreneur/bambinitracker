import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniInput } from '@/components/design-system/BambiniInput';
import { BambiniText } from '@/components/design-system/BambiniText';
import { AVATARS, ChildAvatar } from '@/components/design-system/ChildAvatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useChildren, useDeleteChild, useUpdateChild } from '@/hooks/useData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function EditChildScreen() {
    const router = useRouter();
    const { childId } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const { data: allChildren } = useChildren();
    const updateChild = useUpdateChild();
    const deleteChild = useDeleteChild();

    const child = useMemo(() => {
        return (allChildren || []).find((c: any) => c.id === childId);
    }, [allChildren, childId]);

    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (child) {
            setName(child.name || '');
            setDob(child.dob || '');
            setGender(child.gender || '');
            setPhotoUrl(child.photo_url || null);
        }
    }, [child]);

    const getChildAge = (dobStr: string) => {
        if (!dobStr) return '';
        const dobDate = new Date(dobStr);
        const today = new Date();
        const diffMs = today.getTime() - dobDate.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days < 30) return `${days} days old`;
        const months = Math.floor(days / 30.4375);
        if (months < 24) return `${months} months old`;
        const years = Math.floor(months / 12);
        const remMonths = months % 12;
        return `${years} yr${years > 1 ? 's' : ''}${remMonths > 0 ? ` ${remMonths} mo` : ''} old`;
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required.');
            return;
        }

        updateChild.mutate(
            {
                childId: childId as string,
                updates: {
                    name: name.trim(),
                    dob: dob.trim() || undefined,
                    gender: gender.trim() || undefined,
                    photo_url: photoUrl || undefined,
                },
            },
            {
                onSuccess: () => {
                    Alert.alert('Success', `${name}'s details updated!`, [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                },
                onError: (err) => {
                    Alert.alert('Error', err.message || 'Failed to update.');
                },
            }
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Remove Child',
            `Are you sure you want to remove ${name || 'this child'} from your account? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        deleteChild.mutate(childId as string, {
                            onSuccess: () => {
                                Alert.alert('Removed', 'Child has been removed.', [
                                    { text: 'OK', onPress: () => router.back() }
                                ]);
                            },
                            onError: (err) => {
                                Alert.alert('Error', err.message || 'Failed to remove child.');
                            },
                        });
                    },
                },
            ]
        );
    };

    const genderOptions = ['Male', 'Female', 'Other'];
    const avatarKeys = Object.keys(AVATARS);

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
                    <BambiniText variant="h2" weight="bold" style={{ fontSize: 20 }}>Edit Child</BambiniText>
                    <View style={{ width: 44 }} />
                </View>

                {/* Child Avatar Display */}
                <View style={styles.avatarSection}>
                    <ChildAvatar photoUrl={photoUrl} size={88} />
                    {dob ? (
                        <BambiniText variant="body" color="#8E8E93" style={{ marginTop: 8 }}>
                            {getChildAge(dob)}
                        </BambiniText>
                    ) : null}
                </View>

                {/* Avatar Selection */}
                <BambiniText variant="label" weight="semibold" style={{ marginBottom: 12, marginLeft: 4, opacity: 0.6 }}>
                    Select Avatar
                </BambiniText>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.avatarScroll}
                    style={{ marginBottom: 24, flexGrow: 0 }}
                >
                    {avatarKeys.map((key) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.avatarChoice,
                                photoUrl === key && styles.avatarChoiceActive
                            ]}
                            onPress={() => setPhotoUrl(key)}
                        >
                            <Image source={AVATARS[key]} style={styles.avatarImage} />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[
                            styles.avatarChoice,
                            { backgroundColor: '#F1F5F7', borderWidth: 1, borderColor: '#D4DFE6', borderStyle: 'dashed' },
                            !photoUrl && styles.avatarChoiceActive
                        ]}
                        onPress={() => setPhotoUrl(null)}
                    >
                        <BambiniText variant="body" weight="bold" color="#8E8E93" style={{ fontSize: 14 }}>
                            None
                        </BambiniText>
                    </TouchableOpacity>
                </ScrollView>

                {/* Form */}
                <View style={styles.form}>
                    <BambiniInput
                        label="Child's Name"
                        placeholder="Enter name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <BambiniInput
                        label="Date of Birth"
                        placeholder="YYYY-MM-DD"
                        value={dob}
                        onChangeText={setDob}
                    />

                    {/* Gender Selection */}
                    <BambiniText variant="label" weight="semibold" style={{ marginBottom: 8, marginLeft: 4, opacity: 0.6 }}>
                        Gender
                    </BambiniText>
                    <View style={styles.genderRow}>
                        {genderOptions.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.genderOption,
                                    gender?.toLowerCase() === opt.toLowerCase() && styles.genderOptionActive,
                                ]}
                                onPress={() => setGender(opt.toLowerCase())}
                            >
                                <BambiniText
                                    variant="body"
                                    weight={gender?.toLowerCase() === opt.toLowerCase() ? 'bold' : 'medium'}
                                    color={gender?.toLowerCase() === opt.toLowerCase() ? '#26B8B8' : '#8E8E93'}
                                >
                                    {opt}
                                </BambiniText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Save Button */}
                <View style={styles.footer}>
                    <BambiniButton
                        title={updateChild.isPending ? 'Saving...' : 'Save Changes'}
                        onPress={handleSave}
                        disabled={updateChild.isPending}
                        style={{ borderRadius: 28 }}
                    />
                </View>

                {/* Delete Button */}
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Trash2 size={16} color="#FF6B6B" />
                    <BambiniText variant="body" weight="bold" color="#FF6B6B" style={{ marginLeft: 8 }}>
                        Remove Child
                    </BambiniText>
                </TouchableOpacity>
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
    avatarScroll: {
        gap: 12,
        paddingRight: 10,
    },
    avatarChoice: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarChoiceActive: {
        borderWidth: 2,
        borderColor: '#26B8B8',
        transform: [{ scale: 1.05 }],
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    form: {
        marginBottom: 24,
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    genderOption: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8F1F5',
        alignItems: 'center',
    },
    genderOptionActive: {
        backgroundColor: '#E8F8F5',
        borderColor: '#26B8B8',
    },
    footer: {
        paddingHorizontal: 12,
        marginBottom: 24,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#FFF5F5',
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
});
