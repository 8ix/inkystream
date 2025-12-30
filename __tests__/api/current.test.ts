/**
 * Tests for /api/current endpoint
 */

import { GET } from '@/app/api/current/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/utils/image', () => ({
  getAllImages: jest.fn(),
  getCategoryImages: jest.fn(),
  getImageUrl: jest.fn((cat, id, display) => `/images/${cat}/${id}/${display}.png`),
}));

jest.mock('@/lib/displays/profiles', () => ({
  displayExists: jest.fn(),
}));

jest.mock('@/lib/utils/categories', () => ({
  categoryExists: jest.fn(),
}));

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

import { getAllImages, getCategoryImages } from '@/lib/utils/image';
import { displayExists } from '@/lib/displays/profiles';
import { categoryExists } from '@/lib/utils/categories';

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost'));
}

describe('GET /api/current', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (displayExists as jest.Mock).mockResolvedValue(true);
    (categoryExists as jest.Mock).mockResolvedValue(true);
  });

  it('should return 400 when display parameter is missing', async () => {
    const request = createRequest('http://localhost/api/current');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Display parameter');
  });

  it('should return 400 for invalid display', async () => {
    (displayExists as jest.Mock).mockResolvedValue(false);

    const request = createRequest(
      'http://localhost/api/current?display=invalid_display'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });

  it('should return 404 when no images exist', async () => {
    (getAllImages as jest.Mock).mockResolvedValue([]);

    const request = createRequest(
      'http://localhost/api/current?display=inky_frame_7_spectra'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('should return current image', async () => {
    const mockImages = [
      {
        id: 'img1',
        categoryId: 'landscapes',
        variants: [{ displayId: 'inky_frame_7_spectra' }],
      },
    ];

    (getAllImages as jest.Mock).mockResolvedValue(mockImages);

    const request = createRequest(
      'http://localhost/api/current?display=inky_frame_7_spectra'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.imageUrl).toBeDefined();
    expect(data.data.imageId).toBe('img1');
  });

  it('should filter by category when provided', async () => {
    const mockImages = [
      {
        id: 'img1',
        categoryId: 'landscapes',
        variants: [{ displayId: 'inky_frame_7_spectra' }],
      },
    ];

    (getCategoryImages as jest.Mock).mockResolvedValue(mockImages);

    const request = createRequest(
      'http://localhost/api/current?display=inky_frame_7_spectra&category=landscapes'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(getCategoryImages).toHaveBeenCalledWith('landscapes');
    expect(data.success).toBe(true);
  });

  it('should return 400 for invalid category', async () => {
    (categoryExists as jest.Mock).mockResolvedValue(false);

    const request = createRequest(
      'http://localhost/api/current?display=inky_frame_7_spectra&category=invalid'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should include position and total in response', async () => {
    const mockImages = [
      {
        id: 'img1',
        categoryId: 'landscapes',
        variants: [{ displayId: 'inky_frame_7_spectra' }],
      },
      {
        id: 'img2',
        categoryId: 'landscapes',
        variants: [{ displayId: 'inky_frame_7_spectra' }],
      },
    ];

    (getAllImages as jest.Mock).mockResolvedValue(mockImages);

    const request = createRequest(
      'http://localhost/api/current?display=inky_frame_7_spectra'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.data.position).toBeDefined();
    expect(data.data.total).toBe(2);
  });
});






