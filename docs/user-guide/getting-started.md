# Getting Started with InkyStream

Welcome to InkyStream! This guide will walk you through setting up and using InkyStream for the first time.

## What is InkyStream?

InkyStream transforms your personal photos into beautifully dithered images optimized for e-ink displays. It's perfect for:

- Displaying family photos on e-ink frames
- Showcasing landscape photography
- Creating rotating art displays
- Any creative use of e-ink displays

## Quick Start Overview

1. **Set up locally** - Run InkyStream on your computer
2. **Upload images** - Add your photos through the web interface
3. **Process images** - Convert them for your e-ink display
4. **Deploy to Vercel** - Make images accessible to your frames
5. **Configure frames** - Point your e-ink frames to the API

## Prerequisites

Before starting, make sure you have:

- [ ] **Node.js 18+** installed ([download](https://nodejs.org/))
- [ ] **Git** installed ([download](https://git-scm.com/))
- [ ] A **GitHub account** ([sign up](https://github.com/))
- [ ] A **Vercel account** ([sign up](https://vercel.com/) - free)

Verify your installations:
```bash
node --version  # Should show 18.x or higher
git --version   # Any recent version
```

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/inkystream.git

# Enter the directory
cd inkystream

# Install dependencies
npm install
```

## Step 2: Start the Local Admin

```bash
npm run dev
```

Open your browser to [http://localhost:3000](http://localhost:3000)

You should see the InkyStream dashboard.

## Step 3: Explore the Interface

### Dashboard
The main dashboard shows:
- Total images in your library
- Images per category
- Recent processing activity

### Upload Page
Navigate to **Upload** to add new images:
- Drag and drop images
- Select a category
- Choose display types
- Process images

### Gallery Page
Navigate to **Gallery** to manage your images:
- View all processed images
- Filter by category
- See processing details

## Step 4: Upload Your First Image

1. Click **Upload** in the navigation
2. Drag a photo onto the upload area (or click to browse)
3. Select a **Category** (e.g., "Landscapes")
4. Choose **Display Types** to generate
5. Click **Process**
6. Wait for processing to complete
7. View your processed image in the Gallery

## Step 5: Deploy to Vercel

### First-time Setup

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial setup with processed images"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New** → **Project**
4. Select your InkyStream repository
5. Click **Deploy**

Your API is now live at `https://your-project.vercel.app`

### Subsequent Updates

After processing new images:
```bash
git add .
git commit -m "Added new photos"
git push
```

Vercel automatically deploys updates.

## Step 6: Configure Your E-ink Frame

### API Endpoints

Your frame needs to call the InkyStream API:

- **Current image**: `GET /api/current?display={type}&category={category}`
- **Next image**: `GET /api/next?display={type}&category={category}`
- **Random image**: `GET /api/random?display={type}&category={category}`

### Example Frame Code

```python
# MicroPython for Pimoroni Inky Frame
import urequests
import ujson

API_BASE = "https://your-project.vercel.app"
DISPLAY = "inky_frame_7_spectra"
CATEGORY = "landscapes"

def get_image_url():
    url = f"{API_BASE}/api/current?display={DISPLAY}&category={CATEGORY}"
    response = urequests.get(url)
    data = ujson.loads(response.text)
    return API_BASE + data["data"]["imageUrl"]

# Use the URL to download and display the image
image_url = get_image_url()
```

See [Frame Configuration](./frame-configuration.md) for complete examples.

## What's Next?

Now that you're set up:

- [Upload more images](./uploading-images.md)
- [Organize your gallery](./gallery-management.md)
- [Configure frame rotation](./frame-configuration.md)
- [Add new display types](../development/adding-displays.md)

## Troubleshooting

### "npm install" fails
- Make sure Node.js 18+ is installed
- Try `npm cache clean --force`
- Delete `node_modules` and try again

### Images don't appear on frame
- Verify your API URL is correct
- Check the display type parameter matches your frame
- Test the API in a browser first

### Deployment fails
- Check Vercel build logs
- Ensure all files are committed to git
- Verify package.json has all dependencies

See the full [Troubleshooting Guide](../setup/troubleshooting.md) for more help.

## Need Help?

- Check the [Documentation](../README.md)
- Search [GitHub Issues](https://github.com/yourusername/inkystream/issues)
- Ask in [GitHub Discussions](https://github.com/yourusername/inkystream/discussions)

