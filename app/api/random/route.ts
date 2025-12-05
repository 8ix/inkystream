import { NextRequest, NextResponse } from 'next/server';
import { getAllImages, getCategoryImages } from '@/lib/utils/image';
import { displayExists } from '@/lib/displays/profiles';
import { categoryExists } from '@/lib/utils/categories';
import { requireApiKey, extractApiKey } from '@/lib/utils/auth';

/**
 * GET /api/random - Returns a random image for display/category
 * 
 * NOTE: This is a legacy endpoint. For new implementations, use
 * /api/devices/{deviceId}/random instead.
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

    // Select random image
    const randomIndex = Math.floor(Math.random() * validImages.length);
    const randomImage = validImages[randomIndex];
    
    // Find the variant that matches this display
    const variant = randomImage.variants.find((v) => v.displayId === displayId);
    const filename = variant?.filename || `${displayId}.png`;

    // Build image URL with API key if present
    const apiKey = extractApiKey(request);
    let imageUrl = `/api/img/${randomImage.categoryId}/${randomImage.id}/${filename}`;
    if (apiKey) {
      imageUrl += `?key=${encodeURIComponent(apiKey)}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        imageId: randomImage.id,
        categoryId: randomImage.categoryId,
        displayId,
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
