import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { CelebrationOverlay } from './CelebrationOverlay';
import { useDailySummary } from '@/hooks/useData';
import { format } from 'date-fns';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ActivityFeedbackModalProps {
    visible: boolean;
    childId: string;
    activityId: string;
    activityTitle: string;
    onClose: () => void;
    onSubmit: (rating: string, note: string, mediaUrls: string[]) => void;
    isSubmitting: boolean;
    isSuccess?: boolean;
}

const RATINGS = [
    { value: 'loved_it', label: 'Loved it', emoji: '😍', color: '#4CAF50' },
    { value: 'just_ok', label: 'Just okay', emoji: '😐', color: '#F5A623' },
    { value: 'too_hard', label: 'Too hard', emoji: '😓', color: '#FF5252' },
];

export function ActivityFeedbackModal({ visible, childId, activityId, activityTitle, onClose, onSubmit, isSubmitting, isSuccess }: ActivityFeedbackModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: dailySummary } = useDailySummary(childId, today);

    const [rating, setRating] = useState<string>('loved_it');
    const [note, setNote] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload an image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setImageBase64(result.assets[0].base64 || null);
        }
    };

    const handleSubmit = async () => {
        let uploadedUrls: string[] = [];

        if (imageBase64) {
            setIsUploading(true);
            try {
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                const { data, error } = await supabase.storage
                    .from('observations')
                    .upload(fileName, decode(imageBase64), {
                        contentType: 'image/jpeg',
                    });

                if (error) throw error;

                const { data: publicUrlData } = supabase.storage
                    .from('observations')
                    .getPublicUrl(fileName);

                if (publicUrlData) {
                    uploadedUrls.push(publicUrlData.publicUrl);
                }
            } catch (err: any) {
                console.error("Upload error:", err);
                Alert.alert("Upload Failed", "Could not upload the image. Proceeding without it.");
            } finally {
                setIsUploading(false);
            }
        }

        onSubmit(rating, note, uploadedUrls);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#f9f5ea' }]}>
                    <View style={styles.dragHandle} />
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <BambiniText variant="h2" weight="bold">Activity Completed! 🎉</BambiniText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color="#666666" size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* How did it go? */}
                    <BambiniText variant="h3" weight="bold" style={{ marginTop: 24, marginBottom: 16 }}>
                        How did it go?
                    </BambiniText>
                    <View style={styles.ratingsRow}>
                        {RATINGS.map((r) => (
                            <TouchableOpacity
                                key={r.value}
                                activeOpacity={0.7}
                                style={[
                                    styles.ratingButton,
                                    rating === r.value ? {
                                        borderColor: r.color,
                                        backgroundColor: r.color + '15',
                                        borderWidth: 3,
                                        transform: [{ scale: 1.05 }],
                                    } : {
                                        borderColor: 'transparent',
                                        backgroundColor: colorScheme === 'dark' ? '#222222' : '#FFFFFF',
                                        borderWidth: 2,
                                    }
                                ]}
                                onPress={() => setRating(r.value)}
                            >
                                <View style={{ height: 50, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
                                    <Text style={{ fontSize: 44, includeFontPadding: false }}>{r.emoji}</Text>
                                </View>
                                <BambiniText
                                    variant="caption"
                                    weight="bold"
                                    color={rating === r.value ? r.color : '#8E8E93'}
                                    style={{ marginTop: 8 }}
                                >
                                    {r.label}
                                </BambiniText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Notes */}
                    <BambiniText variant="h3" weight="bold" style={{ marginTop: 24, marginBottom: 8 }}>
                        Add a note (optional)
                    </BambiniText>
                    <TextInput
                        style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                        placeholder="Did they enjoy it? What did you notice?"
                        placeholderTextColor="#A0A0A0"
                        multiline
                        numberOfLines={4}
                        value={note}
                        onChangeText={setNote}
                    />

                    {/* Photo Upload */}
                    <BambiniText variant="h3" weight="bold" style={{ marginTop: 24, marginBottom: 8 }}>
                        Add a photo (optional)
                    </BambiniText>
                    {imageUri ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => { setImageUri(null); setImageBase64(null); }}
                            >
                                <X color="#FFFFFF" size={16} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.photoButton, { borderColor: theme.border }]} onPress={handlePickImage}>
                            <Camera color="#A0A0A0" size={24} />
                            <BambiniText variant="body" color="#A0A0A0" style={{ marginLeft: 8 }}>
                                Upload a photo
                            </BambiniText>
                        </TouchableOpacity>
                    )}

                    {/* Submit */}
                    <BambiniButton
                        title="Save Feedback"
                        onPress={handleSubmit}
                        loading={isSubmitting || isUploading}
                        disabled={isSubmitting || isUploading}
                        style={{ marginTop: 32, marginBottom: Platform.OS === 'ios' ? 20 : 0 }}
                        />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 48 : 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 20,
        minHeight: 400,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    celebrationEmoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    dragHandle: {
        width: 48,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
    },
    ratingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    ratingButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        fontSize: 16,
        fontFamily: 'Nunito-Medium',
        height: 100,
        textAlignVertical: 'top',
        backgroundColor: '#FFFFFF',
        borderColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    photoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        paddingVertical: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#D0D0D0',
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
    },
    imagePreviewContainer: {
        position: 'relative',
        width: 120,
        height: 120,
        borderRadius: 16,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF5252',
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    }
});
