import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesWithCounts, createCategory } from '@/lib/utils/categories';
import { requireApiKey } from '@/lib/utils/auth';

/**
 * GET /api/categories - Lists all available categories
 * 
 * Authentication: Requires API key via ?key= parameter or Authorization header
 * (Only enforced when INKYSTREAM_API_KEY environment variable is set)
 * 
 * Returns categories with their image counts
 */
export async function GET(request: NextRequest) {
  // Check API key authentication
  const authError = requireApiKey(request);
  if (authError) return authError;

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

/**
 * POST /api/categories - Create a new category
 * 
 * Note: No API key required - admin function only accessible locally
 * 
 * Body: { name: string, description: string, colour: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { name, description, colour } = await request.json();

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (!colour || typeof colour !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Category colour is required' },
        { status: 400 }
      );
    }

    // Validate colour format (should be hex)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(colour)) {
      return NextResponse.json(
        { success: false, error: 'Invalid colour format. Use hex format (e.g., #FF5733)' },
        { status: 400 }
      );
    }

    const newCategory = await createCategory(
      name.trim(),
      (description || '').trim(),
      colour
    );

    return NextResponse.json(
      { success: true, data: { category: newCategory } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);

    // Check if it's a duplicate error
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
