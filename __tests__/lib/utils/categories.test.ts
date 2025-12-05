/**
 * Tests for category utilities
 */

import {
  getCategories,
  getCategory,
  getCategoryImageCount,
  getCategoriesWithCounts,
  categoryExists,
} from '@/lib/utils/categories';

// Mock the fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
  },
}));

import { promises as fs } from 'fs';

const mockCategories = {
  categories: [
    {
      id: 'landscapes',
      name: 'Landscapes',
      description: 'Nature and scenic views',
      colour: '#228B22',
    },
    {
      id: 'family',
      name: 'Family',
      description: 'Family photos and memories',
      colour: '#FFB6C1',
    },
    {
      id: 'art',
      name: 'Art',
      description: 'Artistic and abstract images',
      colour: '#9370DB',
    },
  ],
};

describe('Category Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockCategories));
  });

  describe('getCategories', () => {
    it('should return an array of categories', async () => {
      const categories = await getCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(3);
    });

    it('should include required properties for each category', async () => {
      const categories = await getCategories();

      categories.forEach((category) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('colour');
      });
    });

    it('should return correct category data', async () => {
      const categories = await getCategories();

      expect(categories[0].id).toBe('landscapes');
      expect(categories[0].name).toBe('Landscapes');
      expect(categories[0].colour).toBe('#228B22');
    });

    it('should return empty array on error', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const categories = await getCategories();

      expect(categories).toEqual([]);
    });
  });

  describe('getCategory', () => {
    it('should return a category by ID', async () => {
      const category = await getCategory('landscapes');

      expect(category).not.toBeNull();
      expect(category?.id).toBe('landscapes');
      expect(category?.name).toBe('Landscapes');
    });

    it('should return null for non-existent ID', async () => {
      const category = await getCategory('nonexistent');

      expect(category).toBeNull();
    });

    it('should be case-sensitive', async () => {
      const category = await getCategory('Landscapes');

      expect(category).toBeNull();
    });
  });

  describe('categoryExists', () => {
    it('should return true for existing category', async () => {
      const exists = await categoryExists('landscapes');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent category', async () => {
      const exists = await categoryExists('nonexistent');

      expect(exists).toBe(false);
    });
  });

  describe('getCategoryImageCount', () => {
    it('should return count of image directories', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'img1', isDirectory: () => true },
        { name: 'img2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ]);

      const count = await getCategoryImageCount('landscapes');

      expect(count).toBe(2);
    });

    it('should return 0 for empty category', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([]);

      const count = await getCategoryImageCount('landscapes');

      expect(count).toBe(0);
    });

    it('should return 0 on error', async () => {
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('Directory not found'));

      const count = await getCategoryImageCount('landscapes');

      expect(count).toBe(0);
    });
  });

  describe('getCategoriesWithCounts', () => {
    it('should return categories with image counts', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'img1', isDirectory: () => true },
      ]);

      const categories = await getCategoriesWithCounts();

      expect(categories[0]).toHaveProperty('imageCount');
      expect(categories[0].imageCount).toBe(1);
    });
  });
});

