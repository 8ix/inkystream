# Deployment Strategy

InkyStream uses a unique split-deployment architecture to provide security, simplicity, and zero hosting costs.

## Architecture Overview

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│     LOCAL ONLY              │     │     DEPLOYED (Vercel)       │
├─────────────────────────────┤     ├─────────────────────────────┤
│ • Admin Dashboard           │     │ • /api/current              │
│ • Upload Interface          │     │ • /api/next                 │
│ • Gallery Management        │     │ • /api/categories           │
│ • Image Processing          │     │ • /api/displays             │
│ • Preview System            │     │ • /api/schedule             │
│                             │     │ • /public/images/*          │
└─────────────────────────────┘     └─────────────────────────────┘
```

## Why This Approach?

### Security Benefits

1. **No Public Upload Endpoints**: Attackers can't upload malicious files
2. **No Authentication Required**: Local-only access eliminates auth complexity
3. **Minimal Attack Surface**: Only read-only API endpoints are exposed
4. **No Database**: No SQL injection or data breach risks

### Cost Benefits

1. **Zero Hosting Costs**: Vercel free tier is sufficient
2. **No Database Fees**: File-based storage only
3. **No Auth Service Costs**: No third-party auth needed
4. **Predictable Scaling**: Static files scale infinitely on CDN

### Simplicity Benefits

1. **Simple Deployment**: Just `git push`
2. **No Server Management**: Serverless functions only
3. **Easy Rollback**: Git history provides versioning
4. **Portable**: Clone and run anywhere with Node.js

## Implementation Details

### Local-Only Routes

The admin interface uses Next.js route groups to organize pages:

```
app/
├── (admin)/              # Route group - parentheses mean no URL segment
│   ├── layout.tsx        # Admin layout with navigation
│   ├── page.tsx          # Dashboard (/)
│   ├── upload/
│   │   └── page.tsx      # Upload interface (/upload)
│   └── gallery/
│       └── page.tsx      # Gallery (/gallery)
└── api/                  # API routes (deployed)
```

### Blocking Admin Routes in Production

**next.config.js**:
```javascript
module.exports = {
  ...(process.env.VERCEL_ENV === 'production' && {
    async rewrites() {
      return {
        beforeFiles: [
          {
            source: '/((?!api/).*)',
            destination: '/api/404',
          },
        ],
      };
    },
  }),
};
```

**vercel.json**:
```json
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
```

This configuration:
1. Blocks all non-API routes in production
2. Redirects blocked routes to a 404 API response
3. Only applies when `VERCEL_ENV === 'production'`

### 404 Handler

```typescript
// app/api/404/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Not found - only API routes are available in production',
    },
    { status: 404 }
  );
}
```

## Deployment Workflow

### Initial Setup

1. Create Vercel account (free)
2. Connect GitHub repository
3. Deploy automatically on push

### Regular Updates

```bash
# 1. Make changes locally
npm run dev
# Upload and process new images

# 2. Commit changes
git add .
git commit -m "Added beach photos to landscapes"

# 3. Deploy
git push
# Vercel auto-deploys in ~30 seconds
```

### What Gets Deployed

**Included**:
- `/app/api/**` - All API routes
- `/public/**` - All static files including processed images
- `/config/**` - Configuration files

**Excluded by rewrites**:
- `/app/(admin)/**` - Admin interface pages
- Any non-API routes

## Vercel Configuration

### Free Tier Limits

| Resource | Limit |
|----------|-------|
| Bandwidth | 100GB/month |
| Serverless Function Execution | 100GB-Hrs/month |
| Deployments | Unlimited |
| Domains | Custom domains supported |

### Recommended Settings

1. **Framework Preset**: Next.js (auto-detected)
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

## Git Repository Management

### What to Commit

```gitignore
# .gitignore

# Don't commit
/node_modules
/.next
/uploads/           # Raw uploaded files
/raw-images/        # Source images
.env.local

# DO commit
!/public/images/    # Processed images
!/config/           # Configuration
```

### Large Collections

For repositories with many images, consider Git LFS:

```bash
# Install Git LFS
git lfs install

# Track PNG files in images directory
git lfs track "public/images/**/*.png"

# Commit .gitattributes
git add .gitattributes
git commit -m "Configure Git LFS for images"
```

## Testing the Deployment

### Verify API Endpoints

```bash
# Should return categories
curl https://your-domain.vercel.app/api/categories

# Should return 404
curl https://your-domain.vercel.app/upload
```

### Verify Images

```bash
# Should return image
curl -I https://your-domain.vercel.app/images/landscapes/img001/inky_frame_7_spectra.png
```

## Troubleshooting

### Admin Pages Accessible in Production

1. Check `vercel.json` rewrites are correct
2. Verify `VERCEL_ENV` is set (automatic on Vercel)
3. Redeploy: `vercel --prod`

### Images Not Loading

1. Verify images are committed to git
2. Check file paths match API responses
3. Ensure files aren't ignored by `.gitignore`

### API Returns 500

1. Check Vercel function logs
2. Verify all dependencies are in `package.json`
3. Test locally with `npm run build && npm start`




