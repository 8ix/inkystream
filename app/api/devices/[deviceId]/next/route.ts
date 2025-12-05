import { NextRequest, NextResponse } from 'next/server';
import { getAllImages, getCategoryImages, getImageUrlForDevice } from '@/lib/utils/image';
import { getDevice } from '@/lib/utils/devices';
import { categoryExists } from '@/lib/utils/categories';

interface RouteParams {
  params: Promise<{
    deviceId: string;
  }>;
}

// Simple in-memory store for current image index per device
const deviceImageIndex: Map<string, number> = new Map();

/**
 * GET /api/devices/[deviceId]/next - Returns the next image in sequence for a device
 * Query params:
 *   - category (optional): Category ID to filter by
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');

    // Validate device exists
    const device = await getDevice(deviceId);
    if (!device) {
      return NextResponse.json(
        { success: false, error: `Device '${deviceId}' not found` },
        { status: 404 }
      );
    }

    // Check category if provided
    if (categoryId) {
      const catExists = await categoryExists(categoryId);
      if (!catExists) {
        return NextResponse.json(
          { success: false, error: `Category '${categoryId}' not found` },
          { status: 400 }
        );
      }
    }

    // Get images
    const images = categoryId
      ? await getCategoryImages(categoryId)
      : await getAllImages();

    // Filter to images that have a variant for this device
    const validImages = images.filter((img) =>
      img.variants.some((v) => v.deviceId === deviceId)
    );

    if (validImages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No images found for the specified criteria',
        },
        { status: 404 }
      );
    }

    // Get and increment index
    const cacheKey = categoryId ? `${deviceId}:${categoryId}` : deviceId;
    let currentIndex = deviceImageIndex.get(cacheKey) || 0;
    
    // Wrap around if needed
    if (currentIndex >= validImages.length) {
      currentIndex = 0;
    }

    const nextImage = validImages[currentIndex];
    
    // Increment for next call
    deviceImageIndex.set(cacheKey, (currentIndex + 1) % validImages.length);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: getImageUrlForDevice(nextImage.categoryId, nextImage.id, deviceId),
        imageId: nextImage.id,
        categoryId: nextImage.categoryId,
        deviceId,
        deviceName: device.name,
        index: currentIndex,
        totalImages: validImages.length,
      },
    });
  } catch (error) {
    console.error('Error getting next image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get next image' },
      { status: 500 }
    );
  }
}

