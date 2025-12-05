import { NextRequest, NextResponse } from 'next/server';
import { getAllImages, getCategoryImages, getImageUrlForDevice } from '@/lib/utils/image';
import { getDevice } from '@/lib/utils/devices';
import { categoryExists } from '@/lib/utils/categories';

interface RouteParams {
  params: Promise<{
    deviceId: string;
  }>;
}

/**
 * GET /api/devices/[deviceId]/random - Returns a random image for a device
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

    // Select random image
    const randomIndex = Math.floor(Math.random() * validImages.length);
    const randomImage = validImages[randomIndex];

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: getImageUrlForDevice(randomImage.categoryId, randomImage.id, deviceId),
        imageId: randomImage.id,
        categoryId: randomImage.categoryId,
        deviceId,
        deviceName: device.name,
      },
    });
  } catch (error) {
    console.error('Error getting random image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get random image' },
      { status: 500 }
    );
  }
}

