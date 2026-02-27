import { NextRequest, NextResponse } from 'next/server';
import { getDisplayProfiles } from '@/lib/displays/profiles';
import { requireApiKey } from '@/lib/utils/auth';

/**
 * GET /api/displays - Lists all supported display types
 * 
 * Authentication: Requires API key via ?key= parameter or Authorization header
 * 
 * Returns available e-ink display profiles
 */
export async function GET(request: NextRequest) {
  // Check API key authentication
  const authError = requireApiKey(request);
  if (authError) return authError;

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
