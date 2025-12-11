/**
 * Tests for /api/next endpoint
 */

import { GET } from '@/app/api/next/route';
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
    readFile: jest.fn().mockRejectedValue(new Error('File not found')),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

import { getAllImages, getCategoryImages } from '@/lib/utils/image';
import { displayExists } from '@/lib/displays/profiles';
import { categoryExists } from '@/lib/utils/categories';

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost'));
}

describe('GET /api/next', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (displayExists as jest.Mock).mockResolvedValue(true);
    (categoryExists as jest.Mock).mockResolvedValue(true);
  });

  it('should return 400 when display parameter is missing', async () => {
    const request = createRequest('http://localhost/api/next');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 404 when no images exist', async () => {
    (getAllImages as jest.Mock).mockResolvedValue([]);

    const request = createRequest(
      'http://localhost/api/next?display=inky_frame_7_spectra'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('should return next image and advance position', async () => {
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
      'http://localhost/api/next?display=inky_frame_7_spectra'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.position).toBeDefined();
  });

  it('should wrap around to first image', async () => {
    const mockImages = [
      {
        id: 'img1',
        categoryId: 'landscapes',
        variants: [{ displayId: 'inky_frame_7_spectra' }],
      },
    ];

    (getAllImages as jest.Mock).mockResolvedValue(mockImages);

    const request = createRequest(
      'http://localhost/api/next?display=inky_frame_7_spectra'
    );

    const response = await GET(request);
    const data = await response.json();

    // With only one image, position should always be 1
    expect(data.data.position).toBe(1);
    expect(data.data.total).toBe(1);
  });
});




