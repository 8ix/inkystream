import { NextResponse } from 'next/server';
import { getCategoriesWithCounts } from '@/lib/utils/categories';

/**
 * GET /api/categories - Lists all available categories
 * Returns categories with their image counts
 */
export async function GET() {
  try {
    const categories = await getCategoriesWithCounts();

    return NextResponse.json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Failed to get categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load categories',
      },
      { status: 500 }
    );
  }
}

