import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniInput } from '@/components/design-system/BambiniInput';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { Camera, Calendar, User, School } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function AddChildScreen() {
    const router = useRouter();
    const theme = Colors.light;

    const [name, setName] = useState('');
    const [dob, setDob] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');
    const [schoolCode, setSchoolCode] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

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

            // 3. Link to school if code provided
            if (schoolCode) {
                const { data: school } = await supabase
                    .from('schools')
                    .select('id')
                    .eq('code', schoolCode)
                    .single();

                if (school) {
                    await supabase
                        .from('children')
                        .update({ school_id: school.id })
                        .eq('id', child.id);
                }
            }

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
                    <BambiniText variant="h1" weight="bold">Add Child</BambiniText>
                    <BambiniText variant="body" color="#636E72" style={styles.subtitle}>
                        Tell us a bit about your little one
                    </BambiniText>
                </View>

                {/* Photo Upload */}
                <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.photo} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Camera color={theme.primary} size={32} />
                            <BambiniText variant="caption" color={theme.primary} style={{ marginTop: 8 }}>
                                Add Photo
                            </BambiniText>
                        </View>
                    )}
                </TouchableOpacity>

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
                        <DateTimePicker
                            value={dob}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) setDob(selectedDate);
                            }}
                            maximumDate={new Date()}
                        />
                    )}

                    <BambiniInput
                        label="Gender (Optional)"
                        placeholder="Boy, Girl, etc."
                        value={gender}
                        onChangeText={setGender}
                    />

                    <BambiniInput
                        label="School Code (Optional)"
                        placeholder="Ask your child's teacher"
                        value={schoolCode}
                        onChangeText={setSchoolCode}
                        autoCapitalize="characters"
                    />

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
    },
    subtitle: {
        marginTop: 8,
    },
    photoContainer: {
        alignSelf: 'center',
        marginBottom: 32,
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F1F5F7',
        borderWidth: 2,
        borderColor: '#2CC5BD',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
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
    submitBtn: {
        marginTop: 20,
    },
});
