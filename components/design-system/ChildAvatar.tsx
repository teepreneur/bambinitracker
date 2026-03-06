import { User } from 'lucide-react-native';
import React from 'react';
import { Image, View } from 'react-native';

interface ChildAvatarProps {
    photoUrl?: string | null;
    size?: number;
}

export const AVATARS: Record<string, any> = {
    'babyImage1.png': require('@/assets/images/avatars/babyImage1.png'),
    'babyImage2.png': require('@/assets/images/avatars/babyImage2.png'),
    'babyImage3.png': require('@/assets/images/avatars/babyImage3.png'),
    'BabyImage4.png': require('@/assets/images/avatars/BabyImage4.png'),
    'babyImage5.png': require('@/assets/images/avatars/babyImage5.png'),
    'babyImage6.png': require('@/assets/images/avatars/babyImage6.png'),
    'babyImage7.png': require('@/assets/images/avatars/babyImage7.png'),
    'babyImage8.png': require('@/assets/images/avatars/babyImage8.png'),
    'babyImage9.png': require('@/assets/images/avatars/babyImage9.png'),
    'babyImage10.png': require('@/assets/images/avatars/babyImage10.png'),
    'babyImage11.png': require('@/assets/images/avatars/babyImage11.png'),
    'babyImage12.png': require('@/assets/images/avatars/babyImage12.png'),
    'baby_boy_1.png': require('@/assets/images/avatars/baby_boy_1.png'),
    'baby_girl_1.png': require('@/assets/images/avatars/baby_girl_1.png'),
    'child_boy_1.png': require('@/assets/images/avatars/child_boy_1.png'),
    'child_boy_2.png': require('@/assets/images/avatars/child_boy_2.png'),
    'child_boy_3.png': require('@/assets/images/avatars/child_boy_3.png'),
    'child_girl_1.png': require('@/assets/images/avatars/child_girl_1.png'),
    'child_girl_2.png': require('@/assets/images/avatars/child_girl_2.png'),
    'child_girl_3.png': require('@/assets/images/avatars/child_girl_3.png'),
    'toddler_boy_1.png': require('@/assets/images/avatars/toddler_boy_1.png'),
    'toddler_boy_2.png': require('@/assets/images/avatars/toddler_boy_2.png'),
    'toddler_girl_1.png': require('@/assets/images/avatars/toddler_girl_1.png'),
    'toddler_girl_2.png': require('@/assets/images/avatars/toddler_girl_2.png'),
};

export const ChildAvatar = ({ photoUrl, size = 68 }: ChildAvatarProps) => {
    if (photoUrl) {
        const localSource = AVATARS[photoUrl];

        if (localSource) {
            return (
                <Image
                    source={localSource}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            );
        }

        // Only try to render remote images if it looks like a valid URL
        if (photoUrl.startsWith('http') || photoUrl.startsWith('file:') || photoUrl.startsWith('data:')) {
            return (
                <Image
                    source={{ uri: photoUrl }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            );
        }
    }

    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: '#F3EFEA',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <User color="#A7A29B" size={size * 0.5} />
        </View>
    );
};
