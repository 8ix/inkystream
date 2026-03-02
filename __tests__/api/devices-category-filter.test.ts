/**
 * @jest-environment node
 */

/**
 * Tests for /api/devices/[deviceId] category filter behaviour
 */

// Mock auth so tests run without a real NextRequest
jest.mock('@/lib/utils/auth', () => ({
  requireApiKey: jest.fn(() => null),
  extractApiKey: jest.fn(() => null),
}));

import { GET as getRandom } from '@/app/api/devices/[deviceId]/random/route';
import { GET as getNext } from '@/app/api/devices/[deviceId]/next/route';
import { PATCH } from '@/app/api/devices/[deviceId]/route';

// Mock device and image utilities
jest.mock('@/lib/utils/devices', () => ({
  getDevice: jest.fn(),
  updateDevice: jest.fn(),
  touchDeviceLastSeen: jest.fn(),
}));

jest.mock('@/lib/utils/categories', () => ({
  categoryExists: jest.fn(),
}));

jest.mock('@/lib/utils/image', () => ({
  getAllImages: jest.fn(),
  getCategoryImages: jest.fn(),
  getImageUrlForDevice: jest.fn(() => 'https://example.com/image.jpg'),
}));

import { NextRequest } from 'next/server';
import { getDevice, updateDevice } from '@/lib/utils/devices';
import { categoryExists } from '@/lib/utils/categories';
import { getAllImages, getCategoryImages } from '@/lib/utils/image';

describe('/api/devices category filter', () => {
  const mockDevice = {
    id: 'demo-device',
    name: 'Demo Device',
    displayId: 'inky_frame_7_spectra6',
    createdAt: '2026-01-01T00:00:00.000Z',
    // categoryFilter may be added per-test
  } as any;

  const mockImagesCategoryA = [
    {
      id: 'img-a1',
      categoryId: 'category-a',
      variants: [{ deviceId: 'demo-device' }],
    },
  ];

  const mockImagesCategoryB = [
    {
      id: 'img-b1',
      categoryId: 'category-b',
      variants: [{ deviceId: 'demo-device' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeRequest = (url: string, method: string = 'GET', body?: any) => {
    if (method === 'PATCH' && body !== undefined) {
      return new NextRequest(url, {
        method,
        body: JSON.stringify(body),
      } as any);
    }
    return new NextRequest(url, { method } as any);
  };

  // ---------------------------------------------------------------------------
  describe('PATCH /api/devices/[deviceId]', () => {
    it('accepts a valid categoryFilter and persists it', async () => {
      (getDevice as jest.Mock).mockResolvedValue(mockDevice);
      (categoryExists as jest.Mock).mockResolvedValue(true);
      (updateDevice as jest.Mock).mockResolvedValue({
        ...mockDevice,
        categoryFilter: 'demo-category',
      });

      const request = makeRequest(
        'https://example.com/api/devices/demo-device',
        'PATCH',
        { categoryFilter: 'demo-category' }
      );

      const response = await PATCH(request as any, {
        params: Promise.resolve({ deviceId: 'demo-device' }),
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateDevice).toHaveBeenCalledWith(
        'demo-device',
        expect.objectContaining({ categoryFilter: 'demo-category' })
      );
    });

    it('clears the categoryFilter when null is provided', async () => {
      (getDevice as jest.Mock).mockResolvedValue({
        ...mockDevice,
        categoryFilter: 'old-category',
      });
      (updateDevice as jest.Mock).mockResolvedValue({
        ...mockDevice,
        categoryFilter: undefined,
      });

      const request = makeRequest(
        'https://example.com/api/devices/demo-device',
        'PATCH',
        { categoryFilter: null }
      );

      const response = await PATCH(request as any, {
        params: Promise.resolve({ deviceId: 'demo-device' }),
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateDevice).toHaveBeenCalledWith(
        'demo-device',
        expect.objectContaining({ categoryFilter: undefined })
      );
    });

    it('returns 400 when categoryFilter refers to unknown category', async () => {
      (getDevice as jest.Mock).mockResolvedValue(mockDevice);
      (categoryExists as jest.Mock).mockResolvedValue(false);

      const request = makeRequest(
        'https://example.com/api/devices/demo-device',
        'PATCH',
        { categoryFilter: 'missing-category' }
      );

      const response = await PATCH(request as any, {
        params: Promise.resolve({ deviceId: 'demo-device' }),
      } as any);

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/Category 'missing-category' not found/);
      expect(updateDevice).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('GET /api/devices/[deviceId]/random', () => {
    it('uses the device categoryFilter when no query category is provided', async () => {
      (getDevice as jest.Mock).mockResolvedValue({
        ...mockDevice,
        categoryFilter: 'category-a',
      });
      (categoryExists as jest.Mock).mockResolvedValue(true);
      (getCategoryImages as jest.Mock).mockResolvedValue(mockImagesCategoryA);

      const request = makeRequest(
        'https://example.com/api/devices/demo-device/random'
      );

      const response = await getRandom(request as any, {
        params: Promise.resolve({ deviceId: 'demo-device' }),
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(getCategoryImages).toHaveBeenCalledWith('category-a');
      expect(getAllImages).not.toHaveBeenCalled();
    });

    it('prefers query category over device categoryFilter', async () => {
      (getDevice as jest.Mock).mockResolvedValue({
        ...mockDevice,
        categoryFilter: 'category-a',
      });
      (categoryExists as jest.Mock).mockResolvedValue(true);
      (getCategoryImages as jest.Mock).mockResolvedValue(mockImagesCategoryB);

      const request = makeRequest(
        'https://example.com/api/devices/demo-device/random?category=category-b'
      );

      const response = await getRandom(request as any, {
        params: Promise.resolve({ deviceId: 'demo-device' }),
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(getCategoryImages).toHaveBeenCalledWith('category-b');
    });
  });

  // ---------------------------------------------------------------------------
  describe('GET /api/devices/[deviceId]/next', () => {
    it('uses the device categoryFilter when set', async () => {
      (getDevice as jest.Mock).mockResolvedValue({
        ...mockDevice,
        categoryFilter: 'category-a',
      });
      (categoryExists as jest.Mock).mockResolvedValue(true);
      (getCategoryImages as jest.Mock).mockResolvedValue(mockImagesCategoryA);

      const request = makeRequest(
        'https://example.com/api/devices/demo-device/next'
      );

      const response = await getNext(request as any, {
        params: Promise.resolve({ deviceId: 'demo-device' }),
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(getCategoryImages).toHaveBeenCalledWith('category-a');
      expect(getAllImages).not.toHaveBeenCalled();
    });
  });
});

