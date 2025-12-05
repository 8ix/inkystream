# Vercel Deployment Guide

Deploy InkyStream to Vercel's free hobby tier. Only the API routes and processed images are deployed - the admin interface runs locally only.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free)
- A [GitHub account](https://github.com/signup)
- InkyStream repository pushed to GitHub

## Deployment Architecture

InkyStream uses a unique deployment strategy:

- **Local Only**: Admin interface (`/upload`, `/gallery`, dashboard)
- **Deployed**: API routes (`/api/*`) and processed images (`/public/images/`)

This ensures:
- Zero hosting costs (Vercel free tier)
- No public access to admin functions
- Simple git-based deployment workflow

## Step-by-Step Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial InkyStream setup"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Select your InkyStream repository
4. Click **"Deploy"**

Vercel will automatically:
- Detect the Next.js framework
- Build the project
- Deploy only the API routes

### 3. Configure Domain (Optional)

1. In your Vercel project, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `inkystream.co.uk`)
3. Follow Vercel's DNS configuration instructions

## Deployment Workflow

After initial setup, deploying updates is simple:

```bash
# Process new images locally using the admin interface
npm run dev
# Upload and process images at http://localhost:3000

# Commit and deploy
git add .
git commit -m "Added new landscape photos"
git push
# Vercel auto-deploys in ~30 seconds
```

## Vercel Configuration

InkyStream includes a `vercel.json` configuration file that:

1. **Blocks admin routes** in production
2. **Configures API function timeouts**
3. **Optimizes static asset delivery**

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

## Testing Your Deployment

After deployment, test your API endpoints:

```bash
# List categories
curl https://your-domain.vercel.app/api/categories

# List display types
curl https://your-domain.vercel.app/api/displays

# Get current image for a display
curl "https://your-domain.vercel.app/api/current?display=inky_frame_7_spectra&category=landscapes"
```

## Troubleshooting

### Build Fails

1. Check the Vercel build logs
2. Ensure all dependencies are in `package.json`
3. Test locally with `npm run build`

### Images Not Showing

1. Verify images are committed to `public/images/`
2. Check the category and display parameters in your API calls
3. Ensure images are processed for the requested display type

### API Returns 404

1. Verify the route exists in `app/api/`
2. Check for typos in the endpoint URL
3. Review `vercel.json` rewrites

## Free Tier Limits

Vercel's hobby tier includes:

- **100GB bandwidth/month** - Sufficient for most personal use
- **Unlimited deployments**
- **Automatic HTTPS**
- **Global CDN**

For larger collections, consider Git LFS for image storage.

## Next Steps

- [Configure your e-ink frame](../user-guide/frame-configuration.md)
- [API endpoint reference](../architecture/api-endpoints.md)

