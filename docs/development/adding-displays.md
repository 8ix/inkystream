# Adding Display Support

This guide explains how to add support for new e-ink display types to InkyStream.

## Overview

To support a new display, you need to:
1. Add a display profile to `config/displays.json`
2. Test image processing with the new profile
3. Document the display specifications

## Display Profile Structure

```json
{
  "id": "unique_display_id",
  "name": "Human Readable Name",
  "description": "Description of the display",
  "width": 800,
  "height": 480,
  "palette": ["#000000", "#FFFFFF"],
  "manufacturer": "Display Manufacturer",
  "defaultDithering": "floyd-steinberg"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase, underscores) |
| `name` | string | Display name shown in UI |
| `description` | string | Brief description |
| `width` | number | Display width in pixels |
| `height` | number | Display height in pixels |
| `palette` | string[] | Supported colors in hex format |
| `manufacturer` | string | Display manufacturer |
| `defaultDithering` | string | Default dithering algorithm |

## Step-by-Step Guide

### 1. Research the Display

Find the following specifications:
- Resolution (width x height in pixels)
- Color capabilities (palette)
- Manufacturer documentation

### 2. Define the Palette

E-ink displays typically support limited palettes:

**Monochrome (2 colors)**:
```json
"palette": ["#000000", "#FFFFFF"]
```

**3-Color (Black/White/Red)**:
```json
"palette": ["#000000", "#FFFFFF", "#FF0000"]
```

**3-Color (Black/White/Yellow)**:
```json
"palette": ["#000000", "#FFFFFF", "#FFFF00"]
```

**7-Color Spectra**:
```json
"palette": ["#000000", "#FFFFFF", "#00FF00", "#0000FF", "#FF0000", "#FFFF00", "#FFA500"]
```

### 3. Add to Configuration

Edit `config/displays.json`:

```json
{
  "displays": [
    // ... existing displays
    {
      "id": "waveshare_4_2_bw",
      "name": "Waveshare 4.2\" (B/W)",
      "description": "Waveshare 4.2 inch black and white e-paper display",
      "width": 400,
      "height": 300,
      "palette": ["#000000", "#FFFFFF"],
      "manufacturer": "Waveshare",
      "defaultDithering": "floyd-steinberg"
    }
  ]
}
```

### 4. Test the Display

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Upload a test image

3. Select the new display type

4. Process and verify the output looks correct

### 5. Document the Display

Add documentation for the new display, including:
- Specifications
- Where to purchase
- Frame code example

## Example: Adding Waveshare 7.5" Display

### Display Specifications

- Resolution: 800x480 pixels
- Colors: Black, White, Red
- Manufacturer: Waveshare

### Configuration

```json
{
  "id": "waveshare_7_5_bwr",
  "name": "Waveshare 7.5\" (B/W/R)",
  "description": "Waveshare 7.5 inch black/white/red e-paper display",
  "width": 800,
  "height": 480,
  "palette": ["#000000", "#FFFFFF", "#FF0000"],
  "manufacturer": "Waveshare",
  "defaultDithering": "floyd-steinberg"
}
```

### Frame Code Example

```python
# MicroPython example for Waveshare 7.5" BWR
import urequests
import ujson

API_BASE = "https://your-domain.vercel.app"
DISPLAY_TYPE = "waveshare_7_5_bwr"

def get_image():
    url = f"{API_BASE}/api/current?display={DISPLAY_TYPE}"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    return API_BASE + data["data"]["imageUrl"]
```

## Display Naming Convention

Use the following format for display IDs:

```
{manufacturer}_{size}_{variant}
```

Examples:
- `inky_frame_7_spectra`
- `inky_frame_5_colour`
- `waveshare_4_2_bw`
- `waveshare_7_5_bwr`

## Testing Checklist

Before submitting a new display:

- [ ] Profile added to `config/displays.json`
- [ ] JSON is valid (no syntax errors)
- [ ] Resolution is correct
- [ ] Palette colors are accurate hex values
- [ ] Test image processed successfully
- [ ] Output looks appropriate for the display
- [ ] Documentation added

## Submitting Your Display

1. Fork the repository
2. Add the display profile
3. Test thoroughly
4. Create a pull request with:
   - Display specifications
   - Test results
   - Frame code example (if available)

## Common Display Specifications

### Pimoroni Inky Frame Series

| Model | Resolution | Colors |
|-------|------------|--------|
| Inky Frame 4" | 640x400 | 7 (Spectra) |
| Inky Frame 5.7" | 600x448 | 7 (Spectra) |
| Inky Frame 7.3" | 800x480 | 7 (Spectra) or 4 |

### Waveshare E-Paper Series

| Model | Resolution | Colors |
|-------|------------|--------|
| 4.2" | 400x300 | 2 (B/W) |
| 5.83" | 600x448 | 2 or 3 |
| 7.5" | 800x480 | 2 or 3 |

## Need Help?

- Check existing display profiles for examples
- Open a GitHub issue with display specifications
- Ask in GitHub Discussions





