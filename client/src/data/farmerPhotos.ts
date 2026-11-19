import { createStore, useStore } from '@/lib/store';

/**
 * Farmer photos keyed by farmer ID, as small JPEG data URLs (prototype).
 * The live system uploads the photo with the registration and stores its URL on the farmer record.
 */
export const farmerPhotoStore = createStore<Record<string, string>>({});

export const useFarmerPhotos = () => useStore(farmerPhotoStore);
export const useFarmerPhoto = (id?: string) => useStore(farmerPhotoStore)[id ?? ''] ?? null;

export function setFarmerPhoto(id: string, photo: string | null) {
  farmerPhotoStore.set((all) => {
    const next = { ...all };
    if (photo) next[id] = photo;
    else delete next[id];
    return next;
  });
}

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_MAX_MB = 10;
const SIZE = 480;

/** Centre-crops to a square and scales to 480 × 480 JPEG, so a phone photo of several MB becomes ~40 KB. */
export function squarePhoto(source: CanvasImageSource, width: number, height: number): string {
  const side = Math.min(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function photoFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(squarePhoto(img, img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    img.src = url;
  });
}
