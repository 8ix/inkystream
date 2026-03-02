/**
 * Tests for device management utilities
 */

import {
  getDevices,
  getDevice,
  deviceExists,
  createDevice,
  updateDevice,
  deleteDevice,
  touchDeviceLastSeen,
  getDeviceWithDisplay,
  getDevicesWithDisplays,
} from '@/lib/utils/devices';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Mock display profiles (used by getDeviceWithDisplay / getDevicesWithDisplays)
jest.mock('@/lib/displays/profiles', () => ({
  getDisplayProfile: jest.fn(),
}));

import { promises as fs } from 'fs';
import { getDisplayProfile } from '@/lib/displays/profiles';

const mockDevice1 = {
  id: 'living-room',
  name: 'Living Room',
  displayId: 'inky_frame_7_spectra6',
  platform: 'micropython-inky-frame' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockDevice2 = {
  id: 'bedroom',
  name: 'Bedroom',
  displayId: 'inky_frame_7_spectra6',
  platform: 'python-raspberry-pi' as const,
  createdAt: '2026-01-02T00:00:00.000Z',
};

const mockDevicesConfig = { devices: [mockDevice1, mockDevice2] };

const mockDisplay = {
  id: 'inky_frame_7_spectra6',
  name: 'Inky Frame 7.3"',
  width: 800,
  height: 480,
  palette: ['#000000', '#FFFFFF'],
  manufacturer: 'Pimoroni',
  defaultDithering: 'floyd-steinberg',
};

describe('Device Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockDevicesConfig));
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (getDisplayProfile as jest.Mock).mockResolvedValue(mockDisplay);
  });

  // ---------------------------------------------------------------------------
  describe('getDevices', () => {
    it('returns all devices from config', async () => {
      const devices = await getDevices();
      expect(devices).toHaveLength(2);
      expect(devices[0].id).toBe('living-room');
      expect(devices[1].id).toBe('bedroom');
    });

    it('returns an empty array when config file is missing', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      const devices = await getDevices();
      expect(devices).toEqual([]);
    });

    it('returns an empty array for malformed JSON', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('not-valid-json{');
      const devices = await getDevices();
      expect(devices).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getDevice', () => {
    it('returns the device for a known ID', async () => {
      const device = await getDevice('living-room');
      expect(device).not.toBeNull();
      expect(device?.name).toBe('Living Room');
    });

    it('returns null for an unknown ID', async () => {
      const device = await getDevice('nonexistent');
      expect(device).toBeNull();
    });

    it('is case-sensitive', async () => {
      const device = await getDevice('Living-Room');
      expect(device).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  describe('deviceExists', () => {
    it('returns true for an existing device', async () => {
      expect(await deviceExists('bedroom')).toBe(true);
    });

    it('returns false for a non-existent device', async () => {
      expect(await deviceExists('office')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  describe('createDevice', () => {
    it('creates a device and persists the config', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ devices: [] }));

      const device = await createDevice('Office', 'inky_frame_7_spectra6', 'micropython-inky-frame');

      expect(device.id).toBe('office');
      expect(device.name).toBe('Office');
      expect(device.displayId).toBe('inky_frame_7_spectra6');
      expect(device.platform).toBe('micropython-inky-frame');
      expect(device.createdAt).toBeDefined();
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('generates a slug from the device name', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ devices: [] }));

      const device = await createDevice('My Living Room Frame', 'inky_frame_7_spectra6');
      expect(device.id).toBe('my-living-room-frame');
    });

    it('handles slug collisions by appending a counter', async () => {
      const existingDevices = { devices: [{ id: 'office', name: 'Office' }] };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingDevices));

      const device = await createDevice('Office', 'inky_frame_7_spectra6');
      expect(device.id).toBe('office-1');
    });

    it('increments counter until a unique slug is found', async () => {
      const existingDevices = {
        devices: [
          { id: 'office', name: 'Office' },
          { id: 'office-1', name: 'Office 1' },
        ],
      };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingDevices));

      const device = await createDevice('Office', 'inky_frame_7_spectra6');
      expect(device.id).toBe('office-2');
    });

    it('strips leading/trailing hyphens from slug', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ devices: [] }));

      const device = await createDevice('  Frame  ', 'inky_frame_7_spectra6');
      expect(device.id).toBe('frame');
    });

    it('stores optional codeTemplate and refreshIntervalSeconds', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ devices: [] }));

      const device = await createDevice(
        'Office',
        'inky_frame_7_spectra6',
        undefined,
        'my template',
        300
      );
      expect(device.codeTemplate).toBe('my template');
      expect(device.refreshIntervalSeconds).toBe(300);
    });
  });

  // ---------------------------------------------------------------------------
  describe('updateDevice', () => {
    it('updates the specified fields and persists', async () => {
      const updated = await updateDevice('living-room', { name: 'Lounge' });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Lounge');
      expect(updated?.id).toBe('living-room');
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('preserves fields that are not updated', async () => {
      const updated = await updateDevice('living-room', { name: 'Lounge' });
      expect(updated?.displayId).toBe('inky_frame_7_spectra6');
      expect(updated?.platform).toBe('micropython-inky-frame');
    });

    it('returns null for a non-existent device ID', async () => {
      const result = await updateDevice('nonexistent', { name: 'Ghost' });
      expect(result).toBeNull();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('persists categoryFilter when provided', async () => {
      const updated = await updateDevice('living-room', { categoryFilter: 'demo-category' } as any);

      expect(updated).not.toBeNull();
      expect(updated?.categoryFilter).toBe('demo-category');
      expect(fs.writeFile).toHaveBeenCalledTimes(1);

      const writtenJson = (fs.writeFile as jest.Mock).mock.calls[0][1];
      const written = JSON.parse(writtenJson);
      const device = written.devices.find((d: any) => d.id === 'living-room');
      expect(device.categoryFilter).toBe('demo-category');
    });

    it('clears categoryFilter when set to undefined', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({
          devices: [
            { ...mockDevice1, categoryFilter: 'old-category' },
            mockDevice2,
          ],
        })
      );

      const updated = await updateDevice('living-room', { categoryFilter: undefined } as any);

      expect(updated).not.toBeNull();
      expect(updated?.categoryFilter).toBeUndefined();
      expect(fs.writeFile).toHaveBeenCalledTimes(1);

      const writtenJson = (fs.writeFile as jest.Mock).mock.calls[0][1];
      const written = JSON.parse(writtenJson);
      const device = written.devices.find((d: any) => d.id === 'living-room');
      expect(device.categoryFilter).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  describe('deleteDevice', () => {
    it('removes the device and persists the config', async () => {
      const result = await deleteDevice('living-room');

      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);

      // Verify the written config no longer contains the deleted device
      const writtenJson = (fs.writeFile as jest.Mock).mock.calls[0][1];
      const written = JSON.parse(writtenJson);
      expect(written.devices.find((d: any) => d.id === 'living-room')).toBeUndefined();
    });

    it('returns false for a non-existent device ID', async () => {
      const result = await deleteDevice('nonexistent');
      expect(result).toBe(false);
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('touchDeviceLastSeen', () => {
    it('updates the lastSeenAt timestamp', async () => {
      const before = new Date();

      await touchDeviceLastSeen('living-room');

      const writtenJson = (fs.writeFile as jest.Mock).mock.calls[0][1];
      const written = JSON.parse(writtenJson);
      const device = written.devices.find((d: any) => d.id === 'living-room');

      expect(device.lastSeenAt).toBeDefined();
      expect(new Date(device.lastSeenAt).getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  // ---------------------------------------------------------------------------
  describe('getDeviceWithDisplay', () => {
    it('returns device and its resolved display profile', async () => {
      const result = await getDeviceWithDisplay('living-room');

      expect(result).not.toBeNull();
      expect(result?.device.id).toBe('living-room');
      expect(result?.display).toEqual(mockDisplay);
      expect(getDisplayProfile).toHaveBeenCalledWith('inky_frame_7_spectra6');
    });

    it('returns null for a non-existent device', async () => {
      const result = await getDeviceWithDisplay('nonexistent');
      expect(result).toBeNull();
      expect(getDisplayProfile).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('getDevicesWithDisplays', () => {
    it('returns all devices with their display profiles', async () => {
      const results = await getDevicesWithDisplays();

      expect(results).toHaveLength(2);
      expect(results[0].device.id).toBe('living-room');
      expect(results[0].display).toEqual(mockDisplay);
      expect(results[1].device.id).toBe('bedroom');
      expect(getDisplayProfile).toHaveBeenCalledTimes(2);
    });

    it('returns an empty array when no devices are configured', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ devices: [] }));
      const results = await getDevicesWithDisplays();
      expect(results).toEqual([]);
    });
  });
});
