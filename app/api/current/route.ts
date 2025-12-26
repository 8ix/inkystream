import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAllImages, getCategoryImages } from '@/lib/utils/image';
import { displayExists } from '@/lib/displays/profiles';
import { categoryExists } from '@/lib/utils/categories';
import { requireApiKey, extractApiKey } from '@/lib/utils/auth';

const STATE_FILE = path.join(process.cwd(), '.current-state.json');

interface CurrentState {
  [key: string]: number; // categoryId-displayId -> currentIndex
}

async function getState(): Promise<CurrentState> {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * GET /api/current - Returns current image for display/category
 * 
 * NOTE: This is a legacy endpoint. For new implementations, use
 * /api/devices/{deviceId}/current instead.
 * 
 * Authentication: Requires API key via ?key= parameter or Authorization header
 * 
 * Query params:
 *   - key (required if INKYSTREAM_API_KEY is set): API key for authentication
 *   - display (required): Display profile ID
 *   - category (optional): Category ID to filter by
 */
export async function GET(request: NextRequest) {
  // Check API key authentication
  const authError = requireApiKey(request);
  if (authError) return authError;

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

    // Get current state
    const state = await getState();
    const stateKey = `${categoryId || 'all'}-${displayId}`;
    const currentIndex = state[stateKey] || 0;

    // Ensure index is valid
    const safeIndex = currentIndex % validImages.length;
    const currentImage = validImages[safeIndex];
    
    // Find the variant that matches this display
    const variant = currentImage.variants.find((v) => v.displayId === displayId);
    const filename = variant?.filename || `${displayId}.jpg`;

    // Build image URL with API key if present
    const apiKey = extractApiKey(request);
    let imageUrl = `/api/img/${currentImage.categoryId}/${currentImage.id}/${filename}`;
    if (apiKey) {
      imageUrl += `?key=${encodeURIComponent(apiKey)}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        imageId: currentImage.id,
        categoryId: currentImage.categoryId,
        displayId,
        position: safeIndex + 1,
        total: validImages.length,
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
