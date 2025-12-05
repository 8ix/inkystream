# Gallery Management

Learn how to organize, view, and manage your processed images in InkyStream.

## Accessing the Gallery

Navigate to **Gallery** in the navigation bar or go to `http://localhost:3000/gallery`.

## Gallery Overview

The gallery displays:
- All processed images as thumbnails
- Category filter pills
- Device filter dropdown
- Image count
- Click-to-expand detail modal

## Viewing Images

### Thumbnail View

The default view shows image thumbnails in a grid:
- Hover to see filename
- Category color indicator (dot)
- Device variant count badge
- Click to open detail modal

### Detail Modal

Click an image to see the full detail modal with:
- Larger image preview
- Original filename and processing date
- Category information
- **All device variants** with dimensions
- Download and view buttons for each variant
- Delete option

### Filtering Images

**By Category**
- Click category pills at the top
- "All" shows all categories
- Category pills show color indicators

**By Device**
- Use the device dropdown
- Shows only images that have variants for that device
- Useful for checking what's available on specific frames

## Image Details

Each image stores:

**Basic Information**
- Original filename
- Category
- Processing date/time
- Unique image ID

**Device Variants**
- One PNG per device the image was processed for
- Each variant is optimized for that device's:
  - Resolution
  - Color palette
  - Aspect ratio

**Metadata Structure**
```json
{
  "id": "abc123-uuid",
  "originalFilename": "sunset_beach.jpg",
  "categoryId": "landscapes",
  "processedAt": "2024-01-15T10:30:00Z",
  "variants": [
    {
      "deviceId": "living-room-frame",
      "displayId": "inky_frame_7_spectra6",
      "filename": "living-room-frame.png",
      "width": 800,
      "height": 480
    },
    {
      "deviceId": "bedroom-frame",
      "displayId": "inky_frame_5_7_spectra6",
      "filename": "bedroom-frame.png",
      "width": 600,
      "height": 448
    }
  ]
}
```

## Managing Images

### Viewing Device Variants

1. Click an image to open the detail modal
2. Scroll to "Device Variants" section
3. See all devices the image was processed for
4. Click the eye icon to view full-size
5. Click the download icon to save locally

### Deleting Images

1. Click an image to open the detail modal
2. Click **Delete Image** at the bottom
3. Confirm in the dialog
4. Image and all variants are removed

**Note**: Deletion is immediate and permanent. The image files are removed from the file system.

### Adding Images to More Devices

If you add a new device and want existing images for it:

1. Note the original image files (or re-upload)
2. Go to **Upload**
3. Upload the same images
4. Select the new device
5. Process

Currently, you cannot reprocess existing images for new devices without re-uploading.

## Storage Structure

Images are stored in the file system:

```
public/images/
├── landscapes/
│   ├── abc123-uuid/
│   │   ├── living-room-frame.png
│   │   ├── bedroom-frame.png
│   │   ├── thumbnail.png
│   │   └── metadata.json
│   └── def456-uuid/
│       └── ...
├── family/
│   └── ...
└── art/
    └── ...
```

## Syncing with Vercel

After gallery changes (adding or deleting images), sync to production:

```bash
# See what's changed
git status

# Add image changes
git add public/images/

# Commit
git commit -m "Gallery updates - added vacation photos"

# Deploy
git push
```

Changes appear on Vercel within ~30 seconds.

## Best Practices

### Organization Tips

**Use Meaningful Categories**
- Create categories that match your use case
- Consider room placement (e.g., "Kitchen Art")
- Theme-based categories work well (e.g., "Nature", "Family")

**Consistent Device Selection**
- Process images for all your devices
- Or create device-specific categories

**Regular Cleanup**
- Delete images you no longer want
- Remove failed or poor-quality results
- Keep your library manageable

### Storage Management

**Monitor Size**
- Check repository size periodically
- Large images add up quickly
- Run `du -sh public/images/` to check

**Git Considerations**
- Deleted files still exist in git history
- Large repos may hit GitHub limits
- Consider Git LFS for very large collections

## Troubleshooting

### Images Not Showing

**In Gallery**
- Refresh the page (Ctrl/Cmd + R)
- Check browser console for errors
- Verify files exist in `public/images/`

**On Frame**
- Confirm git push succeeded
- Check Vercel deployment completed
- Test API endpoint directly
- Verify device ID is correct

### Slow Gallery

**Loading Time**
- Large libraries take longer
- Thumbnails are generated at 200px
- Browser caching helps on repeat visits

**Performance**
- Close unused browser tabs
- Clear browser cache if issues persist
- Reduce number of images displayed

### Missing Variants

**Image has no variant for my device**
- Check if device existed when image was uploaded
- May need to re-upload and process for new devices
- Verify device selection during upload

### Can't Delete Image

**Delete button doesn't work**
- Check browser console for errors
- Verify you're running the local server
- Try refreshing the page

## Next Steps

- [Configure your e-ink frames](./frame-configuration.md)
- [Upload more images](./uploading-images.md)
- [Manage categories](../architecture/category-system.md)
- [Troubleshooting guide](../setup/troubleshooting.md)
