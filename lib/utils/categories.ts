/**
 * Category management utilities
 * Loads and manages image categories from config/categories.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Category, CategoriesConfig } from '@/lib/types/category';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'categories.json');

/**
 * Load all categories from the configuration file
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config: CategoriesConfig = JSON.parse(content);
    return config.categories;
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
}

/**
 * Get a single category by its ID
 */
export async function getCategory(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((cat) => cat.id === id) || null;
}

/**
 * Get the image count for a specific category
 */
export async function getCategoryImageCount(categoryId: string): Promise<number> {
  const imagesDir = path.join(process.cwd(), 'public', 'images', categoryId);

  try {
    const entries = await fs.readdir(imagesDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).length;
  } catch {
    return 0;
  }
}

/**
 * Get all categories with their image counts
 */
export async function getCategoriesWithCounts(): Promise<
  (Category & { imageCount: number })[]
> {
  const categories = await getCategories();
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      imageCount: await getCategoryImageCount(category.id),
    }))
  );
  return categoriesWithCounts;
}

/**
 * Check if a category exists
 */
export async function categoryExists(id: string): Promise<boolean> {
  const category = await getCategory(id);
  return category !== null;
}

