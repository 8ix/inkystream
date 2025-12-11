import { NextRequest, NextResponse } from 'next/server';
import { getDevices, createDevice } from '@/lib/utils/devices';
import { displayExists } from '@/lib/displays/profiles';
import type { DevicePlatform } from '@/lib/types/device';

/**
 * GET /api/devices - List all devices
 */
export async function GET() {
  try {
    const devices = await getDevices();
    return NextResponse.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Error getting devices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get devices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices - Create a new device
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayId, platform, codeTemplate, refreshIntervalSeconds } = body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Device name is required' },
        { status: 400 }
      );
    }

    if (!displayId || typeof displayId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Display type is required' },
        { status: 400 }
      );
    }

    // Validate platform if provided
    const validPlatforms: DevicePlatform[] = [
      'micropython-inky-frame',
      'arduino-esp32',
      'python-raspberry-pi',
      'custom',
    ];
    if (platform && !validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate codeTemplate only for custom platform
    if (platform === 'custom' && (!codeTemplate || typeof codeTemplate !== 'string' || codeTemplate.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Code template is required when platform is "custom"' },
        { status: 400 }
      );
    }

    // Validate refreshIntervalSeconds if provided
    if (refreshIntervalSeconds !== undefined) {
      const value = Number(refreshIntervalSeconds);
      if (!Number.isFinite(value) || value <= 0) {
        return NextResponse.json(
          { success: false, error: 'refreshIntervalSeconds must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Check display exists
    const dispExists = await displayExists(displayId);
    if (!dispExists) {
      return NextResponse.json(
        { success: false, error: `Display type '${displayId}' not found` },
        { status: 400 }
      );
    }

    // Create the device
    const device = await createDevice(
      name.trim(),
      displayId,
      platform,
      codeTemplate,
      refreshIntervalSeconds !== undefined ? Number(refreshIntervalSeconds) : undefined
    );

    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create device' },
      { status: 500 }
    );
  }
}

