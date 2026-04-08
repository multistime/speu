import { Upload } from "tus-js-client";

const TUS_CHUNK_BYTES = 6 * 1024 * 1024;

/** Supabase: для буйных MP3 праз TUS (чанкі 6 МБ), інакш стандартны upload часта дае 400 у браўзеры. */
export const SPEU_AUDIO_TUS_THRESHOLD_BYTES = 5 * 1024 * 1024;

function storageTusEndpoint(supabaseUrl: string): string {
  const trimmed = supabaseUrl.replace(/\/$/, "");
  const u = new URL(trimmed);
  if (u.hostname.endsWith(".supabase.co")) {
    const projectRef = u.hostname.slice(0, -".supabase.co".length);
    return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
  }
  return `${trimmed}/storage/v1/upload/resumable`;
}

/**
 * Resumable upload у Supabase Storage (TUS). Патрэбны жывы session.access_token.
 * @see https://supabase.com/docs/guides/storage/uploads/resumable-uploads
 */
export async function uploadBlobTusToSupabaseStorage(options: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  accessToken: string;
  bucket: string;
  objectPath: string;
  file: File;
  contentType: string;
}): Promise<void> {
  const endpoint = storageTusEndpoint(options.supabaseUrl);

  return new Promise((resolve, reject) => {
    const upload = new Upload(options.file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${options.accessToken}`,
        apikey: options.supabaseAnonKey,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: options.bucket,
        objectName: options.objectPath,
        contentType: options.contentType,
        cacheControl: "3600",
      },
      chunkSize: TUS_CHUNK_BYTES,
      onError: (err) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      },
      onSuccess: () => resolve(),
    });

    void upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]!);
      }
      upload.start();
    });
  });
}
