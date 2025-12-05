import { NextResponse } from 'next/server';
import { getDisplayProfiles } from '@/lib/displays/profiles';

/**
 * GET /api/displays - Lists all supported display types
 * Returns available e-ink display profiles
 */
export async function GET() {
  try {
    const displays = await getDisplayProfiles();

    return NextResponse.json({
      success: true,
      data: {
        displays,
      },
    });
  } catch (error) {
    console.error('Failed to get displays:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load display profiles',
      },
      { status: 500 }
    );
  }
}

