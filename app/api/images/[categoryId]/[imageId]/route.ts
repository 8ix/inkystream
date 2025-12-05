import { NextRequest, NextResponse } from 'next/server';
import { deleteImage, getImage } from '@/lib/utils/image';
import { categoryExists } from '@/lib/utils/categories';

interface RouteParams {
  params: Promise<{
    categoryId: string;
    imageId: string;
  }>;
}

/**
 * GET /api/images/[categoryId]/[imageId] - Get image details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId, imageId } = await params;

    const image = await getImage(categoryId, imageId);

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('Error getting image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images/[categoryId]/[imageId] - Delete an image
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId, imageId } = await params;

    // Check category exists
    const catExists = await categoryExists(categoryId);
    if (!catExists) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check image exists
    const image = await getImage(categoryId, imageId);
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete the image
    const deleted = await deleteImage(categoryId, imageId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true, imageId, categoryId },
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

