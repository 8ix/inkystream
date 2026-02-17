<p align="center">
  <img src="public/inkstreamlogo.png" alt="InkyStream" width="400">
</p>

<p align="center">
  Transform your personal photos into beautifully dithered images optimized for e-ink displays.
</p>

---

InkyStream is an open-source application designed to run locally on a Raspberry Pi via Docker. It processes your photos into beautifully dithered images and serves device-ready feeds to your e-ink frames over your local network. Keeping it local means your images stay private—no cloud required. You can still adapt it to other hosts (e.g., Vercel), but the primary target is a self-hosted Pi.

## Features

- **Local Admin Interface** - Process and manage images through a beautiful web UI
- **Device Management** - Create named devices for each of your e-ink frames
- **Category Organization** - Organize images into categories with custom colors
- **Smart Image Fitting** - Auto-rotate and intelligently fit images to frames
- **Dithering Algorithms** - Floyd-Steinberg, Atkinson, and Ordered dithering
- **Image Enhancement** - Contrast boost, saturation, denoising, and sharpening
- **Multiple Display Support** - Pimoroni Inky Frame, Waveshare, and more
- **API Key Protection** - Secure your images with optional API key authentication
- **Docker-First on Raspberry Pi** - Run locally on your own hardware for privacy
- **Local-Only by Design** - No strict auth by default; intended for trusted LAN use
- **Optional Cloud** - Can be adapted to Vercel/other hosts if you add auth

## Quick Start

### Option 1: Docker Compose (Recommended)

The easiest way to deploy InkyStream with persistent storage and easy configuration.

```bash
# Clone the repository
git clone https://github.com/8ix/inkystream.git
cd inkystream

# Create environment file
cp .env.docker .env

# Start with Docker Compose
docker-compose up -d

# Access at http://your-server-ip:3000
```

For Portainer, Traefik, or other deployment options, see the [Docker Deployment Guide](DOCKER-DEPLOYMENT.md).

### Option 2: Docker CLI

For manual Docker deployment:

```bash
# Clone the repository
git clone https://github.com/8ix/inkystream.git
cd inkystream

# Build the image
docker build -t inkystream:latest .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  -v $(pwd)/images:/app/images \
  -v $(pwd)/config:/app/config \
  --name inkystream \
  inkystream:latest

# Access at http://your-server-ip:3000
```

**Note:** The Docker image uses `node:20-alpine` to avoid CVE-2023-45853. This is intended for a trusted local network. For public access, set `INKYSTREAM_API_KEY` and use HTTPS.

### Your First Image

1. Navigate to **Devices** and create a device (e.g., "Living Room Frame")
2. Select the display type that matches your e-ink hardware
3. Go to **Upload** and drag-and-drop an image
4. Select a category (e.g., "Landscapes")
5. Choose your device(s) to generate images for
6. Select a fit mode (Smart Fit recommended)
7. Click **Process**
8. View your processed image in the **Gallery**

### Optional: Adapt for Vercel/Cloud

The project is designed for local Pi hosting without strict auth. If you deploy to a public host, you must:

1. Set `INKYSTREAM_API_KEY` and enforce it on all endpoints you expose.
2. Add HTTPS and any network protections you need.
3. Consider moving `images/` to private storage and serving only via authenticated APIs.

## Security

InkyStream protects your personal photos with API key authentication.

### Security (local-first)

- On a trusted LAN/Raspberry Pi: API key is optional; leaving it unset means open access for local devices.
- If you expose the app beyond your LAN: set `INKYSTREAM_API_KEY` and require it on every endpoint you open.
- Images live in `images/` on your Pi; they are not public unless you expose the API.

### How It Works

- Images are stored in a **private directory** (not publicly accessible)
- All API endpoints require the API key when `INKYSTREAM_API_KEY` is set
- Images are served through `/api/img/` which validates the key
- Admin interface runs locally only (not deployed)

### Using the API Key

InkyStream never stores your API key in the repository. Configure it **only** via environment variables (e.g. `.env.local`, Vercel env vars, or Docker `.env`) and never commit those files.

Include the key in your requests:

```bash
# Query parameter (recommended for microcontrollers)
curl "https://your-domain.vercel.app/api/devices/my-frame/random?key=YOUR_API_KEY"

# Or Authorization header
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://your-domain.vercel.app/api/devices/my-frame/random"
```

## Project Structure

