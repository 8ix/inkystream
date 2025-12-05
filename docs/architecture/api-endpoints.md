# API Endpoints

Complete reference for InkyStream's API endpoints.

## Base URL

- **Local Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

## Authentication

All API endpoints require authentication when `INKYSTREAM_API_KEY` is set on Vercel.

### Providing the API Key

Include the key in your requests using one of these methods:

**Query Parameter** (recommended for microcontrollers):
```bash
curl "https://your-domain/api/devices/my-frame/random?key=YOUR_API_KEY"
```

**Authorization Header**:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" "https://your-domain/api/devices/my-frame/random"
```

### Unauthorized Response

If the API key is missing or invalid:

```json
{
  "success": false,
  "error": "Unauthorized. API key required.",
  "hint": "Include ?key=YOUR_API_KEY in the URL or Authorization: Bearer YOUR_API_KEY header"
}
```

HTTP Status: `401 Unauthorized`

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
| `key` | string | Yes* | API key for authentication |
| `category` | string | No | Category ID to filter by |

*Required when `INKYSTREAM_API_KEY` is set

**Example Request**:
```bash
curl "https://your-domain/api/devices/living-room-frame/random?key=YOUR_KEY"
curl "https://your-domain/api/devices/living-room-frame/random?key=YOUR_KEY&category=landscapes"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "imageUrl": "/api/img/landscapes/abc123/living-room-frame.png?key=YOUR_KEY",
    "imageId": "abc123",
    "categoryId": "landscapes",
    "deviceId": "living-room-frame"
  }
}
```

Note: The `imageUrl` already includes the API key for easy downloading.

**Error Responses**:
- `401`: Unauthorized (missing/invalid API key)
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
| `key` | string | Yes* | API key for authentication |
| `category` | string | No | Category ID to filter by |

**Example Request**:
```bash
curl "https://your-domain/api/devices/living-room-frame/next?key=YOUR_KEY"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "imageUrl": "/api/img/art/def456/living-room-frame.png?key=YOUR_KEY",
    "imageId": "def456",
    "categoryId": "art",
    "deviceId": "living-room-frame"
  }
}
```

---

### GET /api/devices/{deviceId}/current

Returns the currently set image for a device, or defaults to first available image.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceId` | string | Your device ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes* | API key for authentication |

**Example Request**:
```bash
curl "https://your-domain/api/devices/living-room-frame/current?key=YOUR_KEY"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "imageUrl": "/api/img/landscapes/abc123/living-room-frame.png?key=YOUR_KEY",
    "imageId": "abc123",
    "categoryId": "landscapes",
    "deviceId": "living-room-frame"
  }
}
```

---

### POST /api/devices/{deviceId}/current

Sets the current image for a device. (Admin only - no API key required as it's local only)

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
    "imageUrl": "/api/img/landscapes/abc123/living-room-frame.png",
    "imageId": "abc123",
    "categoryId": "landscapes",
    "deviceId": "living-room-frame"
  }
}
```

---

## Image Serving Endpoint

### GET /api/img/{categoryId}/{imageId}/{filename}

Serves processed images from private storage with authentication.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | Category ID |
| `imageId` | string | Image UUID |
| `filename` | string | Image filename (e.g., `living-room-frame.png`) |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes* | API key for authentication |

**Example Request**:
```bash
curl "https://your-domain/api/img/landscapes/abc123/living-room-frame.png?key=YOUR_KEY"
```

**Response**: Binary image data with appropriate `Content-Type` header.

---

## Device Management Endpoints

### GET /api/devices

Lists all configured devices. (Admin only - no API key required)

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

Get details for a specific device. (Admin only)

**Example Request**:
```bash
curl "https://your-domain/api/devices/living-room-frame"
```

---

## Category Endpoints

### GET /api/categories

Lists all available categories with image counts.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes* | API key for authentication |

**Example Request**:
```bash
curl "https://your-domain/api/categories?key=YOUR_KEY"
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

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes* | API key for authentication |

**Example Request**:
```bash
curl "https://your-domain/api/categories/landscapes?key=YOUR_KEY"
```

---

## Display Profile Endpoints

### GET /api/displays

Lists all supported display types.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes* | API key for authentication |

**Example Request**:
```bash
curl "https://your-domain/api/displays?key=YOUR_KEY"
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

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Missing or invalid API key |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Cannot complete action (e.g., delete category with images) |
| 500 | Internal Server Error - Server-side issue |

## Rate Limiting

The Vercel free tier includes built-in rate limiting. For typical e-ink frame usage (refreshing every few hours), you should never hit these limits.

## Caching

API responses are cached by Vercel's CDN. Images are served with appropriate cache headers for optimal performance.

## Security Notes

1. **API key protection**: All public endpoints require the API key when set
2. **Private image storage**: Images are not in the `public/` directory
3. **Authenticated image serving**: The `/api/img/` endpoint validates the API key
4. **Admin endpoints**: Management endpoints only work locally (not deployed)

## Frame Implementation Example

### MicroPython (Pimoroni Inky Frame)

```python
import urequests
import ujson

API_BASE = "https://your-domain.vercel.app"
DEVICE_ID = "living-room-frame"
API_KEY = "YOUR_API_KEY"  # Keep this secret!

def get_random_image():
    url = f"{API_BASE}/api/devices/{DEVICE_ID}/random?key={API_KEY}"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    response.close()
    
    if data["success"]:
        # Image URL already includes the API key
        image_url = API_BASE + data["data"]["imageUrl"]
        return image_url
    return None

def get_next_image():
    url = f"{API_BASE}/api/devices/{DEVICE_ID}/next?key={API_KEY}"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    response.close()
    
    if data["success"]:
        image_url = API_BASE + data["data"]["imageUrl"]
        return image_url
    return None

# Usage
image_url = get_random_image()
# Download and display...
```

See [Frame Configuration](../user-guide/frame-configuration.md) for complete examples.
