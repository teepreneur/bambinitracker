import { User } from 'lucide-react-native';
import React from 'react';
import { Image, View } from 'react-native';
import { BambiniText } from './BambiniText';

interface ParentAvatarProps {
    avatarUrl?: string | null;
    initials?: string;
    size?: number;
}

export const PARENT_AVATARS: Record<string, any> = {
    'parent_mum_1': require('@/assets/images/parent_avatars/parent_mum_1_1772817981852.png'),
    'parent_dad_1': require('@/assets/images/parent_avatars/parent_dad_1_1772817994481.png'),
    'parent_mum_2': require('@/assets/images/parent_avatars/parent_mum_2_1772818012002.png'),
    'parent_dad_2': require('@/assets/images/parent_avatars/parent_dad_2_1772818027848.png'),
};

export const ParentAvatar = ({ avatarUrl, initials, size = 68 }: ParentAvatarProps) => {
    if (avatarUrl) {
        const localSource = PARENT_AVATARS[avatarUrl];

        if (localSource) {
            return (
                <Image
                    source={localSource}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            );
        }

        // Only try to render remote images if it looks like a valid URL or URI
        if (avatarUrl.startsWith('http') || avatarUrl.startsWith('file:') || avatarUrl.startsWith('data:')) {
            return (
                <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            );
        }
    }

    if (initials) {
        return (
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: '#26B8B8',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#26B8B8',
                    shadowOffset: { width: 0, height: size * 0.05 },
                    shadowOpacity: 0.3,
                    shadowRadius: size * 0.15,
                    elevation: 6,
                }}
            >
                <BambiniText variant="h1" color="#FFFFFF" weight="bold" style={{ fontSize: size * 0.35 }}>
                    {initials}
                </BambiniText>
            </View>
        );
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
