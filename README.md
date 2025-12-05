<p align="center">
  <img src="public/inkstreamlogo.png" alt="InkyStream" width="400">
</p>

<p align="center">
  Transform your personal photos into beautifully dithered images optimized for e-ink displays.
</p>

---

InkyStream is an open-source application that helps you process and serve images to e-ink photo frames like the Pimoroni Inky Frame. Run the admin interface locally to process images, then deploy only the API to Vercel's free tier.

## Features

- **Local Admin Interface** - Process and manage images through a beautiful web UI
- **Device Management** - Create named devices for each of your e-ink frames
- **Category Organization** - Organize images into categories with custom colors
- **Smart Image Fitting** - Auto-rotate and intelligently fit images to frames
- **Dithering Algorithms** - Floyd-Steinberg, Atkinson, and Ordered dithering
- **Image Enhancement** - Contrast boost, saturation, denoising, and sharpening
- **Multiple Display Support** - Pimoroni Inky Frame, Waveshare, and more
- **API Key Protection** - Secure your images with optional API key authentication
- **Zero Hosting Costs** - Deploy to Vercel's free tier
- **Simple Deployment** - Just `git push` to deploy updates

## Quick Start

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Vercel Account** - [Sign up (free)](https://vercel.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/8ix/inkystream.git
cd inkystream

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the admin interface.

### Your First Image

1. Navigate to **Devices** and create a device (e.g., "Living Room Frame")
2. Select the display type that matches your e-ink hardware
3. Go to **Upload** and drag-and-drop an image
4. Select a category (e.g., "Landscapes")
5. Choose your device(s) to generate images for
6. Select a fit mode (Smart Fit recommended)
7. Click **Process**
8. View your processed image in the **Gallery**

### Deploy to Vercel

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New** → **Project**
4. Select your InkyStream repository
5. **Add environment variable**: `INKYSTREAM_API_KEY` = your secure key (see [Security](#security))
6. Click **Deploy**

Your API is now live! Update images with:

```bash
git add .
git commit -m "Added new photos"
git push
```

## Security

InkyStream protects your personal photos with API key authentication.

### Setting Up API Key

1. **Generate a secure key** (32+ characters recommended):
   ```bash
   openssl rand -base64 32
   ```

2. **For Vercel deployment**:
   - Go to your project settings on Vercel
   - Navigate to **Environment Variables**
   - Add `INKYSTREAM_API_KEY` with your key
   - Redeploy

3. **For local development** (optional):
   - Copy `.env.example` to `.env.local`
   - Set `INKYSTREAM_API_KEY=your-key`
   - Or leave empty for open access during development

### How It Works

- Images are stored in a **private directory** (not publicly accessible)
- All API endpoints require the API key when `INKYSTREAM_API_KEY` is set
- Images are served through `/api/img/` which validates the key
- Admin interface runs locally only (not deployed)

### Using the API Key

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

All API endpoints require authentication when `INKYSTREAM_API_KEY` is set:

```bash
# Include key in query string
?key=YOUR_API_KEY

# Or use Authorization header
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

### Enhancement Options

- **Auto Contrast** - Automatically adjust levels
- **Saturation Boost** - Make colors more vivid for e-ink
- **Noise Reduction** - Reduce speckling in gradients
- **Sharpening** - Restore edge clarity

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
