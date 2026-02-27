/**
 * Tests for device code generation utilities
 */

import {
  generateDeviceCode,
  getPlatformInstructions,
  suggestPlatform,
  type CodeGenerationOptions,
} from '@/lib/utils/frame-code';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';

const mockDisplay: DisplayProfile = {
  id: 'inky_frame_7_spectra6',
  name: 'Inky Frame 7.3" Spectra 6',
  description: 'Pimoroni Inky Frame 7.3"',
  width: 800,
  height: 480,
  palette: ['#000000', '#FFFFFF'],
  manufacturer: 'Pimoroni',
  defaultDithering: 'floyd-steinberg',
};

function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 'living-room',
    name: 'Living Room',
    displayId: 'inky_frame_7_spectra6',
    platform: 'micropython-inky-frame',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeOptions(overrides: Partial<CodeGenerationOptions> = {}): CodeGenerationOptions {
  return {
    device: makeDevice(),
    display: mockDisplay,
    apiBaseUrl: 'http://192.168.1.100:3000',
    ...overrides,
  };
}

describe('Frame Code Generation', () => {
  // ---------------------------------------------------------------------------
  describe('generateDeviceCode — MicroPython (Inky Frame)', () => {
    it('generates code containing required configuration constants', () => {
      const code = generateDeviceCode(
        makeOptions({
          apiKey: 'myapikey',
          overrides: { wifiSsid: 'MyNetwork', wifiPassword: 'MyPassword' },
        })
      );

      expect(code).toContain('WIFI_SSID = "MyNetwork"');
      expect(code).toContain('WIFI_PASSWORD = "MyPassword"');
      expect(code).toContain('API_BASE_URL = "http://192.168.1.100:3000"');
      expect(code).toContain('DEVICE_ID = "living-room"');
      expect(code).toContain('API_KEY = "myapikey"');
    });

    it('uses placeholder values when WiFi/key overrides are not provided', () => {
      const code = generateDeviceCode(makeOptions());

      expect(code).toContain('WIFI_SSID = "YOUR_WIFI_SSID"');
      expect(code).toContain('WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"');
      expect(code).toContain('API_KEY = "YOUR_API_KEY"');
    });

    it('omits API key when includeApiKey is false', () => {
      const code = generateDeviceCode(
        makeOptions({
          apiKey: 'myapikey',
          overrides: { includeApiKey: false },
        })
      );

      expect(code).toContain('API_KEY = ""');
      expect(code).not.toContain('myapikey');
    });

    it('includes the correct display constant for the 7" Spectra display', () => {
      const code = generateDeviceCode(makeOptions());
      expect(code).toContain('DISPLAY_INKY_FRAME_SPECTRA_7');
    });

    it('converts refresh interval seconds to minutes', () => {
      const code = generateDeviceCode(
        makeOptions({ overrides: { refreshIntervalSeconds: 1800 } })
      );
      expect(code).toContain('REFRESH_INTERVAL_MINUTES = 30');
    });

    it('defaults to 60-minute refresh interval', () => {
      const code = generateDeviceCode(makeOptions());
      expect(code).toContain('REFRESH_INTERVAL_MINUTES = 60');
    });
  });

  // ---------------------------------------------------------------------------
  describe('generateDeviceCode — Arduino/ESP32', () => {
    const arduinoOptions = makeOptions({
      device: makeDevice({ platform: 'arduino-esp32' }),
      apiKey: 'arduinokey',
    });

    it('generates code containing WiFi and API configuration', () => {
      const code = generateDeviceCode(arduinoOptions);

      expect(code).toContain('#include <WiFi.h>');
      expect(code).toContain('const char* ssid = "YOUR_WIFI_SSID"');
      expect(code).toContain('const char* password = "YOUR_WIFI_PASSWORD"');
      expect(code).toContain(`const char* apiBaseUrl = "http://192.168.1.100:3000"`);
      expect(code).toContain('const char* deviceId = "living-room"');
      expect(code).toContain('const char* apiKey = "arduinokey"');
    });

    it('omits API key value when includeApiKey is false', () => {
      const code = generateDeviceCode(
        makeOptions({
          device: makeDevice({ platform: 'arduino-esp32' }),
          apiKey: 'arduinokey',
          overrides: { includeApiKey: false },
        })
      );

      expect(code).toContain('const char* apiKey = ""');
      expect(code).not.toContain('arduinokey');
    });

    it('converts refresh interval to milliseconds', () => {
      const code = generateDeviceCode(
        makeOptions({
          device: makeDevice({ platform: 'arduino-esp32' }),
          overrides: { refreshIntervalSeconds: 300 },
        })
      );
      expect(code).toContain('const unsigned long refreshInterval = 300000');
    });
  });

  // ---------------------------------------------------------------------------
  describe('generateDeviceCode — Python (Raspberry Pi)', () => {
    const piOptions = makeOptions({
      device: makeDevice({ platform: 'python-raspberry-pi' }),
      apiKey: 'pikey',
    });

    it('generates Python code with API configuration', () => {
      const code = generateDeviceCode(piOptions);

      expect(code).toContain('import requests');
      expect(code).toContain('API_BASE_URL = "http://192.168.1.100:3000"');
      expect(code).toContain('DEVICE_ID = "living-room"');
      expect(code).toContain('API_KEY = "pikey"');
    });

    it('omits API key when includeApiKey is false', () => {
      const code = generateDeviceCode(
        makeOptions({
          device: makeDevice({ platform: 'python-raspberry-pi' }),
          apiKey: 'pikey',
          overrides: { includeApiKey: false },
        })
      );

      expect(code).toContain('API_KEY = ""');
      expect(code).not.toContain('pikey');
    });
  });

  // ---------------------------------------------------------------------------
  describe('generateDeviceCode — Custom template', () => {
    it('substitutes all template variables', () => {
      const device = makeDevice({
        platform: 'custom',
        codeTemplate:
          '{{DEVICE_ID}} {{DEVICE_NAME}} {{API_BASE_URL}} {{API_KEY}} ' +
          '{{REFRESH_INTERVAL_SECONDS}} {{WIFI_SSID}} {{WIFI_PASSWORD}} ' +
          '{{DISPLAY_WIDTH}} {{DISPLAY_HEIGHT}} {{DISPLAY_ID}} {{DISPLAY_NAME}}',
      });

      const code = generateDeviceCode(
        makeOptions({
          device,
          apiKey: 'customkey',
          overrides: {
            wifiSsid: 'HomeNet',
            wifiPassword: 'pass123',
            refreshIntervalSeconds: 600,
          },
        })
      );

      expect(code).toContain('living-room');
      expect(code).toContain('Living Room');
      expect(code).toContain('http://192.168.1.100:3000');
      expect(code).toContain('customkey');
      expect(code).toContain('600');
      expect(code).toContain('HomeNet');
      expect(code).toContain('pass123');
      expect(code).toContain('800');
      expect(code).toContain('480');
      expect(code).toContain('inky_frame_7_spectra6');
      expect(code).toContain('Inky Frame 7.3" Spectra 6');
    });

    it('replaces all occurrences of a variable in the template', () => {
      const device = makeDevice({
        platform: 'custom',
        codeTemplate: '{{DEVICE_ID}} and {{DEVICE_ID}} again',
      });

      const code = generateDeviceCode(makeOptions({ device }));
      expect(code).toBe('living-room and living-room again');
    });

    it('omits API key from substitution when includeApiKey is false', () => {
      const device = makeDevice({
        platform: 'custom',
        codeTemplate: 'key={{API_KEY}}',
      });

      const code = generateDeviceCode(
        makeOptions({
          device,
          apiKey: 'secretkey',
          overrides: { includeApiKey: false },
        })
      );

      expect(code).toBe('key=');
      expect(code).not.toContain('secretkey');
    });

    it('returns empty string for a device with no codeTemplate', () => {
      const device = makeDevice({ platform: 'custom', codeTemplate: undefined });
      const code = generateDeviceCode(makeOptions({ device }));
      expect(code).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  describe('generateDeviceCode — platform dispatch', () => {
    it('falls back to Python code for an unknown platform', () => {
      const device = makeDevice({ platform: undefined });
      const code = generateDeviceCode(makeOptions({ device }));
      expect(code).toContain('import requests');
    });
  });

  // ---------------------------------------------------------------------------
  describe('getPlatformInstructions', () => {
    it('returns MicroPython instructions for micropython-inky-frame', () => {
      const instructions = getPlatformInstructions('micropython-inky-frame');
      expect(instructions.title).toContain('Inky Frame');
      expect(instructions.steps.length).toBeGreaterThan(0);
      expect(instructions.links).toBeDefined();
      expect(instructions.links?.some((l) => l.url.includes('pimoroni'))).toBe(true);
    });

    it('returns Arduino instructions for arduino-esp32', () => {
      const instructions = getPlatformInstructions('arduino-esp32');
      expect(instructions.title).toContain('ESP32');
      expect(instructions.steps.length).toBeGreaterThan(0);
      expect(instructions.links?.some((l) => l.url.includes('espressif'))).toBe(true);
    });

    it('returns Raspberry Pi instructions for python-raspberry-pi', () => {
      const instructions = getPlatformInstructions('python-raspberry-pi');
      expect(instructions.title).toContain('Raspberry Pi');
      expect(instructions.steps.length).toBeGreaterThan(0);
    });

    it('returns custom instructions for custom platform', () => {
      const instructions = getPlatformInstructions('custom');
      expect(instructions.title).toContain('Custom');
      expect(instructions.steps.some((s) => s.includes('{{'))).toBe(true);
    });

    it('each platform returns a title, description, and steps', () => {
      const platforms = [
        'micropython-inky-frame',
        'arduino-esp32',
        'python-raspberry-pi',
        'custom',
      ] as const;

      platforms.forEach((platform) => {
        const instructions = getPlatformInstructions(platform);
        expect(instructions.title).toBeTruthy();
        expect(instructions.description).toBeTruthy();
        expect(Array.isArray(instructions.steps)).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('suggestPlatform', () => {
    it('suggests micropython-inky-frame for inky_frame_ displays', () => {
      expect(suggestPlatform('inky_frame_7_spectra6')).toBe('micropython-inky-frame');
      expect(suggestPlatform('inky_frame_5_spectra6')).toBe('micropython-inky-frame');
      expect(suggestPlatform('inky_frame_4_spectra6')).toBe('micropython-inky-frame');
    });

    it('defaults to python-raspberry-pi for unrecognised display IDs', () => {
      expect(suggestPlatform('some_custom_display')).toBe('python-raspberry-pi');
      expect(suggestPlatform('')).toBe('python-raspberry-pi');
    });
  });
});
