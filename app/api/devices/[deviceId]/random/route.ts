import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAllImages, getCategoryImages, getImageUrlForDevice } from '@/lib/utils/image';
import { getDevice, touchDeviceLastSeen } from '@/lib/utils/devices';
import { categoryExists } from '@/lib/utils/categories';
import { requireApiKey } from '@/lib/utils/auth';
import { STATE_DIR } from '@/lib/utils/paths';

interface RouteParams {
  params: Promise<{
    deviceId: string;
  }>;
}

// State file for tracking recently shown images (to avoid repeats)
const RECENT_STATE_FILE = path.join(STATE_DIR, '.device-recent-state.json');

interface RecentState {
  [deviceKey: string]: {
    recentIds: string[];  // Last N image IDs shown
  };
}

async function getRecentState(): Promise<RecentState> {
  try {
    const content = await fs.readFile(RECENT_STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveRecentState(state: RecentState): Promise<void> {
  await fs.writeFile(RECENT_STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * GET /api/devices/[deviceId]/random - Returns a random image for a device
 * 
 * Avoids showing recently displayed images until all images have been shown.
 * 
 * Authentication: Requires API key via ?key= parameter or Authorization header
 * 
 * Query params:
 *   - key (required if INKYSTREAM_API_KEY is set): API key for authentication
 *   - category (optional): Category ID to filter by
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Check API key authentication
  const authError = requireApiKey(request);
  if (authError) return authError;

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

    // Load recent state
    const state = await getRecentState();
    const stateKey = categoryId ? `${deviceId}:${categoryId}` : deviceId;
    let deviceState = state[stateKey] || { recentIds: [] };

    // Filter out recently shown images (keep track of all but one to ensure variety)
    const maxRecent = Math.max(0, validImages.length - 1);
    const recentIds = deviceState.recentIds.slice(0, maxRecent);
    
    // Get images that haven't been shown recently
    let availableImages = validImages.filter(img => !recentIds.includes(img.id));
    
    // If all images have been shown (or only one image exists), reset and use all
    if (availableImages.length === 0) {
      availableImages = validImages;
      deviceState.recentIds = [];
    }

    // Select random image from available pool
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const randomImage = availableImages[randomIndex];

    // Add to recent list and save
    deviceState.recentIds = [randomImage.id, ...deviceState.recentIds].slice(0, maxRecent);
    state[stateKey] = deviceState;
    await saveRecentState(state);

    // Record last seen
    await touchDeviceLastSeen(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: getImageUrlForDevice(randomImage.categoryId, randomImage.id, deviceId, request),
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
