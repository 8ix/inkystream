/**
 * Type definitions for user-created devices
 */

export interface Device {
  /** Unique identifier for the device (slug format) */
  id: string;
  /** Human-readable name for the device */
  name: string;
  /** The display type ID this device uses */
  displayId: string;
  /** When the device was created */
  createdAt: string;
}

export interface DevicesConfig {
  devices: Device[];
}

