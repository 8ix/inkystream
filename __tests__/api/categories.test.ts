/**
 * Tests for /api/categories endpoint
 */

import { GET } from '@/app/api/categories/route';

// Mock the categories utilities
jest.mock('@/lib/utils/categories', () => ({
  getCategoriesWithCounts: jest.fn(),
}));

import { getCategoriesWithCounts } from '@/lib/utils/categories';

describe('GET /api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return categories list', async () => {
    const mockCategories = [
      {
        id: 'landscapes',
        name: 'Landscapes',
        description: 'Nature views',
        colour: '#228B22',
        imageCount: 5,
      },
    ];

    (getCategoriesWithCounts as jest.Mock).mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.categories).toEqual(mockCategories);
  });

  it('should include image counts', async () => {
    const mockCategories = [
      {
        id: 'landscapes',
        name: 'Landscapes',
        description: 'Nature views',
        colour: '#228B22',
        imageCount: 10,
      },
    ];

    (getCategoriesWithCounts as jest.Mock).mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(data.data.categories[0]).toHaveProperty('imageCount');
    expect(data.data.categories[0].imageCount).toBe(10);
  });

  it('should return empty array when no categories', async () => {
    (getCategoriesWithCounts as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.categories).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    (getCategoriesWithCounts as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});




