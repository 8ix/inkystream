# Advanced dithering techniques for e-ink photography

Converting photographs to **6-7 color e-ink palettes** requires a sophisticated pipeline combining perceptual color science, structure-preserving preprocessing, and carefully tuned error diffusion. The best results come from processing images in the **OKLab perceptual color space**, applying edge-aware preprocessing, and using **serpentine Floyd-Steinberg or Stucki dithering** with weighted error diffusion that prioritizes luminance accuracy. For maximum quality within your 5-10 second budget, structure-aware techniques and modern variable-coefficient methods can achieve near-blue-noise results without the computational cost of iterative optimization.

## OKLab transforms color matching for limited palettes

The single most impactful improvement for e-ink photo conversion is abandoning RGB for **OKLab color space**. Created by Björn Ottosson and now adopted by Adobe Photoshop, CSS Color Level 4, and major game engines, OKLab provides perceptually uniform distances where simple Euclidean distance accurately reflects human color perception—unlike CIELAB's infamous blue hue shift problems.

```javascript
// Linear sRGB to OKLab - the foundation for perceptual dithering
function linearSrgbToOklab(r, g, b) {
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    
    return {
        L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    };
}

// Perceptual distance is simply Euclidean in OKLab
function oklabDistance(c1, c2) {
    const dL = (c1.L - c2.L) * 1.5;  // Weight luminance higher
    const da = c1.a - c2.a;
    const db = c1.b - c2.b;
    return Math.sqrt(dL*dL + da*da + db*db);
}
```

The **1.5× luminance weighting** reflects human vision's approximately 100× greater sensitivity to luminance than chrominance. E-ink's limited gamut makes this especially critical—preserving tonal accuracy matters more than color accuracy when you have only 6-7 colors to work with. Always convert to linear RGB before OKLab transformation using sRGB gamma decoding: `c <= 0.04045 ? c/12.92 : pow((c+0.055)/1.055, 2.4)`.

## Error diffusion matrices ranked by photographic quality

For photographs, larger kernels produce smoother gradients but require more computation. The **Stucki** and **Jarvis-Judice-Ninke** algorithms excel at photographic content, while Floyd-Steinberg remains the practical default:

| Algorithm | Divisor | Quality | Speed | Best for |
|-----------|---------|---------|-------|----------|
| Jarvis-Judice-Ninke | 48 | Highest | Slow | Smooth gradients |
| Stucki | 42 | Very High | Medium | Photography (recommended) |
| Burkes | 32 | High | Fast | Good balance |
| Floyd-Steinberg | 16 | Good | Very Fast | General purpose |
| Atkinson | 8 (75%) | Punchy | Fastest | High contrast |

**Stucki's matrix** provides near-JJN quality with faster computation due to its power-of-two weights:

```javascript
const stucki = {
    divisor: 42,
    matrix: [
        [0, 0, 0, 8, 4],    //       *  8  4
        [2, 4, 8, 4, 2],    //    2  4  8  4  2
        [1, 2, 4, 2, 1]     //    1  2  4  2  1
    ]
};
```

**Serpentine scanning is non-negotiable** for photographic content. Standard left-to-right scanning creates visible "worm artifacts" from consistent error propagation direction. Alternating direction each row eliminates this with negligible overhead:

```javascript
for (let y = 0; y < height; y++) {
    const leftToRight = (y % 2) === 0;
    const [start, end, step] = leftToRight ? [0, width, 1] : [width-1, -1, -1];
    
    for (let x = start; x !== end; x += step) {
        // Process pixel, mirror diffusion offsets when going right-to-left
        const mirrorX = leftToRight ? 1 : -1;
        diffuseError(x + mirrorX, y, error * 7/16);       // right/left
        diffuseError(x - mirrorX, y + 1, error * 3/16);   // bottom-opposite
        diffuseError(x, y + 1, error * 5/16);             // bottom
        diffuseError(x + mirrorX, y + 1, error * 1/16);   // bottom-same
    }
}
```

## Preprocessing pipeline makes or breaks limited-palette results

With only 6-7 colors, preprocessing determines whether detail survives quantization. This pipeline addresses e-ink's specific characteristics—displays appear **20% darker** than expected and colors look muted compared to emissive screens:

