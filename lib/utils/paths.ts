/**
 * Centralized data directory configuration
 * Ensures consistent path resolution across all modules, especially in Docker/standalone mode
 */

import path from 'path';

// Use environment variable if set, otherwise default to process.cwd()
// In Docker, set INKYSTREAM_DATA_DIR=/app to ensure consistent paths
const DATA_DIR = process.env.INKYSTREAM_DATA_DIR || process.cwd();

export const IMAGES_DIR = path.join(DATA_DIR, 'images');
export const CONFIG_DIR = path.join(DATA_DIR, 'config');
export const STATE_DIR = DATA_DIR;

// Log paths on first import for debugging
console.log('[InkyStream] Data directories:', {
  DATA_DIR,
  IMAGES_DIR,
  CONFIG_DIR,
});

