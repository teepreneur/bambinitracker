import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

/**
 * Media bucket registry.
 *
 * Bucket names must match supabase/fix_media_storage_rls.sql and the bucket
 * settings in the Supabase dashboard (bucket_id = key used below).
 *
 * Path convention: every upload lives under the uploader's <auth.uid>/ folder,
 * which is what the storage RLS policies scope by.
 */
export const MEDIA_BUCKETS = {
    /** Private — parent/teacher activity photos. Signed URLs required to render. */
    activities: 'activities',
    /** Public — shop display assets (hardcoded URLs in components/shop/). */
    shop: 'shop',
} as const;

export type MediaBucket = keyof typeof MEDIA_BUCKETS;

/** Per-bucket path context — keeps the generic upload helper branch-free. */
type UploadContext<T extends MediaBucket> =
    T extends 'activities' ? { activityId: string } :
    T extends 'shop' ? { itemSlug: string } :
    never;

export interface UploadedPath {
    path: string;
}

export interface MediaUploadOptions {
    mimeType?: string;
}

export const extractUploadError = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) {
        return String((err as { message: unknown }).message);
    }
    return 'Unknown upload failure';
};

/** Builds `<auth.uid>/...` paths. One arm per bucket in MEDIA_BUCKETS. */
function buildMediaPath<T extends MediaBucket>(
    bucket: T,
    userId: string,
    ctx: UploadContext<T>,
    ts: number,
    ext: string,
): string {
    switch (bucket) {
        case 'activities':
            return `${userId}/${(ctx as { activityId: string }).activityId}/${ts}.${ext}`;
        case 'shop':
            return `${userId}/shop/${(ctx as { itemSlug: string }).itemSlug}/${ts}.${ext}`;
    }
}

/**
 * Generic upload primitive for all media buckets.
 *
 * Path, not URL, comes back: the buckets hold children's media, so rendering
 * uses expiring signed URLs instead of persisting addresses in the database.
 * Call sites keep passing `path` through `media_urls`; renderers sign via
 * `createMediaSignedUrl`.
 */
export async function uploadMedia<T extends MediaBucket>(
    bucket: T,
    imageBase64: string,
    ctx: UploadContext<T>,
    opts: MediaUploadOptions = {},
): Promise<UploadedPath> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error('Not authenticated — cannot upload image');
    }

    const ts = Date.now();
    const ext = opts.mimeType?.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const path = buildMediaPath(bucket, user.id, ctx, ts, ext);

    const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKETS[bucket])
        .upload(path, decode(imageBase64), {
            contentType: opts.mimeType || 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) throw uploadError;

    return { path };
}

/** Expiring render URL for a stored media path. Private-bucket safe. */
export async function createMediaSignedUrl(
    bucket: MediaBucket,
    path: string,
    expiresIn = 3600,
): Promise<string> {
    const { data, error } = await supabase.storage
        .from(MEDIA_BUCKETS[bucket])
        .createSignedUrl(path, expiresIn);
    if (error) throw error;
    if (!data?.signedUrl) {
        throw new Error('Signed URL unavailable for media path');
    }
    return data.signedUrl;
}

/** Thin domain wrapper: activity feedback photos → private activities bucket. */
export function uploadObservationMedia(
    imageBase64: string,
    opts: { activityId: string; mimeType?: string },
): Promise<UploadedPath> {
    return uploadMedia('activities', imageBase64, { activityId: opts.activityId }, {
        mimeType: opts.mimeType,
    });
}