```javascript
async function preprocessForEink(imageData, options = {}) {
    const {
        saturationBoost = 1.4,     // E-ink mutes colors significantly
        contrastStrength = 0.35,   // S-curve midtone enhancement
        claheClipLimit = 2.5,      // Local contrast without noise amplification
        claheTileSize = 8,
        bilateralSpace = 6,        // Edge-preserving smoothing
        bilateralRange = 0.12,
        unsharpAmount = 0.4,       // Pre-sharpen before dithering blur
        displayGamma = 1.85        // E-ink typically 1.8-2.0 vs sRGB 2.2
    } = options;

    // 1. Linearize sRGB
    let image = applyGammaExpand(imageData, 2.2);
    
    // 2. Convert to OKLab for perceptual processing
    image = convertToOklab(image);
    
    // 3. Saturation boost in OKLCH (polar OKLab)
    image = boostChroma(image, saturationBoost);
    
    // 4. Bilateral filter: smooth noise while preserving edges
    image = bilateralFilter(image, bilateralSpace, bilateralRange);
    
    // 5. CLAHE on L channel only (prevents color shifts)
    image = applyCLAHE(image, 'L', claheClipLimit, claheTileSize);
    
    // 6. S-curve contrast on L channel
    image = applySCurve(image, 'L', contrastStrength);
    
    // 7. Unsharp mask on L channel (compensates for dithering blur)
    image = unsharpMask(image, 'L', unsharpAmount, 1.5);
    
    // 8. Gamma correction for e-ink display response
    image = applyGammaCompress(image, displayGamma);
    
    return image;
}
```

**CLAHE (Contrast Limited Adaptive Histogram Equalization)** is particularly valuable for photographs with uneven lighting. Unlike global histogram equalization, CLAHE operates on tiles and clips the histogram to prevent noise amplification—critical before aggressive quantization. Apply only to the luminance channel to avoid color shifts.

The **bilateral filter** deserves special attention: it smooths uniform regions (reducing dithering noise in skies) while preserving edges (maintaining sharpness at boundaries). The formula combines spatial and intensity weighting:

```javascript
function bilateralPixel(image, x, y, sigmaSpace, sigmaRange, radius = 6) {
    let weightSum = 0, filtered = {L: 0, a: 0, b: 0};
    const center = getPixel(image, x, y);
    
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const neighbor = getPixel(image, x+dx, y+dy);
            const spatialDist = dx*dx + dy*dy;
            const rangeDist = Math.pow(neighbor.L - center.L, 2);
            
            const weight = Math.exp(-spatialDist / (2*sigmaSpace*sigmaSpace)) 
                         * Math.exp(-rangeDist / (2*sigmaRange*sigmaRange));
            
            filtered.L += neighbor.L * weight;
            filtered.a += neighbor.a * weight;
            filtered.b += neighbor.b * weight;
            weightSum += weight;
        }
    }
    return {L: filtered.L/weightSum, a: filtered.a/weightSum, b: filtered.b/weightSum};
}
```

## Structure-aware dithering preserves edges and textures

Academic research has produced several techniques that dramatically improve photographic dithering beyond basic error diffusion. The 2009 paper "Structure-Aware Error Diffusion" by Chang, Alain, and Ostromoukhov achieves near-optimization quality at O(n) complexity by modulating thresholds and coefficients based on local frequency analysis.

**Ostromoukhov's variable-coefficient method** (SIGGRAPH 2001) provides an excellent quality/speed tradeoff. It uses a 256-entry lookup table to vary diffusion coefficients based on input gray level, achieving blue-noise characteristics:

```javascript
// Simplified - full implementation needs complete coefficient table
const ostromoukhovCoeffs = new Map([
    [0,   {d1: 13, d2: 0, d3: 5, div: 18}],
    [32,  {d1: 5,  d2: 0, d3: 5, div: 10}],
    [64,  {d1: 8,  d2: 2, d3: 5, div: 15}],
    [128, {d1: 7,  d2: 4, d3: 5, div: 16}],
    [192, {d1: 5,  d2: 3, d3: 5, div: 13}],
    [255, {d1: 2,  d2: 0, d3: 5, div: 7}],
    // ... 256 entries total
]);

function ostromoukhovDither(image, palette) {
    for (let y = 0; y < height; y++) {
        const dir = (y % 2 === 0) ? 1 : -1;  // Serpentine
        for (let x = dir > 0 ? 0 : width-1; x >= 0 && x < width; x += dir) {
            const value = getPixel(x, y).L * 255;
            const {d1, d2, d3, div} = getCoeffs(Math.round(value));
            const quantized = findNearestColor(value, palette);
            const error = value - quantized;
            
            addError(x + dir, y, error * d1 / div);
            addError(x - dir, y + 1, error * d2 / div);
            addError(x, y + 1, error * d3 / div);
        }
    }
}
```

