# Local Development Setup

This guide walks you through setting up InkyStream for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **npm** - Comes bundled with Node.js

Verify your installations:

```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
git --version   # Any recent version
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/inkystream.git
cd inkystream
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js 14+ (React framework)
- Sharp (image processing)
- Tailwind CSS (styling)
- React Dropzone (file uploads)

### 3. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
inkystream/
├── app/                  # Next.js application
│   ├── (admin)/         # Local-only admin interface
│   │   ├── upload/      # Image upload page
│   │   └── gallery/     # Gallery management
│   └── api/             # API routes (deployed to Vercel)
├── lib/                  # Shared libraries
│   ├── processors/      # Dithering algorithms
│   ├── displays/        # Display profiles
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── config/              # Configuration files
│   ├── categories.json  # Category definitions
│   └── displays.json    # Display profiles
├── public/images/       # Processed images (tracked in git)
├── components/          # React components
└── docs/               # Documentation
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

## Configuration

### Categories

Edit `config/categories.json` to add or modify image categories:

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

Edit `config/displays.json` to add support for new e-ink displays. See the [Adding Displays](../development/adding-displays.md) guide for details.

## Next Steps

- [Upload your first image](../user-guide/uploading-images.md)
- [Deploy to Vercel](./vercel-deployment.md)
- [Configure your e-ink frame](../user-guide/frame-configuration.md)




