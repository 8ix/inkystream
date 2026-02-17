# Uploading and Processing Images

This guide covers how to upload photos and process them for your e-ink displays.

## Supported Formats

InkyStream accepts these image formats:
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)

**Maximum file size**: 20MB per image

## Before You Upload

### Create Devices First

Before uploading, ensure you have at least one device configured:

1. Go to **Devices** page
2. Click **Add Device**
3. Enter a name and select display type
4. Click **Create Device**

### Understand Fit Modes

When uploading, you'll choose how images fit into frames:

| Mode | Description | Best For |
|------|-------------|----------|
| **Smart Fit** | Auto-rotates and chooses best fit | Most images (recommended) |
| **Fill Frame** | Covers entire frame, may crop | Landscape photos matching frame orientation |
| **Fit Entire Image** | Shows full image with letterboxing | Square or portrait images |

## Upload Process

### Step 1: Navigate to Upload

Click **Upload** in the navigation bar or go to `http://localhost:3000/upload`.

### Step 2: Add Images

**Drag and Drop**:
- Drag images from your file manager
- Drop them onto the upload area
- Multiple images can be dropped at once (max 10)

**Click to Browse**:
- Click the upload area
- Select images from your computer
- Hold Ctrl/Cmd to select multiple

### Step 3: Configure Processing

**Category**
- Select which category the images belong to
- Categories help organize your library
- Each frame can filter by category

**Devices**
- Check the devices to generate images for
- Each selected device gets an optimized variant
- Images are sized and dithered for each device's display

**Fit Mode**
- **Smart Fit** (recommended): Automatically rotates the image if needed and chooses between cover/contain to minimize cropping
- **Fill Frame (Cover)**: Image fills the entire frame; edges may be cropped
- **Fit Entire Image (Contain)**: Entire image visible; adds letterbox bars if needed

**Dithering Algorithm**
- Floyd-Steinberg (default): Best for photos
- Ordered: Better for graphics with sharp edges
- Atkinson: Good for high-contrast images

### Step 4: Process

Click **Process** to start image processing.

**Processing steps**:
1. Image is rotated if Smart Fit determines it's beneficial
2. Image is resized to device dimensions
3. Colors are reduced to the display palette
4. Dithering is applied for smooth gradients
5. Variants are saved for each selected device
6. Thumbnail is generated
7. Metadata is created

### Step 6: Review

After processing:
- View results in the Gallery
- Filter by device to see specific variants
- Verify images look correct

## Batch Processing

### Processing Multiple Images

1. Upload multiple images at once (up to 10)
2. All images use the same settings
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
- Subtle gradients may show banding

### Image Composition

**Simple is Better**
- Clean compositions with clear subjects
- Avoid busy backgrounds
- Large shapes read well on e-ink

**Orientation Matters**
- Use Smart Fit to handle mixed orientations
- Or group by orientation and use appropriate fit modes
- Portrait images work best with Smart Fit or Contain modes

## Storage and Git

### Where Images Are Stored

```
public/images/
└── [category]/
    └── [image-id]/
        ├── living-room-frame.png    # Device variant
        ├── bedroom-frame.png        # Another device
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
- Enable Auto Contrast
- Increase saturation boost
- Try a different dithering algorithm

**Banding in gradients**
- Use Floyd-Steinberg dithering
- Enable noise reduction
- Source image may need more contrast

**Wrong colors**
- Verify correct device is selected
- Check display profile color palette
- Some colors may not exist in limited palettes

**Unwanted cropping**
- Use Smart Fit or Fit Entire Image mode
- Consider image orientation vs frame orientation

**Letterbox bars visible**
- Expected with Fit Entire Image mode
- Use Fill Frame mode to avoid bars
- Or use Smart Fit for automatic decision

## Next Steps

- [Manage your gallery](./gallery-management.md)
- [Configure frame rotation](./frame-configuration.md)
- [Create categories](../architecture/category-system.md)
