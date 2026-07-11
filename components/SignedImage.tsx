import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';
import { getObservationSignedUrl } from '@/utils/storage';

interface SignedImageProps {
    /** Object path (or legacy full URL) of the media in the observations bucket. */
    path: string | null | undefined;
    style?: StyleProp<ImageStyle>;
    /** Rendered while the signed URL resolves or if it cannot be generated. */
    placeholder?: React.ReactNode;
}

/**
 * Renders private observation media by first resolving a short-lived signed URL.
 * The observations bucket is private, so raw object paths cannot be loaded
 * directly by <Image>.
 */
export function SignedImage({ path, style, placeholder = null }: SignedImageProps) {
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setUri(null);
        getObservationSignedUrl(path).then((signed) => {
            if (active) setUri(signed);
        });
        return () => {
            active = false;
        };
    }, [path]);

    if (!uri) {
        return <View style={style}>{placeholder}</View>;
    }

    return <Image source={{ uri }} style={style} />;
}
