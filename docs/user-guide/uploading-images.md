# Uploading and Processing Images

This guide covers how to upload photos and process them for your e-ink displays.

## Supported Formats

InkyStream accepts these image formats:
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)

**Maximum file size**: 20MB per image

## Upload Process

### Step 1: Navigate to Upload

Click **Upload** in the navigation bar or go to `http://localhost:3000/upload`.

### Step 2: Add Images

**Drag and Drop**:
- Drag images from your file manager
- Drop them onto the upload area
- Multiple images can be dropped at once

**Click to Browse**:
- Click the upload area
- Select images from your computer
- Hold Ctrl/Cmd to select multiple

### Step 3: Configure Processing

For each image (or batch), configure:

**Category**
- Select which category the images belong to
- Categories help organize your library
- Each frame can display specific categories

**Display Types**
- Select which e-ink displays to generate images for
- Images are processed for each selected display
- Different displays have different resolutions and colors

**Dithering Algorithm** (optional)
- Floyd-Steinberg (default): Best for photos
- Ordered: Better for graphics with sharp edges
- Atkinson: Good for high-contrast images

### Step 4: Process

Click **Process** to start image processing.

**Processing steps**:
1. Images are resized to display dimensions
2. Colors are reduced to display palette
3. Dithering is applied for smooth gradients
4. Variants are saved for each display type
5. Thumbnails are generated
6. Metadata is created

### Step 5: Review

After processing:
- View results in the Gallery
- Check each display variant
- Verify images look correct

## Batch Processing

### Processing Multiple Images

1. Upload multiple images at once
2. All images will use the same settings
3. Progress bar shows overall progress
4. Failed images are reported at the end

### Tips for Batch Upload

- Group similar images for consistent settings
- Process landscapes separately from portraits
- Start with a small batch to test settings

## Image Optimization Tips

### For Best Results

**Choose High-Quality Sources**
- Higher resolution source = better output
- Avoid heavily compressed JPEGs
- Original photos work best

**Consider Contrast**
- E-ink displays have limited contrast
- High-contrast images look best
- Dark shadows and bright highlights work well

**Think About Color**
- Limited color palettes (2-7 colors typically)
- Bold, distinct colors work better
- Subtle gradients become banding

### Image Composition

**Simple is Better**
- Clean compositions with clear subjects
- Avoid busy backgrounds
- Large shapes read well on e-ink

**Landscape Orientation**
- Most e-ink frames are landscape
- Portrait images will be cropped
- Consider this when selecting photos

## Reprocessing Images

To reprocess with different settings:

1. Go to **Gallery**
2. Find the image
3. Click **Reprocess**
4. Adjust settings
5. Click **Process**

The new variants replace the old ones.

## Storage and Git

### Where Images Are Stored

```
public/images/
└── [category]/
    └── [image-id]/
        ├── inky_frame_7_spectra.png
        ├── inky_frame_7_colour.png
        ├── thumbnail.png
        └── metadata.json
```

### Committing to Git

After processing, images need to be committed:

```bash
git add public/images/
git commit -m "Added new landscape photos"
git push
```

### Managing Repository Size

For large collections:
- Consider Git LFS for images
- Regularly clean up unused images
- Monitor repository size

## Troubleshooting

### Upload Fails

**"File too large"**
- Maximum file size is 20MB
- Resize or compress the image first

**"Unsupported format"**
- Convert to JPEG, PNG, or WebP
- Check file isn't corrupted

### Processing Fails

**"Processing error"**
- Check browser console for details
- Ensure Sharp is installed correctly
- Try a different image to isolate the issue

**Takes too long**
- Large images take longer to process
- Consider reducing source image size
- Check CPU usage

### Poor Quality Output

**Images look washed out**
- Increase contrast in source image
- Try a different dithering algorithm
- Check display profile settings

**Banding in gradients**
- Use Floyd-Steinberg dithering
- Source image may need more contrast

**Wrong colors**
- Verify correct display type is selected
- Check display palette matches your hardware

## Next Steps

- [Manage your gallery](./gallery-management.md)
- [Configure frame rotation](./frame-configuration.md)
- [Add new categories](../architecture/category-system.md)

