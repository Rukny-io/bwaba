import { api } from '@/lib/api-client';
import type { AppImageUploadType } from '@/lib/api/types';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Image upload failed'));
    };
    reader.onerror = () => reject(new Error('Image upload failed'));
    reader.readAsDataURL(file);
  });
}

export async function uploadAppImage(
  appId: string,
  type: AppImageUploadType,
  file: File,
): Promise<string> {
  const image = await readFileAsDataUrl(file);

  const { data } = await api.post<{ key: string }>(
    `/developer/apps/${appId}/upload/data`,
    { type, image },
  );

  if (!data?.key) {
    throw new Error('Image upload failed');
  }

  return data.key;
}
