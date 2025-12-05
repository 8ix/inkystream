import { NextRequest, NextResponse } from 'next/server';
import { readImageFile, imageFileExists } from '@/lib/utils/image';
import { requireApiKey } from '@/lib/utils/auth';

interface RouteParams {
  params: Promise<{
    path: string[];
  }>;
}

/**
 * GET /api/img/[...path] - Serve images from private storage with authentication
 * 
 * Authentication: Requires API key via ?key= parameter or Authorization header
 * (Only enforced when INKYSTREAM_API_KEY environment variable is set)
 * 
 * Path format: /api/img/{categoryId}/{imageId}/{filename}
 * Example: /api/img/landscapes/abc123/living-room-frame.png?key=YOUR_KEY
 * 
 * This endpoint replaces direct access to public/images/ providing:
 * - Authentication before serving images
 * - Private storage (images not in public directory)
 * - Access control
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Check API key authentication
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const pathSegments = (await params).path;
    
    // We expect at least 3 segments: categoryId, imageId, filename
    if (pathSegments.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid image path' },
        { status: 400 }
      );
    }

    const categoryId = pathSegments[0];
    const imageId = pathSegments[1];
    const filename = pathSegments.slice(2).join('/'); // Handle any nested paths

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Check if file exists
    const exists = await imageFileExists(categoryId, imageId, filename);
    if (!exists) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Read the image file
    const imageBuffer = await readImageFile(categoryId, imageId, filename);
    if (!imageBuffer) {
      return NextResponse.json(
        { success: false, error: 'Failed to read image' },
        { status: 500 }
      );
    }

    // Determine content type from filename
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
    }

    // Return the image with appropriate headers
    // Convert Node.js Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        // Cache for 1 hour on CDN, revalidate after
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}

