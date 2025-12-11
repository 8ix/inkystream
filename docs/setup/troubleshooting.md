# Troubleshooting Guide

Common issues and solutions for InkyStream.

## Local Development Issues

### npm install fails

**Problem**: Errors during `npm install`

**Solutions**:
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`, then retry
3. Ensure Node.js 18+ is installed

### Sharp installation errors

**Problem**: Sharp fails to install or build

**Solutions**:
1. On macOS, install Xcode command line tools: `xcode-select --install`
2. On Windows, ensure Visual C++ Build Tools are installed
3. Try: `npm install --platform=<platform> --arch=<arch> sharp`

### Development server won't start

**Problem**: `npm run dev` fails

**Solutions**:
1. Check if port 3000 is in use: `lsof -i :3000` (macOS/Linux)
2. Kill the process or use a different port: `npm run dev -- -p 3001`
3. Check for TypeScript errors: `npm run lint`

## Image Processing Issues

### Images won't process

**Problem**: Uploading images doesn't produce processed output

**Solutions**:
1. Verify Sharp is installed correctly
2. Check the browser console for errors
3. Ensure the image format is supported (JPEG, PNG, WebP)
4. Check file permissions on the `public/images/` directory

### Dithering looks wrong

**Problem**: Processed images don't look good on e-ink display

**Solutions**:
1. Try a different dithering algorithm
2. Adjust contrast/brightness before processing
3. Ensure you're using the correct display profile
4. High-contrast images work best for e-ink

### Images too large for git

**Problem**: Git complains about file sizes

**Solutions**:
1. Enable Git LFS for the images directory
2. Compress images more aggressively
3. Reduce the number of display variants generated

## Deployment Issues

### Vercel build fails

**Problem**: Deployment fails during build

**Solutions**:
1. Check Vercel build logs for specific errors
2. Test locally with `npm run build`
3. Ensure all TypeScript errors are resolved
4. Verify all dependencies are in `package.json`

### API returns 404

**Problem**: API endpoints return 404 in production

**Solutions**:
1. Ensure routes are in `app/api/` directory
2. Check `vercel.json` rewrite rules
3. Verify the endpoint URL is correct
4. Check that the route file exports the correct HTTP method

### Images not accessible in production

**Problem**: Images work locally but not on Vercel

**Solutions**:
1. Ensure images are committed to git
2. Check that images are in `public/images/` (not excluded by `.gitignore`)
3. Verify the image paths in API responses

## E-ink Frame Issues

### Frame can't connect to API

**Problem**: E-ink frame fails to fetch images

**Solutions**:
1. Verify the API URL is correct
2. Check network connectivity
3. Test the endpoint with curl: `curl https://your-domain/api/current?display=...`
4. Ensure HTTPS is working (Vercel provides this automatically)

### Wrong image displayed

**Problem**: Frame shows incorrect image

**Solutions**:
1. Verify the display type parameter matches your frame
2. Check the category parameter
3. Test the `/api/current` endpoint directly
4. Review the image rotation logic

### Image looks stretched/compressed

**Problem**: Image dimensions don't match display

**Solutions**:
1. Verify the display profile dimensions are correct
2. Check that images are processed for the correct display type
3. Ensure the frame code isn't adding additional scaling

## Getting More Help

If these solutions don't resolve your issue:

1. Search [GitHub Issues](https://github.com/yourusername/inkystream/issues)
2. Check the [Discussions](https://github.com/yourusername/inkystream/discussions)
3. Open a new issue with:
   - InkyStream version
   - Node.js version
   - Operating system
   - Error messages/logs
   - Steps to reproduce




