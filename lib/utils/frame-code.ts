/**
 * Multi-platform code generator for device integration
 * Generates ready-to-use code snippets for connecting frames to InkyStream
 */

import type { Device, DevicePlatform } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';

export interface CodeGenerationOverrides {
  refreshIntervalSeconds?: number;
  wifiSsid?: string;
  wifiPassword?: string;
  includeApiKey?: boolean;
  enableButtons?: boolean;
}

export interface CodeGenerationOptions {
  device: Device;
  display: DisplayProfile;
  apiBaseUrl: string;
  apiKey?: string;
  overrides?: CodeGenerationOverrides;
}

/**
 * Map display profile IDs to Inky Frame display constants
 */
function getInkyFrameDisplayConstant(displayId: string): string {
  const mapping: Record<string, string> = {
    'inky_frame_7_spectra6': 'DISPLAY_INKY_FRAME_SPECTRA_7',
    'inky_frame_5_spectra6': 'DISPLAY_INKY_FRAME_SPECTRA_5',
    'inky_frame_4_spectra6': 'DISPLAY_INKY_FRAME_SPECTRA_4',
  };
  
  return mapping[displayId] || 'DISPLAY_INKY_FRAME_SPECTRA_7';
}

/**
 * Generate MicroPython code for Pimoroni Inky Frame
 */
function generateMicroPythonCode(options: CodeGenerationOptions): string {
  const { device, display, apiBaseUrl, apiKey, overrides } = options;
  const displayConstant = getInkyFrameDisplayConstant(display.id);
  const apiKeyValue = apiKey || 'YOUR_API_KEY';
  const wifiSsid = overrides?.wifiSsid || 'YOUR_WIFI_SSID';
  const wifiPassword = overrides?.wifiPassword || 'YOUR_WIFI_PASSWORD';
  const refreshSeconds = overrides?.refreshIntervalSeconds ?? 3600;
  const includeApiKey = overrides?.includeApiKey ?? true;
  const enableButtons = overrides?.enableButtons ?? false;

  return `# InkyStream Integration for Pimoroni Inky Frame
# Device: ${device.name}
# Display: ${display.name} (${display.width}×${display.height})

import inky_frame
import network
import urequests
import ujson
import jpegdec
import time
from picographics import PicoGraphics, ${displayConstant} as DISPLAY

# WiFi Configuration
WIFI_SSID = "${wifiSsid}"
WIFI_PASSWORD = "${wifiPassword}"

# InkyStream Configuration
API_BASE_URL = "${apiBaseUrl}"
API_KEY = "${includeApiKey ? apiKeyValue : ''}"  # Set to empty to disable
DEVICE_ID = "${device.id}"
REFRESH_INTERVAL = ${refreshSeconds}  # Seconds

# Initialize display
graphics = PicoGraphics(DISPLAY)
jpeg = jpegdec.JPEG(graphics)
WIDTH, HEIGHT = graphics.get_bounds()

def connect_wifi():
    """Connect to WiFi network"""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if not wlan.isconnected():
        print(f"Connecting to {WIFI_SSID}...")
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        
        max_wait = 20
        while max_wait > 0:
            if wlan.isconnected():
                break
            max_wait -= 1
            time.sleep(1)
    
    if wlan.isconnected():
        print(f"Connected! IP: {wlan.ifconfig()[0]}")
        return True
    else:
        print("Failed to connect to WiFi")
        return False

def get_image_url(endpoint="random"):
    """Fetch image URL from InkyStream API"""
    url = f"{API_BASE_URL}/api/devices/{DEVICE_ID}/{endpoint}"
    if API_KEY and len(API_KEY) > 0 and API_KEY != "YOUR_API_KEY":
        url += f"?key={API_KEY}"
    
    try:
        response = urequests.get(url, timeout=10)
        data = ujson.loads(response.text)
        response.close()
        
        if data.get("success") and data.get("data", {}).get("imageUrl"):
            # Image URL already includes API key if needed
            image_url = data["data"]["imageUrl"]
            if image_url.startswith("/"):
                return API_BASE_URL + image_url
            return image_url
    except Exception as e:
        print(f"Error fetching image URL: {e}")
    
    return None

def download_and_display_image(image_url):
    """Download image and display on e-ink screen"""
    try:
        print(f"Downloading image from {image_url}...")
        response = urequests.get(image_url, timeout=30)
        
        # Save to temporary file
        with open("temp_image.jpg", "wb") as f:
            f.write(response.content)
        response.close()
        
        # Clear display
        graphics.set_pen(15)  # White
        graphics.clear()
        
        # Decode and display JPEG
        jpeg.open_file("temp_image.jpg")
        jpeg.decode(0, 0)
        
        # Update display
        graphics.update()
        print("Display updated successfully!")
        
    except Exception as e:
        print(f"Error displaying image: {e}")
        # Show error on display
        graphics.set_pen(0)  # Black
        graphics.clear()
        graphics.set_pen(15)  # White
        graphics.text("Error loading image", 10, 10, scale=2)
        graphics.update()

def main():
    """Main loop"""
    # Connect to WiFi
    if not connect_wifi():
        return
    
    # Initial image
    image_url = get_image_url("random")
    if image_url:
        download_and_display_image(image_url)
    
    # Main loop - update periodically
    while True:
        time.sleep(REFRESH_INTERVAL)
        image_url = get_image_url("next")  # Rotate to next image
        if image_url:
            download_and_display_image(image_url)

${enableButtons ? `
# Optional: Button controls
from pimoroni import Button
button_a = Button(12)  # Adjust pins for your board
button_b = Button(13)

while True:
    if button_a.read():
        image_url = get_image_url("next")
        if image_url:
            download_and_display_image(image_url)
    if button_b.read():
        image_url = get_image_url("random")
        if image_url:
            download_and_display_image(image_url)
    time.sleep(0.1)
` : ''}

if __name__ == "__main__":
    main()
`;
}

