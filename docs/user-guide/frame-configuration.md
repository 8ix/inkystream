# Frame Configuration

This guide explains how to configure your e-ink frames to display images from InkyStream.

## Overview

Your e-ink frame needs to:
1. Connect to your WiFi network
2. Fetch image URLs from the InkyStream API
3. Download and display the images
4. Optionally rotate images on a schedule

## Setting Up Your Device in InkyStream

Before configuring your frame, create a device in InkyStream:

1. Go to **Devices** page
2. Click **Add Device**
3. Enter a memorable name (e.g., "Living Room Frame")
4. Select the display type matching your hardware
5. Click **Create Device**

Note the **device ID** shown (it's the URL-friendly version of your name, like `living-room-frame`).

## API Endpoints

Your frame will use device-specific endpoints:

| Endpoint | Description |
|----------|-------------|
| `/api/devices/{deviceId}/current` | Get current image |
| `/api/devices/{deviceId}/next` | Rotate to next image |
| `/api/devices/{deviceId}/random` | Get random image |

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `category` | No | Category ID to filter by |

### Example Requests

```bash
# Get random image for your device
curl "https://your-domain.vercel.app/api/devices/living-room-frame/random"

# Get random image from landscapes category only
curl "https://your-domain.vercel.app/api/devices/living-room-frame/random?category=landscapes"

# Rotate to next image in sequence
curl "https://your-domain.vercel.app/api/devices/living-room-frame/next"

# Get current image (without rotation)
curl "https://your-domain.vercel.app/api/devices/living-room-frame/current"
```

### Response Format

```json
{
  "success": true,
  "data": {
    "imageUrl": "/images/landscapes/abc123/living-room-frame.png",
    "imageId": "abc123",
    "categoryId": "landscapes",
    "deviceId": "living-room-frame"
  }
}
```

## Pimoroni Inky Frame

### Basic Setup

```python
# main.py - MicroPython for Pimoroni Inky Frame

import network
import urequests
import ujson
import time
from picographics import PicoGraphics, DISPLAY_INKY_FRAME_7 as DISPLAY

# Configuration
WIFI_SSID = "your-wifi-name"
WIFI_PASSWORD = "your-wifi-password"
API_BASE = "https://your-domain.vercel.app"
DEVICE_ID = "living-room-frame"  # Your device ID from InkyStream
CATEGORY = None  # Set to category ID to filter, or None for all
REFRESH_HOURS = 6

# Initialize display
graphics = PicoGraphics(DISPLAY)
WIDTH, HEIGHT = graphics.get_bounds()

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    while not wlan.isconnected():
        time.sleep(1)
    
    print("Connected:", wlan.ifconfig())

def get_image_url(endpoint="random"):
    url = f"{API_BASE}/api/devices/{DEVICE_ID}/{endpoint}"
    if CATEGORY:
        url += f"?category={CATEGORY}"
    
    response = urequests.get(url)
    data = ujson.loads(response.text)
    response.close()
    
    if data["success"]:
        return API_BASE + data["data"]["imageUrl"]
    return None

def display_image(url):
    # Download image
    response = urequests.get(url)
    
    # Save temporarily
    with open("temp.png", "wb") as f:
        f.write(response.content)
    response.close()
    
    # Display image
    graphics.set_pen(15)  # White
    graphics.clear()
    
    # Load and display PNG (implementation depends on your setup)
    # ... frame-specific code
    
    graphics.update()

def main():
    connect_wifi()
    
    while True:
        url = get_image_url("random")
        if url:
            display_image(url)
        
        # Sleep for refresh interval
        time.sleep(REFRESH_HOURS * 3600)

if __name__ == "__main__":
    main()
```

### With Sequential Rotation

```python
def main():
    connect_wifi()
    
    # First image: get current or random
    url = get_image_url("random")
    if url:
        display_image(url)
    
    while True:
        # Wait for refresh interval
        time.sleep(REFRESH_HOURS * 3600)
        
        # Get next image in sequence
        url = get_image_url("next")
        if url:
            display_image(url)
```

### Button Controls

```python
from pimoroni import Button

button_a = Button(BUTTON_A)
button_b = Button(BUTTON_B)

while True:
    if button_a.read():
        # Next image
        url = get_image_url("next")
        if url:
            display_image(url)
    
    if button_b.read():
        # Random image
        url = get_image_url("random")
        if url:
            display_image(url)
    
    time.sleep(0.1)  # Debounce
```

## Waveshare E-Paper

### ESP32 Example

```cpp
// Arduino/ESP32 for Waveshare E-Paper

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <GxEPD2_BW.h>  // E-Paper library

// Configuration
const char* ssid = "your-wifi";
const char* password = "your-password";
const char* apiBase = "https://your-domain.vercel.app";
const char* deviceId = "bedroom-frame";  // Your device ID

// E-Paper display instance
GxEPD2_BW<GxEPD2_750_T7, GxEPD2_750_T7::HEIGHT> display(
    GxEPD2_750_T7(SS, DC, RST, BUSY)
);

void setup() {
    Serial.begin(115200);
    
    // Connect WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
    }
    
    // Initialize display
    display.init();
    
    // Fetch and display image
    updateDisplay();
}

String getImageUrl() {
    HTTPClient http;
    String url = String(apiBase) + "/api/devices/" + deviceId + "/random";
    
    http.begin(url);
    int code = http.GET();
    
    if (code == 200) {
        String payload = http.getString();
        
        StaticJsonDocument<512> doc;
        deserializeJson(doc, payload);
        
        if (doc["success"]) {
            return String(apiBase) + doc["data"]["imageUrl"].as<String>();
        }
    }
    
    http.end();
    return "";
}

void updateDisplay() {
    String imageUrl = getImageUrl();
    if (imageUrl.length() > 0) {
        // Download and display image
        // Implementation depends on your display
    }
}

void loop() {
    // Update every 6 hours
    delay(6 * 60 * 60 * 1000);
    updateDisplay();
}
```

## Raspberry Pi

### Python Script

```python
#!/usr/bin/env python3
# display_image.py - Raspberry Pi with e-ink HAT

import requests
from PIL import Image
from io import BytesIO
import time

# Your specific e-ink library
from inky.auto import auto

# Configuration
API_BASE = "https://your-domain.vercel.app"
DEVICE_ID = "kitchen-frame"  # Your device ID from InkyStream
CATEGORY = None  # Or "landscapes", etc.
REFRESH_HOURS = 6

def get_display():
    return auto()

def get_image_url(endpoint="random"):
    url = f"{API_BASE}/api/devices/{DEVICE_ID}/{endpoint}"
    if CATEGORY:
        url += f"?category={CATEGORY}"
    
    response = requests.get(url)
    data = response.json()
    
    if data["success"]:
        return API_BASE + data["data"]["imageUrl"]
    return None

def display_image(display, url):
    # Download image
    response = requests.get(url)
    image = Image.open(BytesIO(response.content))
    
    # Display
    display.set_image(image)
    display.show()

def main():
    display = get_display()
    
    while True:
        url = get_image_url("random")
        if url:
            display_image(display, url)
        
        time.sleep(REFRESH_HOURS * 3600)

if __name__ == "__main__":
    main()
```

### As a Service

```ini
# /etc/systemd/system/inkystream.service
[Unit]
Description=InkyStream Display Service
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/display_image.py
WorkingDirectory=/home/pi
StandardOutput=inherit
StandardError=inherit
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable inkystream
sudo systemctl start inkystream
```

## Display Rotation Strategies

### Sequential

Show images in order, one at a time:
```
API: /api/devices/{deviceId}/next
Result: Shows next image in sequence, loops back to start
```

### Random

Show random images:
```
API: /api/devices/{deviceId}/random
Result: Shows random image from library
```

### By Category

Filter to specific categories:
```
API: /api/devices/{deviceId}/random?category=landscapes
Result: Random image from landscapes only
```

### Scheduled by Time

Different categories at different times:
```python
import datetime

hour = datetime.datetime.now().hour

if 6 <= hour < 12:
    category = "landscapes"  # Morning: nature
elif 12 <= hour < 18:
    category = "art"  # Afternoon: art
else:
    category = "family"  # Evening: family

url = f"{API_BASE}/api/devices/{DEVICE_ID}/random?category={category}"
```

## Troubleshooting

### Frame Can't Connect

1. Verify WiFi credentials
2. Check network connectivity
3. Ensure HTTPS is supported
4. Test API URL in browser

### Wrong Image Size

1. Verify device in InkyStream matches your hardware
2. Check display profile dimensions
3. Reprocess images if you changed device settings

### Image Quality Issues

1. Check original image quality
2. Try different dithering algorithm
3. Adjust enhancement settings
4. Increase contrast in source

### API Errors

1. Test API directly with curl
2. Check Vercel deployment status
3. Verify device ID is correct
4. Check for typos in URL

## Next Steps

- [API Endpoint Reference](../architecture/api-endpoints.md)
- [Adding New Displays](../development/adding-displays.md)
- [Troubleshooting](../setup/troubleshooting.md)
