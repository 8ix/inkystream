/**
 * Category management utilities
 * Loads and manages image categories from config/categories.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Category, CategoriesConfig } from '@/lib/types/category';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'categories.json');

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
 * Load all categories from the configuration file
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config: CategoriesConfig = JSON.parse(content);
    console.log(`Loaded ${config.categories.length} categories from ${CONFIG_PATH}`);
    return config.categories;
  } catch (error) {
    console.error('Failed to load categories:', error);
    console.error('CONFIG_PATH:', CONFIG_PATH);
    console.error('process.cwd():', process.cwd());
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
  // Images are stored in images/{categoryId}/{imageId}/, not public/images/
  const imagesDir = path.join(process.cwd(), 'images', categoryId);

  try {
    const entries = await fs.readdir(imagesDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).length;
  } catch (error) {
    // Directory might not exist if category has no images yet
    console.log(`Category ${categoryId} image directory not found or empty:`, imagesDir);
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

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  description: string,
  colour: string
): Promise<Category> {
  const categories = await getCategories();
  const id = generateSlug(name);

  // Check if ID already exists
  if (categories.some((cat) => cat.id === id)) {
    throw new Error(`Category with name '${name}' already exists.`);
  }

  const newCategory: Category = {
    id,
    name,
    description,
    colour,
  };

  categories.push(newCategory);
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify({ categories }, null, 2), 'utf-8');
    console.log(`Successfully wrote category to ${CONFIG_PATH}`);
  } catch (error) {
    console.error('Failed to write category:', error);
    console.error('CONFIG_PATH:', CONFIG_PATH);
    throw error;
  }

  // Create the category's image directory (images/{id}, not public/images/{id})
  const categoryDir = path.join(process.cwd(), 'images', id);
  try {
    await fs.mkdir(categoryDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

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
  const index = categories.findIndex((cat) => cat.id === id);

  if (index === -1) {
    return null; // Category not found
  }

  const updatedCategory: Category = {
    ...categories[index],
    name,
    description,
    colour,
    // Note: We don't change the ID to avoid breaking image paths
  };

  categories[index] = updatedCategory;
  await fs.writeFile(CONFIG_PATH, JSON.stringify({ categories }, null, 2), 'utf-8');

  return updatedCategory;
}

/**
 * Delete a category
 * Returns false if category not found, throws error if category has images
 */
export async function deleteCategory(id: string): Promise<boolean> {
  const categories = await getCategories();
  const index = categories.findIndex((cat) => cat.id === id);

  if (index === -1) {
    return false; // Category not found
  }

  // Check if category has images
  const imageCount = await getCategoryImageCount(id);
  if (imageCount > 0) {
    throw new Error(`Cannot delete category: it contains ${imageCount} image(s). Please delete or move them first.`);
  }

  // Remove from array
  categories.splice(index, 1);
  await fs.writeFile(CONFIG_PATH, JSON.stringify({ categories }, null, 2), 'utf-8');

  // Optionally remove the empty directory (images/{id}, not public/images/{id})
  const categoryDir = path.join(process.cwd(), 'images', id);
  try {
    await fs.rmdir(categoryDir);
  } catch {
    // Directory might not exist or not be empty
  }

  return true;
}
