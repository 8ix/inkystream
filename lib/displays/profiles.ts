/**
 * Display profile management utilities
 * Loads display profiles from config/displays.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { DisplayProfile, DisplaysConfig } from '@/lib/types/display';
import type { RGB } from '@/lib/processors/dither';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'displays.json');

/**
 * Load all display profiles from the configuration file
 */
export async function getDisplayProfiles(): Promise<DisplayProfile[]> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config: DisplaysConfig = JSON.parse(content);
    return config.displays;
  } catch (error) {
    console.error('Failed to load display profiles:', error);
    return [];
  }
}

/**
 * Get a single display profile by its ID
 */
export async function getDisplayProfile(id: string): Promise<DisplayProfile | null> {
  const displays = await getDisplayProfiles();
  return displays.find((display) => display.id === id) || null;
}

/**
 * Check if a display profile exists
 */
export async function displayExists(id: string): Promise<boolean> {
  const display = await getDisplayProfile(id);
  return display !== null;
}

/**
 * Convert hex color string to RGB object
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

/**
 * Get palette as RGB array
 */
export function getPaletteRgb(palette: string[]): RGB[] {
  return palette.map(hexToRgb);
}
