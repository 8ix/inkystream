import { NextRequest, NextResponse } from 'next/server';
import { processUploadedImage } from '@/lib/utils/image';
import { categoryExists } from '@/lib/utils/categories';
import { getDevice } from '@/lib/utils/devices';
import { DEFAULT_ENHANCEMENT_OPTIONS, type DitheringAlgorithm, type EnhancementOptions } from '@/lib/processors/dither';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * POST /api/process - Process uploaded images
 * Accepts multipart form data with files and processing options
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const categoryId = formData.get('categoryId') as string;
    const deviceIdsJson = formData.get('deviceIds') as string;
    const dithering = (formData.get('dithering') as DitheringAlgorithm) || 'floyd-steinberg';
    const enhancementJson = formData.get('enhancement') as string;
    
    // Parse enhancement options or use defaults
    let enhancement: EnhancementOptions = DEFAULT_ENHANCEMENT_OPTIONS;
    if (enhancementJson) {
      try {
        enhancement = JSON.parse(enhancementJson);
      } catch {
        // Use defaults if parsing fails
      }
    }

    // Validate inputs
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    // Check category exists
    const catExists = await categoryExists(categoryId);
    if (!catExists) {
      return NextResponse.json(
        { success: false, error: `Category '${categoryId}' not found` },
        { status: 400 }
      );
    }

    let deviceIds: string[];
    try {
      deviceIds = JSON.parse(deviceIdsJson);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid device IDs format' },
        { status: 400 }
      );
    }

    if (!deviceIds || deviceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one device is required' },
        { status: 400 }
      );
    }

    // Validate all device IDs
    for (const deviceId of deviceIds) {
      const device = await getDevice(deviceId);
      if (!device) {
        return NextResponse.json(
          { success: false, error: `Device '${deviceId}' not found` },
          { status: 400 }
        );
      }
    }

    // Process each file
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
      images: [] as any[],
    };

    for (const file of files) {
      try {
        // Validate file type
        if (!ACCEPTED_TYPES.includes(file.type)) {
          results.failed++;
          results.errors.push(`${file.name}: Unsupported file type`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          results.failed++;
          results.errors.push(`${file.name}: File too large (max 20MB)`);
          continue;
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process the image for all selected devices
        const metadata = await processUploadedImage(
          buffer,
          file.name,
          categoryId,
          deviceIds,
          dithering,
          enhancement
        );

        results.processed++;
        results.images.push(metadata);
      } catch (error) {
        results.failed++;
        results.errors.push(`${file.name}: Processing failed`);
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