/**
 * Generate Arduino/ESP32 code
 */
function generateArduinoCode(options: CodeGenerationOptions): string {
  const { device, display, apiBaseUrl, apiKey, overrides } = options;
  const apiKeyValue = apiKey || 'YOUR_API_KEY';
  const includeApiKey = overrides?.includeApiKey ?? true;
  const refreshIntervalSeconds = overrides?.refreshIntervalSeconds ?? 3600;
  const refreshIntervalMs = Math.max(1, refreshIntervalSeconds) * 1000;
  
  return `// InkyStream Integration for ESP32 with Arduino
// Device: ${device.name}
// Display: ${display.name} (${display.width}×${display.height})

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
// Include your e-paper display library here
// #include <GxEPD2_BW.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// InkyStream Configuration
const char* apiBaseUrl = "${apiBaseUrl}";
const char* apiKey = "${includeApiKey ? apiKeyValue : ''}";  // Set to "" if not using
const char* deviceId = "${device.id}";
const unsigned long refreshInterval = ${refreshIntervalMs};  // milliseconds

// E-Paper display instance (adjust for your hardware)
// GxEPD2_BW<GxEPD2_750_T7, GxEPD2_750_T7::HEIGHT> display(
//     GxEPD2_750_T7(SS, DC, RST, BUSY)
// );

void setup() {
    Serial.begin(115200);
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("Connected! IP: ");
    Serial.println(WiFi.localIP());
    
    // Initialize display
    // display.init();
    
    // Fetch and display initial image
    updateDisplay("random");
}

String getImageUrl(const char* endpoint) {
    HTTPClient http;
    String url = String(apiBaseUrl) + "/api/devices/" + deviceId + "/" + endpoint;
    if (strlen(apiKey) > 0 && strcmp(apiKey, "YOUR_API_KEY") != 0) {
        url += "?key=" + String(apiKey);
    }
    
    http.begin(url);
    int httpCode = http.GET();
    
    if (httpCode == 200) {
        String payload = http.getString();
        
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, payload);
        
        if (!error && doc["success"]) {
            String imageUrl = doc["data"]["imageUrl"];
            if (imageUrl.startsWith("/")) {
                return String(apiBaseUrl) + imageUrl;
            }
            return imageUrl;
        }
    }
    
    http.end();
    return "";
}

void downloadAndDisplayImage(String imageUrl) {
    if (imageUrl.length() == 0) {
        Serial.println("No image URL provided");
        return;
    }
    
    HTTPClient http;
    http.begin(imageUrl);
    int httpCode = http.GET();
    
    if (httpCode == 200) {
        // Get image data
        int contentLength = http.getSize();
        uint8_t* imageData = (uint8_t*)malloc(contentLength);
        http.getStream().readBytes(imageData, contentLength);
        http.end();
        
        // Display image on e-paper
        // Implement your display-specific code here
        // display.drawBitmap(...);
        // display.display();
        
        free(imageData);
        Serial.println("Display updated successfully!");
    } else {
        Serial.printf("Failed to download image: %d\n", httpCode);
    }
}

void updateDisplay(const char* endpoint) {
    String imageUrl = getImageUrl(endpoint);
    if (imageUrl.length() > 0) {
        downloadAndDisplayImage(imageUrl);
    }
}

void loop() {
    // Update display periodically
    static unsigned long lastUpdate = 0;
    if (millis() - lastUpdate >= refreshInterval) {
        updateDisplay("next");
        lastUpdate = millis();
    }
    
    delay(1000);
}
`;
}

