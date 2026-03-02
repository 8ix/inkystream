/**
 * Type definitions for user-created devices
 */

export type DevicePlatform = 
  | 'micropython-inky-frame'  // Pimoroni Inky Frame (Pico W/Pico 2 W)
  | 'arduino-esp32'           // ESP32 with Arduino
  | 'python-raspberry-pi'     // Raspberry Pi with Python
  | 'custom';                 // User-provided template

export interface Device {
  /** Unique identifier for the device (slug format) */
  id: string;
  /** Human-readable name for the device */
  name: string;
  /** The display type ID this device uses */
  displayId: string;
  /** Platform identifier for code generation */
  platform?: DevicePlatform;
  /** Custom code template (only used when platform is 'custom') */
  codeTemplate?: string;
  /** Expected refresh interval (seconds) used for health checks */
  refreshIntervalSeconds?: number;
  /** Last time this device pulled an image (ISO timestamp) */
  lastSeenAt?: string;
  /** If set, /random and /next will only serve images from this category unless overridden by query param */
  categoryFilter?: string;
  /** When the device was created */
  createdAt: string;
}

export interface DevicesConfig {
  devices: Device[];
}

