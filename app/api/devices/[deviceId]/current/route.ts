import { NextRequest, NextResponse } from 'next/server';
import { getAllImages, getCategoryImages, getImageUrlForDevice } from '@/lib/utils/image';
import { getDevice } from '@/lib/utils/devices';
import { categoryExists } from '@/lib/utils/categories';

interface RouteParams {
  params: Promise<{
    deviceId: string;
  }>;
}

// Simple in-memory store for current image per device
// In production, this could be persisted to a file or database
const deviceCurrentImage: Map<string, { categoryId: string; imageId: string }> = new Map();

/**
 * GET /api/devices/[deviceId]/current - Returns the current image for a device
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

    // Get current image or default to first
    let current = deviceCurrentImage.get(deviceId);
    
    // Verify the current image still exists and matches category filter
    if (current) {
      const stillValid = validImages.some(
        (img) => img.id === current!.imageId && img.categoryId === current!.categoryId
      );
      if (!stillValid) {
        current = undefined;
      }
    }

    // Default to first image if no current set
    if (!current) {
      current = {
        categoryId: validImages[0].categoryId,
        imageId: validImages[0].id,
      };
      deviceCurrentImage.set(deviceId, current);
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: getImageUrlForDevice(current.categoryId, current.imageId, deviceId),
        imageId: current.imageId,
        categoryId: current.categoryId,
        deviceId,
        deviceName: device.name,
        totalImages: validImages.length,
      },
    });
  } catch (error) {
    console.error('Error getting current image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get current image' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices/[deviceId]/current - Set the current image for a device
 * Body: { categoryId: string, imageId: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;
    const body = await request.json();
    const { categoryId, imageId } = body;

    // Validate device exists
    const device = await getDevice(deviceId);
    if (!device) {
      return NextResponse.json(
        { success: false, error: `Device '${deviceId}' not found` },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!categoryId || !imageId) {
      return NextResponse.json(
        { success: false, error: 'categoryId and imageId are required' },
        { status: 400 }
      );
    }

    // Store the current image
    deviceCurrentImage.set(deviceId, { categoryId, imageId });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: getImageUrlForDevice(categoryId, imageId, deviceId),
        imageId,
        categoryId,
        deviceId,
      },
    });
  } catch (error) {
    console.error('Error setting current image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set current image' },
      { status: 500 }
    );
  }
}

