/**
 * Display profile management for different e-ink displays
 * Loads and manages display configurations from config/displays.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { DisplayProfile, DisplaysConfig } from '@/lib/types/display';

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
export async function getDisplayProfile(
  id: string
): Promise<DisplayProfile | null> {
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
 * Get display profiles grouped by manufacturer
 */
export async function getDisplaysByManufacturer(): Promise<
  Record<string, DisplayProfile[]>
> {
  const displays = await getDisplayProfiles();
  return displays.reduce(
    (acc, display) => {
      if (!acc[display.manufacturer]) {
        acc[display.manufacturer] = [];
      }
      acc[display.manufacturer].push(display);
      return acc;
    },
    {} as Record<string, DisplayProfile[]>
  );
}

/**
 * Get the default dithering algorithm for a display
 */
export async function getDefaultDithering(displayId: string): Promise<string> {
  const display = await getDisplayProfile(displayId);
  return display?.defaultDithering || 'floyd-steinberg';
}

/**
 * Parse a hex color string to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Get palette as RGB values for image processing
 */
export async function getPaletteRgb(
  displayId: string
): Promise<Array<{ r: number; g: number; b: number }>> {
  const display = await getDisplayProfile(displayId);
  if (!display) {
    return [];
  }
  return display.palette.map(hexToRgb);
}

