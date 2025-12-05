# Gallery Management

Learn how to organize, view, and manage your processed images in InkyStream.

## Accessing the Gallery

Navigate to **Gallery** in the navigation bar or go to `http://localhost:3000/gallery`.

## Gallery Overview

The gallery displays:
- All processed images
- Organized by category
- Thumbnail previews
- Processing metadata

## Viewing Images

### Thumbnail View

The default view shows image thumbnails:
- Quick overview of your library
- Category-colored borders
- Click to see details

### Detail View

Click an image to see:
- Full-size preview
- All display variants
- Processing information
- Metadata details

### Category Filter

Filter images by category:
1. Click the category dropdown
2. Select a category
3. Only that category's images are shown
4. Click "All" to show everything

## Image Details

Each image shows:

**Basic Information**
- Original filename
- Category
- Processing date/time

**Display Variants**
- List of generated display versions
- Preview each variant
- Download individual files

**Metadata**
```json
{
  "id": "abc123",
  "originalFilename": "sunset_beach.jpg",
  "categoryId": "landscapes",
  "processedAt": "2024-01-15T10:30:00Z",
  "variants": [
    {
      "displayId": "inky_frame_7_spectra",
      "filename": "inky_frame_7_spectra.png",
      "width": 800,
      "height": 480
    }
  ]
}
```

## Managing Images

### Moving Between Categories

1. Select images (checkbox)
2. Click **Move**
3. Choose new category
4. Confirm

Images are physically moved in the file system.

### Deleting Images

1. Select images
2. Click **Delete**
3. Confirm deletion

**Warning**: Deletion is permanent. Images are removed from:
- File system
- Git history (after commit)

### Reprocessing

To reprocess with different settings:
1. Click the image
2. Click **Reprocess**
3. Adjust settings
4. Click **Process**

New variants replace existing ones.

## Bulk Operations

### Select Multiple Images

- Click checkboxes on images
- Click "Select All" for current view
- Shift+click for range selection

### Bulk Actions

With images selected:
- **Move**: Change category
- **Delete**: Remove from library
- **Reprocess**: Apply new settings

## Search and Sort

### Search

Search by:
- Filename
- Category name
- Date range

### Sort Options

Sort images by:
- Date processed (newest/oldest)
- Filename (A-Z/Z-A)
- Category

## Exporting

### Download Individual Images

1. Click the image
2. Select variant
3. Click **Download**

### Bulk Download

1. Select images
2. Click **Download**
3. ZIP file is created
4. Choose variants to include

## Statistics

The gallery header shows:
- Total image count
- Images per category
- Storage used

## Best Practices

### Organization Tips

**Use Meaningful Categories**
- Create categories that match your frames
- Consider room placement
- Theme-based categories work well

**Regular Cleanup**
- Delete images you no longer want
- Remove failed or poor-quality results
- Keep your library manageable

**Consistent Processing**
- Use similar settings for related images
- Reprocess if display requirements change

### Storage Management

**Monitor Size**
- Check repository size periodically
- Large images add up quickly
- Consider Git LFS for big collections

**Clean Git History**
- Deleted files still exist in git history
- Periodically clean if needed
- Be careful with force pushes

## Syncing with Vercel

After gallery changes, sync to production:

```bash
# See what's changed
git status

# Add all changes
git add public/images/

# Commit
git commit -m "Gallery updates"

# Deploy
git push
```

Changes appear on Vercel within ~30 seconds.

## Troubleshooting

### Images Not Showing

**In Gallery**
- Refresh the page
- Check browser console for errors
- Verify files exist in `public/images/`

**On Frame**
- Confirm deployment succeeded
- Test API endpoint directly
- Check category and display parameters

### Slow Gallery

**Loading Time**
- Large libraries take longer
- Consider pagination for 100+ images
- Optimize thumbnail sizes

**Performance**
- Close unused browser tabs
- Clear browser cache
- Reduce images displayed per page

### Missing Variants

**After Reprocessing**
- Check processing completed
- Verify display types were selected
- Look for error messages

## Next Steps

- [Configure your e-ink frames](./frame-configuration.md)
- [Add new display support](../development/adding-displays.md)
- [Troubleshooting guide](../setup/troubleshooting.md)

