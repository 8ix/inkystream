InkyStream Project Brief (Revised)
Executive Summary
InkyStream is an open-source application that transforms personal photography collections into beautifully dithered images optimised for e-ink displays. Users run a local Next.js application to process and manage their images, then deploy only the API and processed images to Vercel's free tier via simple git commands. The system supports multiple e-ink frame models and operates entirely without ongoing costs.
Project Overview
Vision
Create a seamless bridge between digital photography and e-ink displays, making it effortless for hobbyists to showcase their photos on energy-efficient e-paper frames.
Core Concept

Local Next.js application for image processing and management (never deployed)
Processed images committed to repository
API-only deployment to Vercel (free hobby tier)
Simple git push workflow for updates
No authentication needed (local admin only)
Category-based image organisation from the start

Domain
inkystream.co.uk (already purchased)
Technical Architecture
System Components
1. Local Admin Application (Next.js)

Purpose: Process photos and manage image library locally
Never Deployed: Runs only on user's machine
Key Features:

Web-based GUI for image upload and processing
Category management interface
Gallery organisation tools
Batch image processing with progress indicators
Preview how images appear on different displays
Schedule configuration
One-click processing pipeline



2. API Layer (Vercel Deployment)

Purpose: Serve processed images to frames
Deployment: Only /api routes and /public/images deployed
Endpoints:

GET /api/current?display={type}&category={category} - Current image
GET /api/next?display={type}&category={category} - Rotate to next
GET /api/random?display={type}&category={category} - Random from category
GET /api/categories - List available categories
GET /api/displays - List supported display types
GET /api/schedule - Get rotation schedule



3. Build Configuration

Critical: Vercel config prevents admin UI deployment
Only deploys: API routes and processed images
Excludes: Admin pages, processing tools, upload interfaces

File Structure
inkystream/
├── app/                      # Next.js application
│   ├── (admin)/             # Local-only admin pages (excluded from deploy)
│   │   ├── upload/
│   │   ├── gallery/
│   │   ├── preview/
│   │   └── settings/
│   ├── api/                 # API routes (deployed to Vercel)
│   │   ├── current/
│   │   ├── next/
│   │   ├── categories/
│   │   └── displays/
│   └── layout.js
├── lib/                     # Shared libraries
│   ├── processors/          # Dithering algorithms
│   ├── displays/            # Display profiles
│   └── utils/
├── public/                  # Static files (deployed)
│   └── images/             # Processed images
│       └── [category]/     # Category folders
│           └── [image_id]/
│               ├── inky_frame_7_spectra.png
│               ├── inky_frame_7_colour.png
│               └── metadata.json
├── config/
│   ├── displays.json       # Display configurations
│   └── categories.json     # Category definitions
├── .gitignore
├── next.config.js          # Crucial deployment config
├── vercel.json            # Deployment rules
├── package.json
└── README.md              # Setup instructions
Category System
json// config/categories.json
{
  "categories": [
    {
      "id": "landscapes",
      "name": "Landscapes",
      "description": "Nature and scenic views",
      "colour": "#228B22"
    },
    {
      "id": "family",
      "name": "Family",
      "description": "Family photos and memories",
      "colour": "#FFB6C1"
    },
    {
      "id": "art",
      "name": "Art",
      "description": "Artistic and abstract images",
      "colour": "#9370DB"
    }
  ]
}
Deployment Strategy
Local Setup Workflow

Clone Repository

bash   git clone https://github.com/[user]/inkystream
   cd inkystream

Install Dependencies

bash   npm install

Run Local Admin

bash   npm run dev
   # Opens http://localhost:3000

Process Images

Use web interface at localhost:3000
Upload images via drag-and-drop
Assign categories
Configure processing options
Images automatically saved to /public/images/[category]/


Deploy Updates

bash   git add .
   git commit -m "Added new landscape photos"
   git push
   # Vercel auto-deploys API only
Vercel Configuration
javascript// next.config.js
module.exports = {
  // Exclude admin routes from production build
  exportPathMap: async function (defaultPathMap) {
    if (process.env.VERCEL_ENV === 'production') {
      // Only export API routes for production
      const paths = {}
      Object.keys(defaultPathMap).forEach((path) => {
        if (path.startsWith('/api/')) {
          paths[path] = defaultPathMap[path]
        }
      })
      return paths
    }
    return defaultPathMap
  }
}
json// vercel.json
{
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/api/404"
    }
  ]
}
Local Admin Interface Features
Dashboard

Overview of image library
Category statistics
Recent uploads
Processing queue status

Upload & Processing

Drag-and-drop upload area
Batch processing with progress bars
Processing options:

