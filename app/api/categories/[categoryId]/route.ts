import { NextRequest, NextResponse } from 'next/server';
import { 
  getCategory, 
  updateCategory, 
  deleteCategory, 
  getCategoryImageCount 
} from '@/lib/utils/categories';

interface RouteParams {
  params: Promise<{
    categoryId: string;
  }>;
}

/**
 * GET /api/categories/[categoryId] - Get a single category
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId } = await params;
    const category = await getCategory(categoryId);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const imageCount = await getCategoryImageCount(categoryId);

    return NextResponse.json({
      success: true,
      data: { category: { ...category, imageCount } },
    });
  } catch (error) {
    console.error('Error getting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get category' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/categories/[categoryId] - Update a category
 * Body: { name: string, description: string, colour: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId } = await params;
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

    // Validate colour format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(colour)) {
      return NextResponse.json(
        { success: false, error: 'Invalid colour format. Use hex format (e.g., #FF5733)' },
        { status: 400 }
      );
    }

    const updatedCategory = await updateCategory(
      categoryId,
      name.trim(),
      (description || '').trim(),
      colour
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { category: updatedCategory },
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[categoryId] - Delete a category
 * Will fail if the category contains images
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId } = await params;
    
    const deleted = await deleteCategory(categoryId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true, categoryId },
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);

    // Check if it's a "has images" error
    if (error.message?.includes('contains')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}





