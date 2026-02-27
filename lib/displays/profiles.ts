/**
 * Display profile management utilities
 * Loads display profiles from config/displays.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { DisplayProfile, DisplaysConfig } from '@/lib/types/display';
import type { RGB } from '@/lib/processors/dither';
import { CONFIG_DIR } from '@/lib/utils/paths';

const CONFIG_PATH = path.join(CONFIG_DIR, 'displays.json');

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
 * Group all display profiles by manufacturer
 */
export async function getDisplaysByManufacturer(): Promise<Record<string, DisplayProfile[]>> {
  const displays = await getDisplayProfiles();
  return displays.reduce<Record<string, DisplayProfile[]>>((groups, display) => {
    const m = display.manufacturer;
    return { ...groups, [m]: [...(groups[m] ?? []), display] };
  }, {});
}

/**
 * Get the default dithering algorithm for a display, falling back to floyd-steinberg
 */
export async function getDefaultDithering(displayId: string): Promise<string> {
  const display = await getDisplayProfile(displayId);
  return display?.defaultDithering ?? 'floyd-steinberg';
}

/**
 * Convert hex color string to RGB object.
 * Returns black {r:0,g:0,b:0} for any invalid hex string.
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return {
    r: isNaN(r) ? 0 : r,
    g: isNaN(g) ? 0 : g,
    b: isNaN(b) ? 0 : b,
  };
}

/**
 * Get palette as RGB array
 */
export function getPaletteRgb(palette: string[]): RGB[] {
  return palette.map(hexToRgb);
}
