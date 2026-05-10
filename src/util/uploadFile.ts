import { callAPI } from './callApi';

/**
 * Get a presigned URL for uploading a file directly to R2.
 * @param authToken - Optional explicit bearer token. Used by superadmin tooling
 *                    where the auth token is held in component state instead of
 *                    a cookie (callAPI's default source). When provided, the
 *                    request bypasses callAPI and goes straight to the API.
 */
export async function getPresignedUrl(
  filename: string,
  contentType?: string,
  expiresIn?: number,
  contentFolder?: string,
  authToken?: string,
): Promise<{ uploadUrl: string; fileKey: string }> {
  const body = JSON.stringify({ filename, contentType, expiresIn, contentFolder });

  if (authToken) {
    // The superadmin token is signed with a different JWT secret than regular
    // user tokens, so the public /api/files/presigned-url (which uses logged())
    // would reject it. Hit the superadmin-scoped endpoint instead.
    const API_URL = (import.meta as any).env?.PUBLIC_API_URL ?? '';
    const res = await fetch(`${API_URL}/api/superadmin/files/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body,
    });
    const json = await res.json();
    if (!res.ok || json?.status === false) {
      throw new Error(json?.message || json?.error || 'No se pudo generar la URL de subida.');
    }
    return json.data;
  }

  return await callAPI('/api/files/presigned-url', { method: 'POST', body });
}

/**
 * Upload a file directly to R2 using a presigned URL
 * @param file - The file to upload
 * @param uploadUrl - The presigned URL from getPresignedUrl
 * @param onProgress - Optional progress callback
 * @returns Promise that resolves when upload is complete
 */
export async function uploadFileToR2(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: Network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}

/**
 * Upload a file and get its fileKey
 * This is a convenience function that combines getPresignedUrl and uploadFileToR2
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @param contentFolder - Optional folder name for content type (e.g., 'chapters', 'mangas')
 * @returns The fileKey that can be used to reference the file
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void,
  contentFolder?: string,
  authToken?: string,
): Promise<string> {
  const { uploadUrl, fileKey } = await getPresignedUrl(file.name, file.type, undefined, contentFolder, authToken);
  await uploadFileToR2(file, uploadUrl, onProgress);
  return fileKey;
}

