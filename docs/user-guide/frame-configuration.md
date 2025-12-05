# Frame Configuration

This guide explains how to configure your e-ink frames to display images from InkyStream.

## Overview

Your e-ink frame needs to:
1. Connect to your WiFi network
2. Fetch image URLs from the InkyStream API
3. Download and display the images
4. Optionally rotate images on a schedule

## API Endpoints

Your frame will use these endpoints:

| Endpoint | Description |
|----------|-------------|
| `/api/current` | Get current image |
| `/api/next` | Rotate to next image |
| `/api/random` | Get random image |
| `/api/categories` | List categories |
| `/api/displays` | List display types |

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `display` | Yes | Display profile ID (e.g., `inky_frame_7_spectra`) |
| `category` | No | Category ID to filter by |

### Example Requests

```bash
# Get current image for Inky Frame 7
curl "https://your-domain.vercel.app/api/current?display=inky_frame_7_spectra"

# Get current landscape image
curl "https://your-domain.vercel.app/api/current?display=inky_frame_7_spectra&category=landscapes"

# Rotate to next image
curl "https://your-domain.vercel.app/api/next?display=inky_frame_7_spectra"
```

### Response Format

```json
{
  "success": true,
  "data": {
    "imageUrl": "/images/landscapes/abc123/inky_frame_7_spectra.png",
    "imageId": "abc123",
    "categoryId": "landscapes",
    "displayId": "inky_frame_7_spectra"
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
from jpegdec import JPEG

# Configuration
WIFI_SSID = "your-wifi-name"
WIFI_PASSWORD = "your-wifi-password"
API_BASE = "https://your-domain.vercel.app"
DISPLAY_TYPE = "inky_frame_7_spectra"
CATEGORY = "landscapes"  # Optional
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

def get_image_url():
    url = f"{API_BASE}/api/current?display={DISPLAY_TYPE}"
    if CATEGORY:
        url += f"&category={CATEGORY}"
    
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
    # (Implementation depends on your specific frame)
    graphics.set_pen(15)  # White
    graphics.clear()
    
    # Load and display PNG
    # ... frame-specific code
    
    graphics.update()

def main():
    connect_wifi()
    
    while True:
        url = get_image_url()
        if url:
            display_image(url)
        
        # Sleep for refresh interval
        time.sleep(REFRESH_HOURS * 3600)

if __name__ == "__main__":
    main()
```

### With Image Rotation

```python
def rotate_to_next():
    url = f"{API_BASE}/api/next?display={DISPLAY_TYPE}"
    if CATEGORY:
        url += f"&category={CATEGORY}"
    
    response = urequests.get(url)
    data = ujson.loads(response.text)
    response.close()
    
    if data["success"]:
        return API_BASE + data["data"]["imageUrl"]
    return None

# In main loop:
# First display: get_image_url()
# Subsequent: rotate_to_next()
```

### Button Controls

```python
from pimoroni import Button

button_a = Button(BUTTON_A)
button_b = Button(BUTTON_B)

while True:
    if button_a.read():
        # Next image
        url = rotate_to_next()
        display_image(url)
    
    if button_b.read():
        # Random image
        url = f"{API_BASE}/api/random?display={DISPLAY_TYPE}"
        # ... fetch and display
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
const char* displayType = "waveshare_7_5_bw";

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
    String url = String(apiBase) + "/api/current?display=" + displayType;
    
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
DISPLAY_TYPE = "inky_impression_7"  # Adjust for your display
CATEGORY = None  # Or "landscapes", etc.
REFRESH_HOURS = 6

def get_display():
    return auto()

def get_image_url():
    url = f"{API_BASE}/api/current?display={DISPLAY_TYPE}"
    if CATEGORY:
        url += f"&category={CATEGORY}"
    
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
        url = get_image_url()
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
API: /api/next
Result: Shows next image in sequence
```

### Random

Show random images:
```
API: /api/random
Result: Shows random image
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
```

## Troubleshooting

### Frame Can't Connect

1. Verify WiFi credentials
2. Check network connectivity
3. Ensure HTTPS is supported
4. Test API URL in browser

### Wrong Image Size

1. Verify display profile matches your hardware
2. Check `config/displays.json` dimensions
3. Reprocess images if needed

### Image Quality Issues

1. Check original image quality
2. Try different dithering algorithm
3. Increase contrast in source

### API Errors

1. Test API directly with curl
2. Check Vercel deployment status
3. Verify query parameters

## Next Steps

- [API Endpoint Reference](../architecture/api-endpoints.md)
- [Adding New Displays](../development/adding-displays.md)
- [Troubleshooting](../setup/troubleshooting.md)

