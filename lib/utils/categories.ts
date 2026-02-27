/**
 * Category management utilities
 * Loads and manages categories from config/categories.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Category, CategoriesConfig } from '@/lib/types/category';
import { CONFIG_DIR, IMAGES_DIR } from '@/lib/utils/paths';

const CONFIG_PATH = path.join(CONFIG_DIR, 'categories.json');

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
 * Save categories to the configuration file
 */
async function saveCategories(categories: Category[]): Promise<void> {
  const config: CategoriesConfig = { categories };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Get a single category by its ID
 */
export async function getCategory(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((category) => category.id === id) || null;
}

/**
 * Check if a category exists
 */
export async function categoryExists(id: string): Promise<boolean> {
  const category = await getCategory(id);
  return category !== null;
}

/**
 * Generate a slug from a category name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  description: string,
  colour: string
): Promise<Category> {
  const categories = await getCategories();
  
  // Generate a unique ID from the name
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;
  
  while (categories.some((c) => c.id === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  const newCategory: Category = {
    id: slug,
    name: name.trim(),
    description: description.trim(),
    colour,
  };
  
  categories.push(newCategory);
  await saveCategories(categories);
  
  return newCategory;
}

/**
 * Update an existing category
 */
export async function updateCategory(
  id: string,
  name: string,
  description: string,
  colour: string
): Promise<Category | null> {
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === id);
  
  if (index === -1) {
    return null;
  }
  
  categories[index] = {
    ...categories[index],
    name: name.trim(),
    description: description.trim(),
    colour,
  };
  
  await saveCategories(categories);
  return categories[index];
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<boolean> {
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === id);
  
  if (index === -1) {
    return false;
  }
  
  categories.splice(index, 1);
  await saveCategories(categories);
  return true;
}

/**
 * Get the count of images in a category
 */
export async function getCategoryImageCount(categoryId: string): Promise<number> {
  const categoryDir = path.join(IMAGES_DIR, categoryId);
  
  try {
    const entries = await fs.readdir(categoryDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).length;
  } catch {
    return 0;
  }
}

/**
 * Get all categories with their image counts
 */
export async function getCategoriesWithCounts(): Promise<Array<Category & { imageCount: number }>> {
  const categories = await getCategories();
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      imageCount: await getCategoryImageCount(category.id),
    }))
  );
  return categoriesWithCounts;
}
