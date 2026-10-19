import { MAX_PHOTO_LONG_EDGE, PHOTO_JPEG_QUALITY } from '../constants/config';

export interface CompressedImageResult {
  base64Data: string; // Base64 data without prefix or with prefix
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * Compresses an image File or Blob in the browser to:
 * - Max longest edge = 1568px
 * - Format = image/jpeg
 * - Quality = 0.8
 */
export async function compressReceiptImage(file: File | Blob): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format berkas gambar tidak didukung.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
        if (width > MAX_PHOTO_LONG_EDGE || height > MAX_PHOTO_LONG_EDGE) {
          if (width >= height) {
            height = Math.round((height * MAX_PHOTO_LONG_EDGE) / width);
            width = MAX_PHOTO_LONG_EDGE;
          } else {
            width = Math.round((width * MAX_PHOTO_LONG_EDGE) / height);
            height = MAX_PHOTO_LONG_EDGE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context tidak tersedia di browser ini.'));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export to JPEG with quality 0.8
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, PHOTO_JPEG_QUALITY);
        const base64Data = dataUrl.split(',')[1] || '';

        const compressedSize = Math.round((base64Data.length * 3) / 4);

        resolve({
          base64Data,
          mimeType,
          originalSize: file.size,
          compressedSize,
          width,
          height,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
