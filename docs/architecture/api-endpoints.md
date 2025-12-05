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

## Endpoints

### GET /api/current

Returns the current image for a specific display and category.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `display` | string | Yes | Display profile ID (e.g., `inky_frame_7_spectra`) |
| `category` | string | No | Category ID (e.g., `landscapes`). If omitted, uses all categories |

**Example Request**:
```bash
curl "https://your-domain/api/current?display=inky_frame_7_spectra&category=landscapes"
```

**Success Response**:
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

**Error Responses**:
- `400`: Missing or invalid display parameter
- `404`: No images found for the specified criteria

---

### GET /api/next

Rotates to the next image and returns it.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `display` | string | Yes | Display profile ID |
| `category` | string | No | Category ID |

**Example Request**:
```bash
curl "https://your-domain/api/next?display=inky_frame_7_spectra&category=landscapes"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "imageUrl": "/images/landscapes/def456/inky_frame_7_spectra.png",
    "imageId": "def456",
    "categoryId": "landscapes",
    "displayId": "inky_frame_7_spectra",
    "position": 2,
    "total": 15
  }
}
```

---

### GET /api/random

Returns a random image from the specified category.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `display` | string | Yes | Display profile ID |
| `category` | string | No | Category ID |

**Example Request**:
```bash
curl "https://your-domain/api/random?display=inky_frame_7_spectra"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "imageUrl": "/images/art/xyz789/inky_frame_7_spectra.png",
    "imageId": "xyz789",
    "categoryId": "art",
    "displayId": "inky_frame_7_spectra"
  }
}
```

---

### GET /api/categories

Lists all available categories.

**Query Parameters**: None

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

### GET /api/displays

Lists all supported display types.

**Query Parameters**: None

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
        "id": "inky_frame_7_spectra",
        "name": "Inky Frame 7.3\" (Spectra)",
        "description": "Pimoroni Inky Frame 7.3\" with 7-colour Spectra display",
        "width": 800,
        "height": 480,
        "manufacturer": "Pimoroni"
      },
      {
        "id": "inky_frame_7_colour",
        "name": "Inky Frame 7.3\" (Colour)",
        "description": "Pimoroni Inky Frame 7.3\" with colour display",
        "width": 800,
        "height": 480,
        "manufacturer": "Pimoroni"
      }
    ]
  }
}
```

---

### GET /api/schedule

Returns the configured rotation schedule.

**Query Parameters**: None

**Example Request**:
```bash
curl "https://your-domain/api/schedule"
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "defaultRotationHours": 6,
    "schedules": [
      {
        "categoryId": "landscapes",
        "rotationHours": 12
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
| 404 | Not Found - Resource doesn't exist |
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
DISPLAY_TYPE = "inky_frame_7_spectra"
CATEGORY = "landscapes"

def get_current_image():
    url = f"{API_BASE}/api/current?display={DISPLAY_TYPE}&category={CATEGORY}"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    
    if data["success"]:
        image_url = API_BASE + data["data"]["imageUrl"]
        return image_url
    return None

def download_and_display(image_url):
    # Download image
    response = urequests.get(image_url)
    # Display on e-ink (implementation depends on frame)
    # ...
```

See [Frame Configuration](../user-guide/frame-configuration.md) for complete examples.