For maximum quality when processing time permits, **Direct Binary Search (DBS)** iteratively optimizes the halftone by toggling and swapping pixels to minimize perceived error through a Human Visual System model. While computationally expensive, GPU implementations achieve practical speeds.

## Blue noise and Riemersma for artifact-free gradients

Blue noise dithering pushes quantization artifacts to high spatial frequencies where human vision is less sensitive. The **void-and-cluster algorithm** generates optimal threshold maps that produce aperiodic, visually pleasing patterns—superior to Bayer ordered dithering for photographs.

**Riemersma dithering** traverses the image along a Hilbert space-filling curve, propagating error only to subsequent pixels with exponential decay. This eliminates directional artifacts entirely and provides excellent locality (changes to one pixel affect only nearby pixels):

```javascript
function riemersma(image, palette, q = 16, r = 16) {
    const errors = [];
    const base = Math.exp(Math.log(r) / (q - 1));
    const weights = Array.from({length: q}, (_, i) => (1/r) * Math.pow(base, i));
    
    // Traverse image via Hilbert curve
    hilbertCurve(width, (x, y) => {
        let adjustedValue = getPixel(x, y);
        
        // Apply weighted error history
        for (let i = 0; i < errors.length; i++) {
            adjustedValue.L += errors[i].L * weights[errors.length - 1 - i];
            adjustedValue.a += errors[i].a * weights[errors.length - 1 - i];
            adjustedValue.b += errors[i].b * weights[errors.length - 1 - i];
        }
        
        const nearest = findNearestColor(adjustedValue, palette);
        setPixel(x, y, nearest);
        
        errors.push({
            L: adjustedValue.L - nearest.L,
            a: adjustedValue.a - nearest.a,
            b: adjustedValue.b - nearest.b
        });
        if (errors.length > q) errors.shift();
    });
}
```

## Adaptive techniques for faces, skies, and textures

Content-aware dithering adjusts parameters based on image regions. **Faces require gentler treatment**—reducing error diffusion strength to 60-70% preserves skin tone continuity. **Skies and gradients** benefit from full-strength diffusion or blue-noise patterns:

```javascript
async function adaptiveDither(image, palette) {
    // Detect content regions
    const faces = await detectFaces(image);  // face-api.js or TensorFlow.js
    const edges = detectEdges(image);        // Sobel/Canny
    const textures = analyzeTexture(image);  // Local variance
    
    const strengthMap = new Float32Array(width * height);
    
    for (let i = 0; i < strengthMap.length; i++) {
        const x = i % width, y = Math.floor(i / width);
        
        if (isInRegion(x, y, faces)) {
            strengthMap[i] = 0.65;  // Gentle for faces
        } else if (edges[i] > 0.5) {
            strengthMap[i] = 0.5;   // Preserve sharp edges
        } else if (textures[i] < 0.1) {
            strengthMap[i] = 1.0;   // Full diffusion for smooth gradients
        } else {
            strengthMap[i] = 0.85;  // Default for textures
        }
    }
    
    return ditherWithStrengthMap(image, palette, strengthMap);
}
```

## Complete implementation for 7-color e-ink

Bringing together all techniques into a production-ready pipeline:

