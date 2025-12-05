import { NextRequest, NextResponse } from 'next/server';
import { getDevice, updateDevice, deleteDevice } from '@/lib/utils/devices';
import { displayExists } from '@/lib/displays/profiles';

interface RouteParams {
  params: Promise<{
    deviceId: string;
  }>;
}

/**
 * GET /api/devices/[deviceId] - Get a single device
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;
    const device = await getDevice(deviceId);

    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error('Error getting device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get device' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/devices/[deviceId] - Update a device
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;
    const body = await request.json();
    const { name, displayId } = body;

    // Check device exists
    const existingDevice = await getDevice(deviceId);
    if (!existingDevice) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    // Build updates object
    const updates: { name?: string; displayId?: string } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Device name cannot be empty' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (displayId !== undefined) {
      if (typeof displayId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid display type' },
          { status: 400 }
        );
      }
      const dispExists = await displayExists(displayId);
      if (!dispExists) {
        return NextResponse.json(
          { success: false, error: `Display type '${displayId}' not found` },
          { status: 400 }
        );
      }
      updates.displayId = displayId;
    }

    // Update the device
    const updatedDevice = await updateDevice(deviceId, updates);

    return NextResponse.json({
      success: true,
      data: updatedDevice,
    });
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update device' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/devices/[deviceId] - Delete a device
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;

    const deleted = await deleteDevice(deviceId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true, deviceId },
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete device' },
      { status: 500 }
    );
  }
}

