import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniInput } from '@/components/design-system/BambiniInput';
import { BambiniText } from '@/components/design-system/BambiniText';
import { AVATARS, ChildAvatar } from '@/components/design-system/ChildAvatar';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Calendar, ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AddChildScreen() {
    const router = useRouter();
    const theme = Colors.light;

    const [name, setName] = useState('');
    const [dob, setDob] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');
    const [image, setImage] = useState<string>('babyImage1.png');
    const [loading, setLoading] = useState(false);

    const handleAddChild = async () => {
        if (!name || !dob) {
            Alert.alert('Missing Info', 'Please provide a name and date of birth.');
            return;
        }

        setLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData?.user) throw new Error('Not authenticated');

            // 1. Create the child record
            const { data: child, error: childError } = await supabase
                .from('children')
                .insert({
                    name,
                    dob: dob.toISOString().split('T')[0],
                    gender,
                    photo_url: image, // Placeholder for now, would upload to storage in real app
                })
                .select()
                .single();

            if (childError) throw childError;

            // 2. Link parent to child
            const { error: linkError } = await supabase
                .from('parent_children')
                .insert({
                    parent_id: userData.user.id,
                    child_id: child.id,
                });

            if (linkError) throw linkError;

            Alert.alert('Success!', `${name} has been added.`);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                    >
                        <ChevronLeft color={theme.text} size={28} />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 32 }}>
                        <BambiniText variant="h1" weight="bold">Add Child</BambiniText>
                        <BambiniText variant="body" color="#636E72" style={styles.subtitle}>
                            Tell us a bit about your little one
                        </BambiniText>
                    </View>
                </View>

                {/* Avatar Selection */}
                <View style={styles.avatarSection}>
                    <BambiniText variant="h3" weight="bold" style={{ marginBottom: 16 }}>Choose an Avatar</BambiniText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarScroll}>
                        {Object.keys(AVATARS).map((filename) => (
                            <TouchableOpacity
                                key={filename}
                                style={[
                                    styles.avatarOption,
                                    image === filename && styles.avatarOptionSelected
                                ]}
                                onPress={() => setImage(filename)}
                            >
                                <ChildAvatar photoUrl={filename} size={70} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.form}>
                    <BambiniInput
                        label="Child's Name"
                        placeholder="e.g. Ama Jr."
                        value={name}
                        onChangeText={setName}
                    />

                    {/* DOB Selector */}
                    <View style={styles.fieldContainer}>
                        <BambiniText variant="label" weight="semibold" style={styles.label}>Date of Birth</BambiniText>
                        <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Calendar color={theme.textSecondary} size={20} />
                            <BambiniText style={{ marginLeft: 12 }}>
                                {dob.toLocaleDateString()}
                            </BambiniText>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <View>
                            {Platform.OS === 'ios' ? (
                                <Modal transparent animationType="slide" visible={showDatePicker}>
                                    <View style={styles.modalOverlay}>
                                        <View style={styles.modalContent}>
                                            <View style={styles.modalHeader}>
                                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                    <BambiniText weight="bold" color="#2CC5BD" style={{ fontSize: 18 }}>Done</BambiniText>
                                                </TouchableOpacity>
                                            </View>
                                            <DateTimePicker
                                                value={dob}
                                                mode="date"
                                                display="spinner"
                                                onChange={(event, selectedDate) => {
                                                    if (selectedDate) setDob(selectedDate);
                                                }}
                                                maximumDate={new Date()}
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            ) : (
                                <DateTimePicker
                                    value={dob}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setDob(selectedDate);
                                    }}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>
                    )}

                    <View style={styles.fieldContainer}>
                        <BambiniText variant="label" weight="semibold" style={styles.label}>Gender</BambiniText>
                        <View style={styles.genderContainer}>
                            {['Boy', 'Girl', 'Other'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.genderOption,
                                        gender === option && styles.genderOptionSelected
                                    ]}
                                    onPress={() => setGender(option)}
                                >
                                    <BambiniText
                                        weight={gender === option ? "bold" : "medium"}
                                        color={gender === option ? theme.primary : theme.textSecondary}
                                    >
                                        {option}
                                    </BambiniText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <BambiniButton
                        title="Save Profile"
                        loading={loading}
                        onPress={handleAddChild}
                        style={styles.submitBtn}
                    />
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
        marginBottom: 32,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: -8,
        padding: 8,
        zIndex: 10,
    },
    subtitle: {
        marginTop: 8,
    },
    avatarSection: {
        marginBottom: 32,
    },
    avatarScroll: {
        paddingRight: 20,
    },
    avatarOption: {
        marginRight: 12,
        borderRadius: 40,
        padding: 4,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    avatarOptionSelected: {
        borderColor: '#2CC5BD',
    },
    form: {
        width: '100%',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
    },
    datePickerBtn: {
        height: 56,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderColor: '#D4DFE6',
    },
    datePickerContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#D4DFE6',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F7',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderOption: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#D4DFE6',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderOptionSelected: {
        borderColor: '#2CC5BD',
        backgroundColor: 'rgba(44, 197, 189, 0.1)',
    },
    submitBtn: {
        marginTop: 20,
    },
});
