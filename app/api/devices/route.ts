import { NextRequest, NextResponse } from 'next/server';
import { getDevices, createDevice } from '@/lib/utils/devices';
import { displayExists } from '@/lib/displays/profiles';
import type { DevicePlatform } from '@/lib/types/device';

/**
 * GET /api/devices - Lists all configured devices
 * 
 * Note: No API key required - admin function only accessible locally
 */
export async function GET(request: NextRequest) {
  try {
    const devices = await getDevices();

    return NextResponse.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Failed to get devices:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load devices',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices - Create a new device
 * 
 * Note: No API key required - admin function only accessible locally
 * 
 * Body: { name: string, displayId: string, platform?: DevicePlatform, codeTemplate?: string, refreshIntervalSeconds?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayId, platform, codeTemplate, refreshIntervalSeconds } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Device name is required' },
        { status: 400 }
      );
    }

    if (!displayId || typeof displayId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Display ID is required' },
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

    // Validate platform if provided
    const validPlatforms = ['micropython-inky-frame', 'arduino-esp32', 'python-raspberry-pi', 'custom'];
    if (platform && !validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform' },
        { status: 400 }
      );
    }

    const newDevice = await createDevice(
      name.trim(),
      displayId,
      platform as DevicePlatform | undefined,
      codeTemplate,
      refreshIntervalSeconds
    );

    return NextResponse.json(
      { success: true, data: { device: newDevice } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating device:', error);

    // Check if it's a duplicate error
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create device' },
      { status: 500 }
    );
  }
}