/**
 * Generate Python code for Raspberry Pi
 */
function generatePythonCode(options: CodeGenerationOptions): string {
  const { device, display, apiBaseUrl, apiKey, overrides } = options;
  const apiKeyValue = apiKey || 'YOUR_API_KEY';
  const includeApiKey = overrides?.includeApiKey ?? true;
  const refreshSeconds = overrides?.refreshIntervalSeconds ?? 21600; // 6 hours default
  
  return `#!/usr/bin/env python3
# InkyStream Integration for Raspberry Pi
# Device: ${device.name}
# Display: ${display.name} (${display.width}×${display.height})

import requests
from PIL import Image
from io import BytesIO
import time
import os

# Your specific e-ink library
# from inky.auto import auto

# WiFi is handled by the system - ensure your Pi is connected

# InkyStream Configuration
API_BASE_URL = "${apiBaseUrl}"
API_KEY = "${includeApiKey ? apiKeyValue : ''}"  # Set to None/empty if not using
DEVICE_ID = "${device.id}"
REFRESH_SECONDS = ${refreshSeconds}

def get_display():
    """Initialize and return display instance"""
    # return auto()  # Uncomment and adjust for your display
    pass

def get_image_url(endpoint="random"):
    """Fetch image URL from InkyStream API"""
    url = f"{API_BASE_URL}/api/devices/{DEVICE_ID}/{endpoint}"
    if API_KEY and len(API_KEY) > 0 and API_KEY != "YOUR_API_KEY":
        url += f"?key={API_KEY}"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get("success") and data.get("data", {}).get("imageUrl"):
            image_url = data["data"]["imageUrl"]
            if image_url.startswith("/"):
                return API_BASE_URL + image_url
            return image_url
    except Exception as e:
        print(f"Error fetching image URL: {e}")
    
    return None

def display_image(display, url):
    """Download and display image on e-ink screen"""
    try:
        print(f"Downloading image from {url}...")
        response = requests.get(url, timeout=30)
        image = Image.open(BytesIO(response.content))
        
        # Display image
        # display.set_image(image)
        # display.show()
        print("Display updated successfully!")
        
    except Exception as e:
        print(f"Error displaying image: {e}")

def main():
    display = get_display()
    
    # Initial image
    url = get_image_url("random")
    if url:
        display_image(display, url)
    
    # Main loop
    while True:
        time.sleep(REFRESH_SECONDS)
        url = get_image_url("next")
        if url:
            display_image(display, url)

if __name__ == "__main__":
    main()
`;
}

/**
 * Generate custom code using user-provided template
 */
function generateCustomCode(options: CodeGenerationOptions): string {
  const { device, display, apiBaseUrl, apiKey, overrides } = options;
  const template = device.codeTemplate || '';
  const refreshSeconds = overrides?.refreshIntervalSeconds ?? 3600;
  const wifiSsid = overrides?.wifiSsid || 'YOUR_WIFI_SSID';
  const wifiPassword = overrides?.wifiPassword || 'YOUR_WIFI_PASSWORD';
  const includeApiKey = overrides?.includeApiKey ?? true;
  
  // Replace template variables
  return template
    .replace(/\{\{DEVICE_ID\}\}/g, device.id)
    .replace(/\{\{DEVICE_NAME\}\}/g, device.name)
    .replace(/\{\{API_BASE_URL\}\}/g, apiBaseUrl)
    .replace(/\{\{API_KEY\}\}/g, includeApiKey ? (apiKey || 'YOUR_API_KEY') : '')
    .replace(/\{\{REFRESH_INTERVAL_SECONDS\}\}/g, refreshSeconds.toString())
    .replace(/\{\{WIFI_SSID\}\}/g, wifiSsid)
    .replace(/\{\{WIFI_PASSWORD\}\}/g, wifiPassword)
    .replace(/\{\{DISPLAY_WIDTH\}\}/g, display.width.toString())
    .replace(/\{\{DISPLAY_HEIGHT\}\}/g, display.height.toString())
    .replace(/\{\{DISPLAY_ID\}\}/g, display.id)
    .replace(/\{\{DISPLAY_NAME\}\}/g, display.name);
}

