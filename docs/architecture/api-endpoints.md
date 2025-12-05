# API Endpoints

Complete reference for InkyStream's API endpoints.

## Base URL

- **Local Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

## Response Format

All endpoints return JSON with a consistent structure:

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Device-Specific Endpoints

These are the recommended endpoints for e-ink frames. They use your device ID for cleaner URLs and ensure images are properly sized for your specific hardware.

### GET /api/devices/{deviceId}/random

Returns a random image for the specified device.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceId` | string | Your device ID (e.g., `living-room-frame`) |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Category ID to filter by |

**Example Request**:
```bash
curl "https://your-domain/api/devices/living-room-frame/random"
curl "https://your-domain/api/devices/living-room-frame/random?category=landscapes"
```

**Success Response**:
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

**Error Responses**:
- `400`: Invalid device ID
- `404`: No images found for device/category

---

### GET /api/devices/{deviceId}/next

Rotates to the next image in sequence and returns it.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceId` | string | Your device ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Category ID to filter by |

**Example Request**:
```bash
curl "https://your-domain/api/devices/living-room-frame/next"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "imageUrl": "/images/art/def456/living-room-frame.png",
    "imageId": "def456",
    "categoryId": "art",
    "deviceId": "living-room-frame"
  }
}
```

---

### GET /api/devices/{deviceId}/current

Returns the currently set image for a device, or 404 if none is set.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceId` | string | Your device ID |

**Example Request**:
```bash
curl "https://your-domain/api/devices/living-room-frame/current"
```

**Success Response**:
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

---

### POST /api/devices/{deviceId}/current

Sets the current image for a device.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceId` | string | Your device ID |

**Request Body**:
```json
{
  "imageId": "abc123",
  "categoryId": "landscapes"
}
```

**Success Response**:
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

---

## Device Management Endpoints

### GET /api/devices

Lists all configured devices.

**Example Request**:
```bash
curl "https://your-domain/api/devices"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "living-room-frame",
        "name": "Living Room Frame",
        "displayId": "inky_frame_7_spectra6",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### GET /api/devices/{deviceId}

Get details for a specific device.

**Example Request**:
```bash
curl "https://your-domain/api/devices/living-room-frame"
```

---

## Category Endpoints

### GET /api/categories

Lists all available categories with image counts.

**Example Request**:
```bash
curl "https://your-domain/api/categories"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "landscapes",
        "name": "Landscapes",
        "description": "Nature and scenic views",
        "colour": "#228B22",
        "imageCount": 15
      },
      {
        "id": "family",
        "name": "Family",
        "description": "Family photos and memories",
        "colour": "#FFB6C1",
        "imageCount": 23
      }
    ]
  }
}
```

---

### GET /api/categories/{categoryId}

Get details for a specific category.

**Example Request**:
```bash
curl "https://your-domain/api/categories/landscapes"
```

---

## Display Profile Endpoints

### GET /api/displays

Lists all supported display types.

**Example Request**:
```bash
curl "https://your-domain/api/displays"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "displays": [
      {
        "id": "inky_frame_7_spectra6",
        "name": "Inky Frame 7.3\" Spectra 6",
        "description": "Pimoroni Inky Frame 7.3\" with 6-colour Spectra 6 display",
        "width": 800,
        "height": 480,
        "palette": ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"],
        "manufacturer": "Pimoroni"
      }
    ]
  }
}
```

---

## Legacy Endpoints

These endpoints use display type directly (for backwards compatibility):

### GET /api/current

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `display` | string | Yes | Display profile ID |
| `category` | string | No | Category ID |

### GET /api/next

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `display` | string | Yes | Display profile ID |
| `category` | string | No | Category ID |

### GET /api/random

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `display` | string | Yes | Display profile ID |
| `category` | string | No | Category ID |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Cannot complete action (e.g., delete category with images) |
| 500 | Internal Server Error - Server-side issue |

## Rate Limiting

The Vercel free tier includes built-in rate limiting. For typical e-ink frame usage (refreshing every few hours), you should never hit these limits.

## Caching

API responses are cached by Vercel's CDN. Static images are served directly from the CDN with long cache times for optimal performance.

## Frame Implementation Example

### MicroPython (Pimoroni Inky Frame)

```python
import urequests
import ujson

API_BASE = "https://your-domain.vercel.app"
DEVICE_ID = "living-room-frame"

def get_random_image():
    url = f"{API_BASE}/api/devices/{DEVICE_ID}/random"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    
    if data["success"]:
        image_url = API_BASE + data["data"]["imageUrl"]
        return image_url
    return None

def get_next_image():
    url = f"{API_BASE}/api/devices/{DEVICE_ID}/next"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    
    if data["success"]:
        image_url = API_BASE + data["data"]["imageUrl"]
        return image_url
    return None

# Usage
image_url = get_random_image()
# Download and display...
```

See [Frame Configuration](../user-guide/frame-configuration.md) for complete examples.
