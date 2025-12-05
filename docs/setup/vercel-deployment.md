# Vercel Deployment Guide

Deploy InkyStream to Vercel's free hobby tier. Only the API routes and processed images are deployed - the admin interface runs locally only.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free)
- A [GitHub account](https://github.com/signup)
- InkyStream repository pushed to GitHub

## Deployment Architecture

InkyStream uses a unique deployment strategy:

- **Local Only**: Admin interface (`/upload`, `/gallery`, `/devices`, `/categories`)
- **Deployed**: API routes (`/api/*`) and processed images (`/images/`)
- **Protected**: API key authentication prevents unauthorized access

This ensures:
- Zero hosting costs (Vercel free tier)
- No public access to admin functions
- Protected image access with API keys
- Simple git-based deployment workflow

## Step-by-Step Deployment

### 1. Generate an API Key

Create a secure random key to protect your API:

```bash
# On macOS/Linux
openssl rand -base64 32

# Example output: xK7pQ2mN9rY4sT6uV8wX0zA3bC5dE7fG
```

Save this key securely - you'll need it for both Vercel and your e-ink frames.

### 2. Push to GitHub

```bash
git add .
git commit -m "Initial InkyStream setup"
git push origin main
```

### 3. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Select your InkyStream repository

### 4. Configure Environment Variables

**Before clicking Deploy**, add the API key:

1. Expand **"Environment Variables"**
2. Add variable:
   - **Name**: `INKYSTREAM_API_KEY`
   - **Value**: Your generated key
3. Click **"Deploy"**

Vercel will automatically:
- Detect the Next.js framework
- Build the project
- Deploy only the API routes

### 5. Configure Domain (Optional)

1. In your Vercel project, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `inkystream.yourdomain.com`)
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

## Security Configuration

### API Key Protection

InkyStream uses API key authentication to protect your images:

| Component | Protection |
|-----------|------------|
| Device endpoints | API key required |
| Image serving (`/api/img/`) | API key required |
| Categories list | API key required |
| Displays list | API key required |
| Admin interface | Not deployed (local only) |

### How Authentication Works

1. **Without API key set**: All endpoints are open (development mode)
2. **With API key set**: All endpoints require the key

Clients can provide the key via:

```bash
# Query parameter (easiest for microcontrollers)
curl "https://your-domain/api/devices/my-frame/random?key=YOUR_KEY"

# Authorization header
curl -H "Authorization: Bearer YOUR_KEY" "https://your-domain/api/devices/my-frame/random"
```

### Updating the API Key

If you need to change your API key:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Update `INKYSTREAM_API_KEY`
4. **Redeploy** your project (or push a new commit)
5. Update all your e-ink frames with the new key

## Testing Your Deployment

After deployment, test your API endpoints:

```bash
# Replace with your domain and API key
DOMAIN="https://your-domain.vercel.app"
KEY="your-api-key"

# Test authentication
curl "$DOMAIN/api/displays?key=$KEY"

# Get random image for a device
curl "$DOMAIN/api/devices/living-room-frame/random?key=$KEY"

# Test without key (should return 401)
curl "$DOMAIN/api/devices/living-room-frame/random"
```

Expected unauthorized response:
```json
{
  "success": false,
  "error": "Unauthorized. API key required.",
  "hint": "Include ?key=YOUR_API_KEY in the URL or Authorization: Bearer YOUR_API_KEY header"
}
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

## Troubleshooting

### Build Fails

1. Check the Vercel build logs
2. Ensure all dependencies are in `package.json`
3. Test locally with `npm run build`

### 401 Unauthorized Errors

1. Verify `INKYSTREAM_API_KEY` is set in Vercel environment variables
2. Check that you're including the key in requests
3. Ensure you've redeployed after adding the environment variable

### Images Not Showing

1. Verify images are committed to `images/` directory
2. Check you're using the correct device ID
3. Ensure the API key is included in image requests
4. Check that images are processed for the requested device

### API Returns 404

1. Verify the device ID exists
2. Check for typos in the endpoint URL
3. Review `vercel.json` rewrites

## Free Tier Limits

Vercel's hobby tier includes:

- **100GB bandwidth/month** - Sufficient for most personal use
- **Unlimited deployments**
- **Automatic HTTPS**
- **Global CDN**

For larger collections, consider Git LFS for image storage.

## Security Best Practices

1. **Use a strong API key** - 32+ random characters
2. **Keep your key secret** - Don't commit it to git
3. **Use environment variables** - Both locally and on Vercel
4. **Rotate keys periodically** - Update Vercel and all frames
5. **Use HTTPS only** - Vercel provides this automatically

## Next Steps

- [Configure your e-ink frame](../user-guide/frame-configuration.md)
- [API endpoint reference](../architecture/api-endpoints.md)