```
inkystream/
├── app/                    # Next.js application
│   ├── (admin)/           # Local-only admin pages
│   │   ├── upload/        # Image upload interface
│   │   ├── gallery/       # Gallery management
│   │   ├── categories/    # Category management
│   │   └── devices/       # Device management
│   └── api/               # API routes (deployed)
│       ├── devices/       # Device-specific endpoints
│       │   └── [deviceId]/
│       │       ├── current/   # Get current image
│       │       ├── next/      # Rotate to next image
│       │       └── random/    # Get random image
│       ├── img/           # Private image serving (auth required)
│       ├── categories/    # List/manage categories
│       └── displays/      # List display types
├── images/                # Private image storage (not in public/)
├── lib/                   # Shared libraries
├── config/                # Configuration files
├── components/            # React components
└── docs/                  # Documentation
```

## API Reference

### Authentication

All API endpoints require authentication when `INKYSTREAM_API_KEY` is set. For security, keep your key in environment variables and out of source control:

```bash
# Include key in query string (microcontrollers)
?key=YOUR_API_KEY

# Or use Authorization header (servers, higher-level clients)
Authorization: Bearer YOUR_API_KEY
```

### Device-Specific Endpoints

#### GET /api/devices/{deviceId}/random

Get a random image for a device.

```bash
curl "https://your-domain.vercel.app/api/devices/living-room-frame/random?key=YOUR_API_KEY"
```

#### GET /api/devices/{deviceId}/next

Rotate to the next image.

```bash
curl "https://your-domain.vercel.app/api/devices/living-room-frame/next?key=YOUR_API_KEY"
```

#### GET /api/devices/{deviceId}/current

Get the current image for a device.

```bash
curl "https://your-domain.vercel.app/api/devices/living-room-frame/current?key=YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "/api/img/landscapes/abc123/living-room-frame.png?key=YOUR_API_KEY",
    "imageId": "abc123",
    "categoryId": "landscapes",
    "deviceId": "living-room-frame"
  }
}
```

### Image Serving

Images are served through the authenticated `/api/img/` endpoint:

```bash
curl "https://your-domain.vercel.app/api/img/landscapes/abc123/living-room-frame.png?key=YOUR_API_KEY"
```

### Other Endpoints

```bash
# List all categories
curl "https://your-domain.vercel.app/api/categories?key=YOUR_API_KEY"

# List supported display types
curl "https://your-domain.vercel.app/api/displays?key=YOUR_API_KEY"
```

## Frame Configuration

### Pimoroni Inky Frame (MicroPython)

```python
import urequests
import ujson

API_BASE = "https://your-domain.vercel.app"
DEVICE_ID = "living-room-frame"
API_KEY = "YOUR_API_KEY"  # Keep this secret!

def get_image_url():
    url = f"{API_BASE}/api/devices/{DEVICE_ID}/random?key={API_KEY}"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    response.close()
    # Image URL already includes the API key
    return API_BASE + data["data"]["imageUrl"]

# Fetch and display the image
image_url = get_image_url()
```

See [Frame Configuration Guide](docs/user-guide/frame-configuration.md) for complete examples.

## Image Processing Options

### Fit Modes

- **Smart Fit** - Auto-rotates and chooses best fit to minimize cropping
- **Fill Frame (Cover)** - Fills entire frame, may crop edges
- **Fit Entire Image (Contain)** - Shows whole image with letterboxing

### Dithering Algorithms

- **Floyd-Steinberg** - Best for photos (recommended)
- **Atkinson** - Good for high-contrast images
- **Ordered** - Better for graphics with sharp edges

## Managing Content

### Categories

Manage categories through the **Categories** page:
- Add new categories with custom colors
- Edit category names and descriptions
- Delete empty categories

### Devices

Manage devices through the **Devices** page:
- Create devices for each e-ink frame
- Assign display profiles (resolution, color palette)
- Get API endpoint URLs

## Development

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Building

```bash
npm run build           # Production build
npm run lint            # Check linting
```

## Documentation

Full documentation is available in the `/docs` directory:

- [Docker Deployment Guide](DOCKER-DEPLOYMENT.md) - **Portainer, Traefik, and Docker Compose**
- [Getting Started](docs/user-guide/getting-started.md)
- [Local Development Setup](docs/setup/local-development.md)
- [Vercel Deployment](docs/setup/vercel-deployment.md)
- [API Reference](docs/architecture/api-endpoints.md)
- [Adding Display Support](docs/development/adding-displays.md)
- [Contributing](docs/development/contributing.md)

## Architecture

InkyStream uses a split architecture:

- **Local Only**: Admin interface (upload, gallery, categories, devices)
- **Deployed**: API routes and processed images

This ensures:
- Zero hosting costs (Vercel free tier)
- No public upload endpoints (security)
- Simple git-based deployment
- Protected image access with API keys

## Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/development/contributing.md).

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [Documentation](docs/README.md)
- [GitHub Issues](https://github.com/8ix/inkystream/issues)
- [GitHub Discussions](https://github.com/8ix/inkystream/discussions)

---

Made with ♥ for the e-ink community
