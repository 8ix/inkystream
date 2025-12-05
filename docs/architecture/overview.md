# System Architecture Overview

InkyStream uses a unique split architecture: a local-only admin interface for image processing and a deployed API for serving images to e-ink frames.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOCAL MACHINE                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Local Admin Application (Next.js)              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │   Upload     │  │   Gallery    │  │    Dashboard     │  │ │
│  │  │   Interface  │  │   Manager    │  │    (Stats)       │  │ │
│  │  └──────┬───────┘  └──────────────┘  └──────────────────┘  │ │
│  │         │                                                    │ │
│  │         ▼                                                    │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │           Image Processing Pipeline                   │   │ │
│  │  │  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │   │ │
│  │  │  │ Resize  │→ │ Dither   │→ │ Save to public/    │  │   │ │
│  │  │  └─────────┘  └──────────┘  └────────────────────┘  │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Git Repository                           │ │
│  │  ┌───────────────────┐  ┌────────────────────────────────┐ │ │
│  │  │ public/images/    │  │ config/                         │ │ │
│  │  │ (processed imgs)  │  │ (categories, displays)          │ │ │
│  │  └───────────────────┘  └────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ git push
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (Production)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     API Routes Only                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │ /api/current │  │ /api/next    │  │ /api/categories  │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │          Static Images (CDN cached)                   │   │ │
│  │  │          public/images/[category]/[id]/              │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      E-INK FRAMES                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │  Inky Frame 7  │  │  Inky Frame 5  │  │   Other Frames     │ │
│  │  (Spectra)     │  │  (Colour)      │  │   (Future)         │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Local Admin Application

**Purpose**: Process photos and manage image library locally

**Key Features**:
- Web-based GUI at `http://localhost:3000`
- Drag-and-drop image upload
- Category management
- Gallery organization
- Display preview
- Processing configuration

**Never Deployed**: Runs only on user's machine for security

### 2. Image Processing Pipeline

**Purpose**: Transform photos for e-ink display

**Process**:
1. Accept uploaded image (JPEG, PNG, WebP)
2. Resize to display dimensions
3. Apply dithering algorithm
4. Generate variants for each display type
5. Save to `public/images/[category]/[image_id]/`
6. Create metadata.json

See [Image Processing](./image-processing.md) for details.

### 3. API Layer

**Purpose**: Serve processed images to e-ink frames

**Deployment**: Only `/api` routes deployed to Vercel

**Endpoints**:
- `GET /api/current` - Current image for display/category
- `GET /api/next` - Rotate to next image
- `GET /api/random` - Random image from category
- `GET /api/categories` - List categories
- `GET /api/displays` - List display types

See [API Endpoints](./api-endpoints.md) for full specifications.

### 4. Configuration System

**Categories** (`config/categories.json`):
- Define image categories
- Assign colors for UI
- Organize image library

**Displays** (`config/displays.json`):
- Define e-ink display profiles
- Specify dimensions and color palettes
- Configure dithering defaults

## Data Flow

### Upload Flow

```
User → Upload UI → Temp Storage → Processing → public/images/ → Git Commit
```

### API Request Flow

```
E-ink Frame → Vercel API → Read metadata → Serve image from CDN
```

### Deployment Flow

```
Local Changes → Git Add → Git Commit → Git Push → Vercel Auto-deploy
```

## Key Design Decisions

### Why Local-Only Admin?

1. **Security**: No public upload endpoints = no attack surface
2. **Simplicity**: No authentication required
3. **Cost**: Zero hosting costs for admin interface
4. **Control**: Full control over what gets committed/deployed

### Why Git-Based Storage?

1. **Version Control**: Track changes to image library
2. **Free Hosting**: Vercel serves static files from git
3. **Backup**: Git history serves as backup
4. **Rollback**: Easy to revert to previous states

### Why Vercel?

1. **Free Tier**: Generous bandwidth (100GB/month)
2. **Global CDN**: Fast image delivery worldwide
3. **Auto-deploy**: Push to deploy workflow
4. **HTTPS**: Automatic SSL certificates

## Security Model

See [Deployment Strategy](./deployment-strategy.md) for security details.

