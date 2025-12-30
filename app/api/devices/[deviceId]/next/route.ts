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

// State file for shuffled image queues per device
const SHUFFLE_STATE_FILE = path.join(STATE_DIR, '.device-shuffle-state.json');

interface ShuffleState {
  [deviceKey: string]: {
    queue: string[];  // Array of image IDs in shuffled order
    position: number; // Current position in the queue
    imageCount: number; // Total images when queue was created (to detect changes)
  };
}

/**
 * Fisher-Yates shuffle algorithm for truly random ordering
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function getShuffleState(): Promise<ShuffleState> {
  try {
    const content = await fs.readFile(SHUFFLE_STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveShuffleState(state: ShuffleState): Promise<void> {
  await fs.writeFile(SHUFFLE_STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * GET /api/devices/[deviceId]/next - Returns the next image in a shuffled sequence
 * 
 * Uses Fisher-Yates shuffle to ensure all images are shown before any repeats.
 * State is persisted to survive server restarts.
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

    // Get current image IDs for comparison
    const currentImageIds = validImages.map(img => img.id);
    
    // Load shuffle state
    const state = await getShuffleState();
    const stateKey = categoryId ? `${deviceId}:${categoryId}` : deviceId;
    let deviceState = state[stateKey];

    // Check if we need to create or refresh the shuffle queue
    const needsReshuffle = !deviceState || 
      deviceState.position >= deviceState.queue.length ||
      deviceState.imageCount !== currentImageIds.length ||
      // Check if images have changed (new images added or removed)
      !deviceState.queue.every(id => currentImageIds.includes(id));

    if (needsReshuffle) {
      // Create a new shuffled queue
      const shuffledIds = shuffleArray(currentImageIds);
      deviceState = {
        queue: shuffledIds,
        position: 0,
        imageCount: currentImageIds.length,
      };
      console.log(`[InkyStream] Reshuffled queue for ${stateKey}: ${shuffledIds.length} images`);
    }

    // Get the next image ID from the shuffled queue
    const nextImageId = deviceState.queue[deviceState.position];
    const nextImage = validImages.find(img => img.id === nextImageId);

    if (!nextImage) {
      // This shouldn't happen, but handle gracefully by reshuffling
      const shuffledIds = shuffleArray(currentImageIds);
      deviceState = {
        queue: shuffledIds,
        position: 0,
        imageCount: currentImageIds.length,
      };
      const fallbackImage = validImages.find(img => img.id === shuffledIds[0])!;
      
      state[stateKey] = { ...deviceState, position: 1 };
      await saveShuffleState(state);
      await touchDeviceLastSeen(deviceId);

      return NextResponse.json({
        success: true,
        data: {
          imageUrl: getImageUrlForDevice(fallbackImage.categoryId, fallbackImage.id, deviceId, request),
          imageId: fallbackImage.id,
          categoryId: fallbackImage.categoryId,
          deviceId,
          deviceName: device.name,
          position: 1,
          totalImages: validImages.length,
        },
      });
    }

    // Increment position for next call
    state[stateKey] = {
      ...deviceState,
      position: deviceState.position + 1,
    };
    await saveShuffleState(state);

    // Record last seen
    await touchDeviceLastSeen(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: getImageUrlForDevice(nextImage.categoryId, nextImage.id, deviceId, request),
        imageId: nextImage.id,
        categoryId: nextImage.categoryId,
        deviceId,
        deviceName: device.name,
        position: deviceState.position + 1,
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
