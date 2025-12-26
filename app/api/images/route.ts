import { NextRequest, NextResponse } from 'next/server';
import { getAllImages } from '@/lib/utils/image';

// Force dynamic - this route reads from filesystem and must not be cached
export const dynamic = 'force-dynamic';

/**
 * GET /api/images - Get all processed images across all categories
 * 
 * Note: No API key required - admin function only accessible locally
 */
export async function GET(request: NextRequest) {
  try {
    const images = await getAllImages();

    return NextResponse.json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error('Failed to get images:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load images',
      },
      { status: 500 }
    );
  }
}
