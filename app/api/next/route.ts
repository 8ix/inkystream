import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAllImages, getCategoryImages, getImageUrl } from '@/lib/utils/image';
import { displayExists } from '@/lib/displays/profiles';
import { categoryExists } from '@/lib/utils/categories';

const STATE_FILE = path.join(process.cwd(), '.current-state.json');

interface CurrentState {
  [key: string]: number;
}

async function getState(): Promise<CurrentState> {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveState(state: CurrentState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * GET /api/next - Rotates to next image and returns it
 * Query params:
 *   - display (required): Display profile ID
 *   - category (optional): Category ID to filter by
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const displayId = searchParams.get('display');
    const categoryId = searchParams.get('category');

    // Validate display parameter
    if (!displayId) {
      return NextResponse.json(
        { success: false, error: 'Display parameter is required' },
        { status: 400 }
      );
    }

    // Check display exists
    const dispExists = await displayExists(displayId);
    if (!dispExists) {
      return NextResponse.json(
        { success: false, error: `Display '${displayId}' not found` },
        { status: 400 }
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

    // Filter to images that have this display variant
    const validImages = images.filter((img) =>
      img.variants.some((v) => v.displayId === displayId)
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

    // Get current state and increment
    const state = await getState();
    const stateKey = `${categoryId || 'all'}-${displayId}`;
    const currentIndex = state[stateKey] || 0;
    const nextIndex = (currentIndex + 1) % validImages.length;

    // Save new state
    state[stateKey] = nextIndex;
    await saveState(state);

    const nextImage = validImages[nextIndex];

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: getImageUrl(nextImage.categoryId, nextImage.id, displayId),
        imageId: nextImage.id,
        categoryId: nextImage.categoryId,
        displayId,
        position: nextIndex + 1,
        total: validImages.length,
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

