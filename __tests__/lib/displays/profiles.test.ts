/**
 * Tests for display profile utilities
 */

import {
  getDisplayProfiles,
  getDisplayProfile,
  displayExists,
  getDisplaysByManufacturer,
  getDefaultDithering,
  hexToRgb,
  getPaletteRgb,
} from '@/lib/displays/profiles';

// Mock the fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

import { promises as fs } from 'fs';

const mockDisplays = {
  displays: [
    {
      id: 'inky_frame_7_spectra',
      name: 'Inky Frame 7.3" (Spectra)',
      description: 'Pimoroni Inky Frame 7.3" with 7-colour Spectra display',
      width: 800,
      height: 480,
      palette: ['#000000', '#FFFFFF', '#00FF00', '#0000FF', '#FF0000', '#FFFF00', '#FFA500'],
      manufacturer: 'Pimoroni',
      defaultDithering: 'floyd-steinberg',
    },
    {
      id: 'inky_frame_7_colour',
      name: 'Inky Frame 7.3" (Colour)',
      description: 'Pimoroni Inky Frame 7.3" with colour display',
      width: 800,
      height: 480,
      palette: ['#000000', '#FFFFFF', '#FF0000', '#FFFF00'],
      manufacturer: 'Pimoroni',
      defaultDithering: 'floyd-steinberg',
    },
  ],
};

describe('Display Profile Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockDisplays));
  });

  describe('getDisplayProfiles', () => {
    it('should return an array of display profiles', async () => {
      const displays = await getDisplayProfiles();

      expect(Array.isArray(displays)).toBe(true);
      expect(displays.length).toBe(2);
    });

    it('should include required properties for each display', async () => {
      const displays = await getDisplayProfiles();

      displays.forEach((display) => {
        expect(display).toHaveProperty('id');
        expect(display).toHaveProperty('name');
        expect(display).toHaveProperty('width');
        expect(display).toHaveProperty('height');
        expect(display).toHaveProperty('palette');
        expect(display).toHaveProperty('manufacturer');
        expect(display).toHaveProperty('defaultDithering');
      });
    });

    it('should return correct display dimensions', async () => {
      const displays = await getDisplayProfiles();
      const spectra = displays.find((d) => d.id === 'inky_frame_7_spectra');

      expect(spectra?.width).toBe(800);
      expect(spectra?.height).toBe(480);
    });

    it('should return correct palette for spectra display', async () => {
      const displays = await getDisplayProfiles();
      const spectra = displays.find((d) => d.id === 'inky_frame_7_spectra');

      expect(spectra?.palette).toHaveLength(7);
      expect(spectra?.palette).toContain('#000000');
      expect(spectra?.palette).toContain('#FFFFFF');
    });

    it('should return empty array on error', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const displays = await getDisplayProfiles();

      expect(displays).toEqual([]);
    });
  });

  describe('getDisplayProfile', () => {
    it('should return a display profile by ID', async () => {
      const display = await getDisplayProfile('inky_frame_7_spectra');

      expect(display).not.toBeNull();
      expect(display?.id).toBe('inky_frame_7_spectra');
      expect(display?.name).toBe('Inky Frame 7.3" (Spectra)');
    });

    it('should return null for non-existent ID', async () => {
      const display = await getDisplayProfile('nonexistent');

      expect(display).toBeNull();
    });

    it('should be case-sensitive', async () => {
      const display = await getDisplayProfile('INKY_FRAME_7_SPECTRA');

      expect(display).toBeNull();
    });
  });

  describe('displayExists', () => {
    it('should return true for existing display', async () => {
      const exists = await displayExists('inky_frame_7_spectra');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent display', async () => {
      const exists = await displayExists('nonexistent');

      expect(exists).toBe(false);
    });
  });

  describe('getDisplaysByManufacturer', () => {
    it('should group displays by manufacturer', async () => {
      const grouped = await getDisplaysByManufacturer();

      expect(grouped).toHaveProperty('Pimoroni');
      expect(grouped['Pimoroni']).toHaveLength(2);
    });
  });

  describe('getDefaultDithering', () => {
    it('should return default dithering for display', async () => {
      const dithering = await getDefaultDithering('inky_frame_7_spectra');

      expect(dithering).toBe('floyd-steinberg');
    });

    it('should return floyd-steinberg as fallback', async () => {
      const dithering = await getDefaultDithering('nonexistent');

      expect(dithering).toBe('floyd-steinberg');
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      const rgb = hexToRgb('#FF0000');

      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should handle lowercase hex', () => {
      const rgb = hexToRgb('#00ff00');

      expect(rgb).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should return black for invalid hex', () => {
      const rgb = hexToRgb('invalid');

      expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('getPaletteRgb', () => {
    it('should return palette as RGB values', async () => {
      const palette = await getPaletteRgb('inky_frame_7_spectra');

      expect(palette.length).toBe(7);
      expect(palette[0]).toEqual({ r: 0, g: 0, b: 0 }); // Black
      expect(palette[1]).toEqual({ r: 255, g: 255, b: 255 }); // White
    });

    it('should return empty array for non-existent display', async () => {
      const palette = await getPaletteRgb('nonexistent');

      expect(palette).toEqual([]);
    });
  });
});

