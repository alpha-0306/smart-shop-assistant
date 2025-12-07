import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crop an image using the specified rectangle
 */
export async function cropImage(
  photoUri: string,
  cropRect: CropRect
): Promise<string> {
  try {
    // Clamp values to ensure they're valid
    const x = Math.max(0, Math.floor(cropRect.x));
    const y = Math.max(0, Math.floor(cropRect.y));
    const width = Math.max(1, Math.floor(cropRect.width));
    const height = Math.max(1, Math.floor(cropRect.height));

    const result = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        {
          crop: {
            originX: x,
            originY: y,
            width,
            height,
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Failed to crop image:', error);
    throw error;
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = uri;
  });
}

/**
 * Calculate crop rectangle for a grid cell
 */
export function calculateCropRect(
  imageWidth: number,
  imageHeight: number,
  row: number,
  col: number,
  gridRows: number = 3,
  gridCols: number = 3
): CropRect {
  const cellWidth = imageWidth / gridCols;
  const cellHeight = imageHeight / gridRows;

  return {
    x: col * cellWidth,
    y: row * cellHeight,
    width: cellWidth,
    height: cellHeight,
  };
}
