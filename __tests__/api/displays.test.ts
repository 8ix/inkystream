/**
 * @jest-environment node
 */

/**
 * Tests for /api/displays endpoint
 */

// Mock auth so tests run without a real NextRequest
jest.mock('@/lib/utils/auth', () => ({
  requireApiKey: jest.fn(() => null),
  extractApiKey: jest.fn(() => null),
}));

import { GET } from '@/app/api/displays/route';

// Mock the display utilities
jest.mock('@/lib/displays/profiles', () => ({
  getDisplayProfiles: jest.fn(),
}));

import { getDisplayProfiles } from '@/lib/displays/profiles';

describe('GET /api/displays', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return displays list', async () => {
    const mockDisplays = [
      {
        id: 'inky_frame_7_spectra',
        name: 'Inky Frame 7.3" (Spectra)',
        description: 'Pimoroni Inky Frame',
        width: 800,
        height: 480,
        palette: ['#000000', '#FFFFFF'],
        manufacturer: 'Pimoroni',
        defaultDithering: 'floyd-steinberg',
      },
    ];

    (getDisplayProfiles as jest.Mock).mockResolvedValue(mockDisplays);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.displays).toBeDefined();
    expect(data.data.displays.length).toBe(1);
  });

  it('should include display dimensions', async () => {
    const mockDisplays = [
      {
        id: 'inky_frame_7_spectra',
        name: 'Inky Frame',
        description: 'Test',
        width: 800,
        height: 480,
        palette: ['#000000', '#FFFFFF'],
        manufacturer: 'Pimoroni',
        defaultDithering: 'floyd-steinberg',
      },
    ];

    (getDisplayProfiles as jest.Mock).mockResolvedValue(mockDisplays);

    const response = await GET();
    const data = await response.json();

    expect(data.data.displays[0].width).toBe(800);
    expect(data.data.displays[0].height).toBe(480);
  });

  it('should include full palette', async () => {
    const mockDisplays = [
      {
        id: 'test',
        name: 'Test',
        description: 'Test',
        width: 800,
        height: 480,
        palette: ['#000000', '#FFFFFF', '#FF0000'],
        manufacturer: 'Test',
        defaultDithering: 'floyd-steinberg',
      },
    ];

    (getDisplayProfiles as jest.Mock).mockResolvedValue(mockDisplays);

    const response = await GET();
    const data = await response.json();

    expect(data.data.displays[0].palette).toHaveLength(3);
    expect(data.data.displays[0].palette).toContain('#000000');
  });

  it('should return empty array when no displays', async () => {
    (getDisplayProfiles as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.displays).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    (getDisplayProfiles as jest.Mock).mockRejectedValue(new Error('Config error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});