Display type selection
Dithering algorithm choice
Contrast/brightness/saturation adjustment
Crop positioning
Category assignment



Gallery Management

Category view with thumbnails
Bulk operations:

Move between categories
Delete images
Reprocess with different settings


Metadata editing
Search and filter tools

Preview Mode

Simulate display appearance
Side-by-side comparisons
Before/after processing view
Different display type previews

Settings

Display profiles configuration
Category management
Rotation schedules
Processing defaults

README Structure
Key Sections
markdown# InkyStream

Transform your photos into beautiful e-ink art.

## Prerequisites
- Node.js 18+ installed
- Git installed
- Vercel account (free)
- Basic command line knowledge

## Quick Start

### 1. Local Setup
[Step-by-step instructions with screenshots]

### 2. First Run
- Starting the local admin
- Processing your first image
- Understanding categories

### 3. Deployment
- Setting up Vercel (free hobby tier)
- Connecting your repository
- First deployment

### 4. Frame Configuration
- Example code for different frames
- API endpoint reference

## Important Notes

⚠️ **Security**: The admin interface runs ONLY locally. 
Never attempt to deploy it publicly.

⚠️ **Git Size**: Processed images are stored in the repo. 
Consider using Git LFS for large collections.

## Troubleshooting
[Common issues and solutions]

## Community
[Links to discussions, issues, etc.]
User Workflows
Initial Setup (One-time)

Clone repository
Install dependencies: npm install
Run locally: npm run dev
Open browser to http://localhost:3000
Configure display types and categories
Connect to Vercel (following README guide)

Adding Images (Regular workflow)

Start local admin: npm run dev
Navigate to Upload page
Drag images onto upload area
Select category
Configure processing options
Click "Process"
Review previews
When ready: git add . && git commit -m "Added photos" && git push

Frame Configuration
python# Simple config on frame
DISPLAY_TYPE = "inky_frame_7_spectra"
API_BASE = "https://inkystream.co.uk"
REFRESH_HOURS = 6
CATEGORY = "landscapes"  # Optional filter
Technical Stack
Frontend (Local Only)

Next.js 14+ - Full-stack framework
React - UI components
Tailwind CSS - Styling
Shadcn/ui - Component library
React Dropzone - File uploads

Image Processing

Sharp - High-performance image processing
Canvas API - Browser-based preview generation
Web Workers - Non-blocking processing

API (Deployed)

Vercel Serverless Functions - API endpoints
No database - File system based
Edge caching - Performance optimisation

Development Phases
Phase 1: MVP (Week 1-2)

 Next.js project structure
 Basic local admin UI
 Image upload and processing
 Category system
 Simple API endpoints
 Vercel deployment config
 Basic README

Phase 2: Core Features (Week 3-4)

 Full admin interface
 Multiple dithering algorithms
 Batch processing
 All Inky Frame sizes support
 Preview system
 Comprehensive categories

Phase 3: Polish (Week 5-6)

 Progress indicators
 Drag-and-drop enhancements
 Advanced scheduling options
 Performance optimisation
 Error handling
 Detailed README with screenshots

Phase 4: Community Ready (Week 7-8)

 Video tutorial
 Example frame implementations
 Troubleshooting guide
 Contribution guidelines
 Display profile templates

Important Security Considerations
Admin Interface

Never deployed online
No authentication needed (local only)
Build config explicitly excludes admin routes
Vercel config blocks non-API routes

API Security

Read-only endpoints
No upload capability
No modification endpoints
Rate limiting via Vercel

Success Metrics
Technical

Setup time < 10 minutes
Image processing < 2 seconds per image
API response time < 100ms
Zero monthly hosting costs

User Experience

Intuitive drag-and-drop interface
Clear visual feedback
Comprehensive documentation
Working example code for all frame types

Git Considerations
Repository Size Management
gitignore# Keep original images local only
/uploads/
/raw-images/

# But track processed images
!/public/images/
```

### Git LFS (for large collections)
```
# .gitattributes
public/images/**/*.png filter=lfs diff=lfs merge=lfs -text
Budget
Required Costs

Domain: £10/year (already purchased)

Free Services

Vercel Hobby Tier: 100GB bandwidth/month
GitHub: Unlimited public repos
Development: Local only

Optional

Git LFS: For collections >1GB
Custom domain email: £5/month

Success Criteria
The project will be considered successful when:

Fully functional local admin interface
Reliable API serving to frames
Support for all Inky Frame variants
Clear documentation with video tutorial
10+ successful community deployments
Featured in Pimoroni community showcase


This architecture ensures maximum simplicity for users whilst maintaining security and zero hosting costs. The local-only admin interface eliminates complexity whilst the git-based deployment makes updates as simple as push-to-deploy.