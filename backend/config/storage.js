import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://zhvzwjrwhypdfeobsohp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'messenger-uploads';

let supabase = null;
if (supabaseUrl && supabaseKey && !supabaseKey.endsWith('.test')) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const getSupabaseClient = () => supabase;

/**
 * Ensures PRIVATE storage bucket exists or updates configuration to public: false
 */
export const initializeStorageBucket = async () => {
  if (!supabase) return false;
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (!error && buckets) {
      const exists = buckets.some(b => b.name === BUCKET_NAME);
      if (!exists) {
        await supabase.storage.createBucket(BUCKET_NAME, { public: false });
        console.log(`🔒 Created PRIVATE Supabase Storage bucket: '${BUCKET_NAME}'`);
      } else {
        // Ensure bucket settings are private
        await supabase.storage.updateBucket(BUCKET_NAME, { public: false }).catch(() => { });
        console.log(`🔒 PRIVATE Supabase Storage bucket verified: '${BUCKET_NAME}'`);
      }
    }
    return true;
  } catch (err) {
    console.warn('Supabase private storage bucket notice:', err.message);
    return false;
  }
};

/**
 * Generates a short-lived signed URL for an authorized private object path
 */
export const generateSignedUrl = async (storagePath, expiresIn = 3600) => {
  if (!storagePath) return null;

  // Clean relative storage path if full URL or absolute path is passed
  let cleanPath = storagePath;

  if (cleanPath.includes(`${BUCKET_NAME}/`)) {
    const parts = cleanPath.split(`${BUCKET_NAME}/`);
    if (parts.length > 1) {
      cleanPath = parts[1];
    }
  }

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    try {
      const parsed = new URL(cleanPath);
      const pathname = parsed.pathname;
      const parts = pathname.split(`${BUCKET_NAME}/`);
      if (parts.length > 1) {
        cleanPath = parts[1];
      }
    } catch (e) { }
  }

  cleanPath = cleanPath.split('?')[0].replace(/^\/+/, '');

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(cleanPath, expiresIn);

      if (!error && data?.signedUrl) {
        return {
          signedUrl: data.signedUrl,
          expiresAt: Date.now() + (expiresIn * 1000)
        };
      }
      if (error) {
        console.warn('Supabase createSignedUrl notice:', error.message);
      }
    } catch (err) {
      console.warn('Failed to generate Supabase signed URL:', err.message);
    }
  }

  // Graceful fallback for local static files or un-migrated media paths
  // Only fall back to raw path for local static files, never for private Supabase URLs
  if (storagePath.includes('/storage/v1/object/private/')) {
    console.error('createSignedUrl failed for private object, refusing to return raw URL:', storagePath);
    return { signedUrl: null, expiresAt: null };
  }
  return {
    signedUrl: storagePath,
    expiresAt: null
  };
};

/**
 * Uploads file buffer directly to PRIVATE Supabase Storage and returns storage path & metadata
 */
export const uploadToSupabaseStorage = async ({ fileBuffer, originalName, mimeType, size }) => {
  const safeOriginal = path.basename(originalName || 'file').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const ext = path.extname(safeOriginal).toLowerCase() || '.bin';
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const filePath = `uploads/file_${uniqueSuffix}${ext}`;
  const filename = path.basename(filePath);

  const type = mimeType && mimeType.startsWith('image/') ? 'image' : 'file';

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('Supabase private upload notice:', error.message);
      }
    } catch (err) {
      console.warn('Supabase storage client error:', err.message);
    }
  }

  // Base persistent path format stored in database
  const storageUrl = `${supabaseUrl}/storage/v1/object/private/${BUCKET_NAME}/${filePath}`;

  return {
    id: `media_${uniqueSuffix}`,
    filename,
    originalName,
    mimeType,
    size,
    storagePath: filePath,
    url: storageUrl,
    type
  };
};

/**
 * Safely removes a file from PRIVATE Supabase Storage if no longer referenced
 */
export const removeFromSupabaseStorage = async (storagePath) => {
  if (!supabase || !storagePath) return false;
  try {
    let cleanPath = storagePath;
    if (cleanPath.includes(`${BUCKET_NAME}/`)) {
      cleanPath = cleanPath.split(`${BUCKET_NAME}/`)[1];
    }
    cleanPath = cleanPath.split('?')[0].replace(/^\/+/, '');

    await supabase.storage.from(BUCKET_NAME).remove([cleanPath]);
    return true;
  } catch (err) {
    console.warn('Failed to remove from Supabase Storage:', err.message);
    return false;
  }
};
