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
- **Multiple Display Support** - Optimized for various e-ink displays (Inky Frame 7", etc.)
- **Category Organization** - Organize images into categories for different frames
- **Dithering Algorithms** - Floyd-Steinberg, Atkinson, and Ordered dithering
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
git clone https://github.com/yourusername/inkystream.git
cd inkystream

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the admin interface.

### Your First Image

1. Navigate to **Upload** in the admin interface
2. Drag and drop an image
3. Select a category (e.g., "Landscapes")
4. Choose display types to generate
5. Click **Process**
6. View your processed image in the **Gallery**

### Deploy to Vercel

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New** → **Project**
4. Select your InkyStream repository
5. Click **Deploy**

Your API is now live! Update images with:

```bash
git add .
git commit -m "Added new photos"
git push
```

## Project Structure

```
inkystream/
├── app/                    # Next.js application
│   ├── (admin)/           # Local-only admin pages
│   │   ├── upload/        # Image upload interface
│   │   └── gallery/       # Gallery management
│   └── api/               # API routes (deployed)
│       ├── current/       # Get current image
│       ├── next/          # Rotate to next image
│       ├── random/        # Get random image
│       ├── categories/    # List categories
│       └── displays/      # List display types
├── lib/                   # Shared libraries
│   ├── processors/        # Dithering algorithms
│   ├── displays/          # Display profiles
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── config/                # Configuration
│   ├── categories.json    # Category definitions
│   └── displays.json      # Display profiles
├── public/images/         # Processed images
├── components/            # React components
└── docs/                  # Documentation
```

## API Reference

### GET /api/current

Get the current image for a display.

```bash
curl "https://your-domain.vercel.app/api/current?display=inky_frame_7_spectra&category=landscapes"
```

**Response:**
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

### GET /api/next

Rotate to the next image.

```bash
curl "https://your-domain.vercel.app/api/next?display=inky_frame_7_spectra"
```

### GET /api/random

Get a random image.

```bash
curl "https://your-domain.vercel.app/api/random?display=inky_frame_7_spectra"
```

### GET /api/categories

List all categories.

```bash
curl "https://your-domain.vercel.app/api/categories"
```

### GET /api/displays

List supported display types.

```bash
curl "https://your-domain.vercel.app/api/displays"
```

## Frame Configuration

### Pimoroni Inky Frame (MicroPython)

```python
import urequests
import ujson

API_BASE = "https://your-domain.vercel.app"
DISPLAY_TYPE = "inky_frame_7_spectra"
CATEGORY = "landscapes"

def get_image_url():
    url = f"{API_BASE}/api/current?display={DISPLAY_TYPE}&category={CATEGORY}"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    return API_BASE + data["data"]["imageUrl"]

# Fetch and display the image
image_url = get_image_url()
```

## Configuration

### Categories

Edit `config/categories.json`:

```json
{
  "categories": [
    {
      "id": "landscapes",
      "name": "Landscapes",
      "description": "Nature and scenic views",
      "colour": "#228B22"
    }
  ]
}
```

### Display Profiles

Edit `config/displays.json`:

```json
{
  "displays": [
    {
      "id": "inky_frame_7_spectra",
      "name": "Inky Frame 7.3\" (Spectra)",
      "width": 800,
      "height": 480,
      "palette": ["#000000", "#FFFFFF", "#00FF00", "#0000FF", "#FF0000", "#FFFF00", "#FFA500"],
      "manufacturer": "Pimoroni",
      "defaultDithering": "floyd-steinberg"
    }
  ]
}
```

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

- **Local Only**: Admin interface (upload, gallery, dashboard)
- **Deployed**: API routes and processed images

This ensures:
- Zero hosting costs (Vercel free tier)
- No public upload endpoints (security)
- Simple git-based deployment

## Security

- Admin interface runs **locally only**
- API endpoints are **read-only**
- No authentication required (local admin)
- Vercel rewrites block non-API routes in production

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
- [GitHub Issues](https://github.com/yourusername/inkystream/issues)
- [GitHub Discussions](https://github.com/yourusername/inkystream/discussions)

---

Made with ♥ for the e-ink community

