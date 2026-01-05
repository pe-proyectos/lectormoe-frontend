import { callAPI } from './callApi';

/**
 * Get a presigned URL for uploading a file directly to R2
 * @param filename - The filename
 * @param contentType - The content type (optional, will be inferred from filename if not provided)
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @param contentFolder - Optional folder name for content type (e.g., 'chapters', 'mangas', 'profile_pictures')
 * @returns Object with uploadUrl and fileKey
 */
export async function getPresignedUrl(
  filename: string,
  contentType?: string,
  expiresIn?: number,
  contentFolder?: string
): Promise<{ uploadUrl: string; fileKey: string }> {
  const response = await callAPI('/api/files/presigned-url', {
    method: 'POST',
    body: JSON.stringify({
      filename,
      contentType,
      expiresIn,
      contentFolder,
    }),
  });

  // callAPI already extracts the data
  return response;
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
  contentFolder?: string
): Promise<string> {
  const { uploadUrl, fileKey } = await getPresignedUrl(file.name, file.type, undefined, contentFolder);
  await uploadFileToR2(file, uploadUrl, onProgress);
  return fileKey;
}

