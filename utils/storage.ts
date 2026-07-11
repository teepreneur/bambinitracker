import { supabase } from '@/lib/supabase';

const OBSERVATIONS_BUCKET = 'observations';

/**
 * Normalise a stored media value to an object path within the observations
 * bucket. Handles both new-style values (a bare object path) and legacy values
 * (a full public URL saved before the bucket was made private).
 */
function toObjectPath(pathOrUrl: string): string {
    const marker = `/${OBSERVATIONS_BUCKET}/`;
    const idx = pathOrUrl.indexOf(marker);
    if (idx !== -1) {
        return pathOrUrl.slice(idx + marker.length);
    }
    // Already a bare path.
    return pathOrUrl.replace(/^\/+/, '');
}

/**
 * Create a short-lived signed URL for a piece of observation media.
 * Returns null if the URL cannot be generated (e.g. the object is not owned
 * by the current user or no longer exists).
 */
export async function getObservationSignedUrl(
    pathOrUrl: string | null | undefined,
    expiresInSeconds = 3600
): Promise<string | null> {
    if (!pathOrUrl) return null;

    const objectPath = toObjectPath(pathOrUrl);
    const { data, error } = await supabase.storage
        .from(OBSERVATIONS_BUCKET)
        .createSignedUrl(objectPath, expiresInSeconds);

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
}
