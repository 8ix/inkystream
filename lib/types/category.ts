/**
 * Type definitions for the category system
 */

export interface Category {
  /** Unique identifier for the category */
  id: string;
  /** Display name of the category */
  name: string;
  /** Description of what this category contains */
  description: string;
  /** Color associated with this category (hex format) */
  colour: string;
}

export interface CategoriesConfig {
  categories: Category[];
}





