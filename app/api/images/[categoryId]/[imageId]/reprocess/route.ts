import { NextRequest, NextResponse } from 'next/server';
import { reprocessImage, hasSourceImage } from '@/lib/utils/image';
import { getDevices } from '@/lib/utils/devices';
import type { DitheringAlgorithm } from '@/lib/processors/dither-types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    categoryId: string;
    imageId: string;
  }>;
}

/**
 * POST /api/images/[categoryId]/[imageId]/reprocess
 * Re-process an existing image with new settings
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId, imageId } = await params;

    // Check if source image exists
    const hasSource = await hasSourceImage(categoryId, imageId);
    if (!hasSource) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Original source image not available. This image was uploaded before source storage was enabled. Please delete and re-upload to enable re-processing.' 
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      deviceIds, 
      dithering = 'floyd-steinberg'
    } = body as {
      deviceIds?: string[];
      dithering?: DitheringAlgorithm;
    };

    // If no deviceIds provided, use all configured devices
    let targetDeviceIds = deviceIds;
    if (!targetDeviceIds || targetDeviceIds.length === 0) {
      const devices = await getDevices();
      targetDeviceIds = devices.map(d => d.id);
    }

    if (targetDeviceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No devices configured' },
        { status: 400 }
      );
    }

    // Re-process the image
    const metadata = await reprocessImage(
      categoryId,
      imageId,
      targetDeviceIds,
      dithering
    );

    if (!metadata) {
      return NextResponse.json(
        { success: false, error: 'Failed to re-process image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('Error re-processing image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to re-process image' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/images/[categoryId]/[imageId]/reprocess
 * Check if an image can be re-processed (has source)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId, imageId } = await params;
    const hasSource = await hasSourceImage(categoryId, imageId);

    return NextResponse.json({
      success: true,
      data: {
        canReprocess: hasSource,
        message: hasSource 
          ? 'Original source available for re-processing'
          : 'Original source not available. Delete and re-upload to enable re-processing.',
      },
    });
  } catch (error) {
    console.error('Error checking reprocess capability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check re-process capability' },
      { status: 500 }
    );
  }
}
