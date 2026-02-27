/**
 * Device management utilities
 * Loads and manages user-created devices from config/devices.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Device, DevicesConfig, DevicePlatform } from '@/lib/types/device';
import { getDisplayProfile } from '@/lib/displays/profiles';
import { CONFIG_DIR } from '@/lib/utils/paths';

const CONFIG_PATH = path.join(CONFIG_DIR, 'devices.json');

/**
 * Load all devices from the configuration file
 */
export async function getDevices(): Promise<Device[]> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config: DevicesConfig = JSON.parse(content);
    return config.devices;
  } catch (error) {
    console.error('Failed to load devices:', error);
    return [];
  }
}

/**
 * Save devices to the configuration file
 */
async function saveDevices(devices: Device[]): Promise<void> {
  const config: DevicesConfig = { devices };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Get a single device by its ID
 */
export async function getDevice(id: string): Promise<Device | null> {
  const devices = await getDevices();
  return devices.find((device) => device.id === id) || null;
}

/**
 * Check if a device exists
 */
export async function deviceExists(id: string): Promise<boolean> {
  const device = await getDevice(id);
  return device !== null;
}

/**
 * Generate a slug from a device name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create a new device
 */
export async function createDevice(
  name: string,
  displayId: string,
  platform?: Device['platform'],
  codeTemplate?: string,
  refreshIntervalSeconds?: number
): Promise<Device> {
  const devices = await getDevices();
  
  // Generate a unique ID from the name
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;
  
  while (devices.some((d) => d.id === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  const newDevice: Device = {
    id: slug,
    name,
    displayId,
    platform,
    codeTemplate,
    refreshIntervalSeconds,
    createdAt: new Date().toISOString(),
  };
  
  devices.push(newDevice);
  await saveDevices(devices);
  
  return newDevice;
}

/**
 * Update an existing device
 */
export async function updateDevice(
  id: string,
  updates: Partial<Pick<Device, 'name' | 'displayId' | 'platform' | 'codeTemplate' | 'refreshIntervalSeconds' | 'lastSeenAt'>>
): Promise<Device | null> {
  const devices = await getDevices();
  const index = devices.findIndex((d) => d.id === id);
  
  if (index === -1) {
    return null;
  }
  
  devices[index] = {
    ...devices[index],
    ...updates,
  };
  
  await saveDevices(devices);
  return devices[index];
}

/**
 * Update last seen timestamp for a device
 */
export async function touchDeviceLastSeen(id: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDevice(id, { lastSeenAt: now });
}

/**
 * Delete a device
 */
export async function deleteDevice(id: string): Promise<boolean> {
  const devices = await getDevices();
  const index = devices.findIndex((d) => d.id === id);
  
  if (index === -1) {
    return false;
  }
  
  devices.splice(index, 1);
  await saveDevices(devices);
  return true;
}

/**
 * Get a device with its display profile resolved
 */
export async function getDeviceWithDisplay(id: string): Promise<{
  device: Device;
  display: Awaited<ReturnType<typeof getDisplayProfile>>;
} | null> {
  const device = await getDevice(id);
  if (!device) return null;
  
  const display = await getDisplayProfile(device.displayId);
  return { device, display };
}

/**
 * Get all devices with their display profiles resolved
 */
export async function getDevicesWithDisplays(): Promise<
  Array<{
    device: Device;
    display: Awaited<ReturnType<typeof getDisplayProfile>>;
  }>
> {
  const devices = await getDevices();
  const results = await Promise.all(
    devices.map(async (device) => ({
      device,
      display: await getDisplayProfile(device.displayId),
    }))
  );
  return results;
}

