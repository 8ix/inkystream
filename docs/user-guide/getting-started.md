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
2. **Create a device** - Register your e-ink frame
3. **Upload images** - Add your photos through the web interface
4. **Process images** - Convert them for your e-ink display
5. **Deploy to Vercel** - Make images accessible to your frames
6. **Configure frames** - Point your e-ink frames to the API

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
git clone https://github.com/8ix/inkystream.git

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

You should see the InkyStream dashboard with a vibrant purple theme.

## Step 3: Explore the Interface

### Dashboard
The main dashboard shows:
- Total images in your library
- Number of categories and devices
- Recent uploads
- Quick access to upload

### Devices Page
Navigate to **Devices** to manage your e-ink frames:
- Create devices for each frame
- Assign display profiles
- View API endpoints

### Categories Page
Navigate to **Categories** to organize your images:
- Create custom categories
- Set colors for visual organization
- View image counts

### Upload Page
Navigate to **Upload** to add new images:
- Drag and drop images
- Select a category
- Choose devices to generate for
- Configure fit mode and enhancements
- Process images

### Gallery Page
Navigate to **Gallery** to manage your images:
- View all processed images
- Filter by category or device
- See processing details
- Delete images

## Step 4: Create Your First Device

Before uploading images, create a device for your e-ink frame:

1. Click **Devices** in the navigation
2. Click **Add Device**
3. Enter a name (e.g., "Living Room Frame")
4. Select the display type that matches your hardware
5. Click **Create Device**

Your device is now ready to receive images.

## Step 5: Upload Your First Image

1. Click **Upload** in the navigation
2. Drag a photo onto the upload area (or click to browse)
3. Select a **Category** (e.g., "Landscapes")
4. Check the **Device(s)** to generate images for
5. Choose a **Fit Mode**:
   - **Smart Fit** (recommended): Auto-rotates and chooses best fit
   - **Fill Frame**: Fills frame, may crop edges
   - **Fit Entire Image**: Shows whole image with letterboxing
6. Click **Process**
7. Wait for processing to complete
8. View your processed image in the Gallery

## Step 6: Deploy to Vercel

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

## Step 7: Configure Your E-ink Frame

### API Endpoints

Your frame uses device-specific endpoints:

| Endpoint | Description |
|----------|-------------|
| `/api/devices/{deviceId}/current` | Get current image |
| `/api/devices/{deviceId}/next` | Rotate to next image |
| `/api/devices/{deviceId}/random` | Get random image |

### Example Frame Code

```python
# MicroPython for Pimoroni Inky Frame
import urequests
import ujson

API_BASE = "https://your-project.vercel.app"
DEVICE_ID = "living-room-frame"  # Your device ID

def get_image_url():
    url = f"{API_BASE}/api/devices/{DEVICE_ID}/random"
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
- Check the device ID matches what's in InkyStream
- Test the API in a browser first

### Deployment fails
- Check Vercel build logs
- Ensure all files are committed to git
- Verify package.json has all dependencies

See the full [Troubleshooting Guide](../setup/troubleshooting.md) for more help.

## Need Help?

- Check the [Documentation](../README.md)
- Search [GitHub Issues](https://github.com/8ix/inkystream/issues)
- Ask in [GitHub Discussions](https://github.com/8ix/inkystream/discussions)