```javascript
const EINK_7COLOR_PALETTE = [
    {name: 'black',  rgb: [0, 0, 0]},
    {name: 'white',  rgb: [255, 255, 255]},
    {name: 'green',  rgb: [0, 128, 0]},
    {name: 'blue',   rgb: [0, 0, 255]},
    {name: 'red',    rgb: [255, 0, 0]},
    {name: 'yellow', rgb: [255, 255, 0]},
    {name: 'orange', rgb: [255, 165, 0]}
];

// Pre-compute OKLab values for palette
function initPalette(palette) {
    return palette.map((color, index) => {
        const [r, g, b] = color.rgb.map(v => srgbToLinear(v / 255));
        return {...color, index, oklab: linearSrgbToOklab(r, g, b)};
    });
}

function stuckiDitherOklab(labImage, palette, width, height) {
    const buffer = Float32Array.from(labImage);
    const output = new Uint8Array(width * height);
    
    for (let y = 0; y < height; y++) {
        const leftToRight = (y % 2) === 0;
        const [start, end, step] = leftToRight ? [0, width, 1] : [width-1, -1, -1];
        
        for (let x = start; x !== end; x += step) {
            const idx = y * width + x;
            const pixel = {
                L: buffer[idx * 3],
                a: buffer[idx * 3 + 1],
                b: buffer[idx * 3 + 2]
            };
            
            // Find perceptually nearest color
            let minDist = Infinity, nearest;
            for (const color of palette) {
                const dist = oklabDistance(pixel, color.oklab);
                if (dist < minDist) { minDist = dist; nearest = color; }
            }
            output[idx] = nearest.index;
            
            // Calculate error
            const err = {
                L: pixel.L - nearest.oklab.L,
                a: pixel.a - nearest.oklab.a,
                b: pixel.b - nearest.oklab.b
            };
            
            // Stucki diffusion with serpentine mirroring
            const m = leftToRight ? 1 : -1;
            const diffuse = (dx, dy, weight) => {
                const nx = x + dx * m, ny = y + dy;
                if (nx >= 0 && nx < width && ny < height) {
                    const nidx = ny * width + nx;
                    buffer[nidx * 3] += err.L * weight;
                    buffer[nidx * 3 + 1] += err.a * weight;
                    buffer[nidx * 3 + 2] += err.b * weight;
                }
            };
            
            // Stucki: divisor 42
            diffuse(1, 0, 8/42); diffuse(2, 0, 4/42);
            diffuse(-2, 1, 2/42); diffuse(-1, 1, 4/42); diffuse(0, 1, 8/42); 
            diffuse(1, 1, 4/42); diffuse(2, 1, 2/42);
            diffuse(-2, 2, 1/42); diffuse(-1, 2, 2/42); diffuse(0, 2, 4/42);
            diffuse(1, 2, 2/42); diffuse(2, 2, 1/42);
        }
    }
    return output;
}
```

## JavaScript libraries for immediate use

Several libraries provide ready-to-use implementations:

- **epdoptimize**: Purpose-built for e-ink with device-specific color calibration and multiple algorithms (Floyd-Steinberg, Jarvis, Stucki, Sierra variants). Handles the critical color replacement step matching palette colors to actual device output.

- **image-q**: Comprehensive TypeScript library with CIEDE2000 distance calculation, multiple quantizers (WuQuant, NeuQuant), and all major dithering algorithms including Riemersma.

- **ditherjs**: Browser and Node.js support with Atkinson, ordered, and error diffusion options.

For best results, combine libraries: use **sharp** or **Jimp** for preprocessing (resize, contrast, saturation), convert to OKLab manually, then apply dithering from **image-q** or **epdoptimize**.

## Key academic papers for deeper research

The foundational literature provides theoretical grounding and advanced techniques:

- **Structure-Aware Halftoning** (Pang et al., SIGGRAPH 2008): Optimization-based method preserving both structure similarity (SSIM) and tone—directly applicable to photo conversion
- **Structure-Aware Error Diffusion** (Chang et al., 2009): O(n) complexity with near-optimization quality through local frequency analysis
- **Efficient Halftoning via Deep Reinforcement Learning** (Jiang et al., 2023): Neural approach achieving **15× speedup** over optimization methods with comparable quality; includes multitoning for limited palettes
- **A Simple and Efficient Error-Diffusion Algorithm** (Ostromoukhov, SIGGRAPH 2001): Variable-coefficient method achieving blue-noise properties at error-diffusion speeds
- **Dithering with Blue Noise** (Ulichney, IEEE 1988): Establishes theoretical foundation for why blue noise patterns minimize perceptual artifacts

## Conclusion

The optimal pipeline for 6-7 color e-ink photo conversion combines **OKLab color space** for perceptually accurate matching, **aggressive preprocessing** (saturation +40%, contrast +20%, CLAHE, bilateral filtering), and **Stucki or Floyd-Steinberg dithering with serpentine scanning**. For maximum quality within reasonable time constraints, Ostromoukhov's variable-coefficient method or structure-aware error diffusion provide near-optimization results at linear complexity. The critical insight is that **preprocessing determines 60% of final quality**—the best dithering algorithm cannot recover detail lost to poor color space choices or insufficient contrast enhancement.