/**
 * Main code generation function
 */
export function generateDeviceCode(options: CodeGenerationOptions): string {
  const { device } = options;
  const platform = device.platform || 'python-raspberry-pi'; // Default to Python
  
  switch (platform) {
    case 'micropython-inky-frame':
      return generateMicroPythonCode(options);
    case 'arduino-esp32':
      return generateArduinoCode(options);
    case 'python-raspberry-pi':
      return generatePythonCode(options);
    case 'custom':
      return generateCustomCode(options);
    default:
      return generatePythonCode(options);
  }
}

/**
 * Get platform-specific instructions
 */
export function getPlatformInstructions(platform: DevicePlatform): {
  title: string;
  description: string;
  steps: string[];
  links?: Array<{ label: string; url: string }>;
} {
  switch (platform) {
    case 'micropython-inky-frame':
      return {
        title: 'Pimoroni Inky Frame Setup',
        description: 'Upload this code to your Inky Frame using Thonny IDE',
        steps: [
          'Install Thonny IDE on your computer',
          'Connect your Inky Frame via USB',
          'Open Thonny and select the correct interpreter (MicroPython on Raspberry Pi Pico)',
          'Copy the code below and paste it into Thonny',
          'Update WiFi credentials and API key in the code',
          'Save as main.py and upload to your device',
          'The device will automatically connect and start displaying images'
        ],
        links: [
          { label: 'Inky Frame Documentation', url: 'https://github.com/pimoroni/inky-frame' },
          { label: 'Thonny IDE', url: 'https://thonny.org/' }
        ]
      };
    case 'arduino-esp32':
      return {
        title: 'ESP32 Arduino Setup',
        description: 'Upload this code to your ESP32 using Arduino IDE',
        steps: [
          'Install Arduino IDE',
          'Add ESP32 board support (Tools > Board > Boards Manager)',
          'Install required libraries (WiFi, HTTPClient, ArduinoJson)',
          'Copy the code below and paste it into Arduino IDE',
          'Update WiFi credentials and API key',
          'Select your ESP32 board and port',
          'Upload the code to your device'
        ],
        links: [
          { label: 'ESP32 Arduino Setup', url: 'https://docs.espressif.com/projects/arduino-esp32/en/latest/getting_started.html' }
        ]
      };
    case 'python-raspberry-pi':
      return {
        title: 'Raspberry Pi Setup',
        description: 'Run this code on your Raspberry Pi',
        steps: [
          'Ensure your Raspberry Pi is connected to WiFi',
          'Install required Python packages: pip install requests pillow',
          'Copy the code below and save as display_image.py',
          'Update API key in the code',
          'Make executable: chmod +x display_image.py',
          'Run: python3 display_image.py',
          'Optionally set up as a systemd service for auto-start'
        ],
        links: [
          { label: 'Pimoroni Inky Library', url: 'https://github.com/pimoroni/inky' }
        ]
      };
    case 'custom':
      return {
        title: 'Custom Platform',
        description: 'Use your own code template with variable substitution',
        steps: [
          'Edit the custom template in device settings',
          'Use template variables: {{DEVICE_ID}}, {{API_BASE_URL}}, {{API_KEY}}, etc.',
          'Copy the generated code and use it in your project'
        ]
      };
    default:
      return {
        title: 'Unknown Platform',
        description: 'No instructions available',
        steps: []
      };
  }
}

/**
 * Auto-detect suggested platform based on display profile
 */
export function suggestPlatform(displayId: string): DevicePlatform {
  if (displayId.startsWith('inky_frame_')) {
    return 'micropython-inky-frame';
  }
  return 'python-raspberry-pi'; // Default to most flexible option
}

