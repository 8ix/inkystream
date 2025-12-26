/**
 * Type definitions for e-ink display profiles
 */

export interface DisplayProfile {
  /** Unique identifier for the display */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the display */
  description: string;
  /** Display width in pixels */
  width: number;
  /** Display height in pixels */
  height: number;
  /** Color palette supported by the display */
  palette: string[];
  /** Manufacturer of the display */
  manufacturer: string;
  /** Default dithering algorithm for this display */
  defaultDithering: string;
}

export interface DisplaysConfig {
  displays: DisplayProfile[];
}





