'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  loadImage, 
  imageToCanvas, 
  resizeToFit, 
  processImagePreview,
  hexToRgb,
  DEFAULT_ADJUSTMENTS,
  type ImageAdjustments,
  type RGB 
} from '@/lib/client/image-processing';
import { Sliders, RotateCcw, Check, X, Loader2 } from 'lucide-react';

interface ImageEditorProps {
  file: File;
  palette: string[];  // Hex colors from display profile
  targetWidth: number;
  targetHeight: number;
  onConfirm: (adjustments: ImageAdjustments) => void;
  onCancel: () => void;
}

// Preview resolution (smaller for performance)
const PREVIEW_SCALE = 0.5;

// Debounce delay for slider changes (ms)
const DEBOUNCE_DELAY = 150;

/**
 * ImageEditor component with live dithering preview
 * All processing happens client-side in the browser
 */
export default function ImageEditor({
  file,
  palette,
  targetWidth,
  targetHeight,
  onConfirm,
  onCancel,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [paletteRgb, setPaletteRgb] = useState<RGB[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Convert hex palette to RGB on mount
  useEffect(() => {
    setPaletteRgb(palette.map(hexToRgb));
  }, [palette]);

  // Load image and create source canvas
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setIsLoading(true);
        const img = await loadImage(file);
        
        if (!mounted) return;

        // Calculate preview size (scaled down for performance)
        const previewWidth = Math.round(targetWidth * PREVIEW_SCALE);
        const previewHeight = Math.round(targetHeight * PREVIEW_SCALE);
        
        // Resize image to fit target aspect ratio
        const fitted = resizeToFit(img, previewWidth, previewHeight);
        
        // Create source canvas at preview size
        sourceCanvasRef.current = imageToCanvas(img, fitted.width, fitted.height);
        
        // Clean up blob URL
        URL.revokeObjectURL(img.src);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load image:', error);
        setIsLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [file, targetWidth, targetHeight]);

  // Process and render preview (debounced)
  const updatePreview = useCallback(() => {
    if (!sourceCanvasRef.current || !canvasRef.current || paletteRgb.length === 0) return;

    setIsProcessing(true);

    // Use requestAnimationFrame to not block UI
    requestAnimationFrame(() => {
      const sourceCanvas = sourceCanvasRef.current!;
      const outputCanvas = processImagePreview(sourceCanvas, paletteRgb, adjustments);
      
      // Draw to display canvas
      const displayCtx = canvasRef.current!.getContext('2d')!;
      canvasRef.current!.width = outputCanvas.width;
      canvasRef.current!.height = outputCanvas.height;
      displayCtx.drawImage(outputCanvas, 0, 0);
      
      setIsProcessing(false);
    });
  }, [adjustments, paletteRgb]);

  // Debounced preview update
  useEffect(() => {
    if (isLoading) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updatePreview();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [adjustments, isLoading, updatePreview]);

  // Initial render when loaded
  useEffect(() => {
    if (!isLoading && sourceCanvasRef.current && paletteRgb.length > 0) {
      updatePreview();
    }
  }, [isLoading, paletteRgb, updatePreview]);

  const handleSliderChange = (key: keyof ImageAdjustments, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  };

  const handleConfirm = () => {
    onConfirm(adjustments);
  };

  const previewWidth = Math.round(targetWidth * PREVIEW_SCALE);
  const previewHeight = Math.round(targetHeight * PREVIEW_SCALE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#ff47b3]" />
          <h3 className="font-bold text-white">Adjust Image</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Preview Canvas */}
      <div className="relative rounded-xl overflow-hidden bg-black/40 border border-white/10">
        <div 
          className="flex items-center justify-center p-4"
          style={{ minHeight: previewHeight + 32 }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading image...
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="max-w-full rounded-lg shadow-lg"
                style={{ imageRendering: 'pixelated' }}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Palette preview */}
        <div className="flex justify-center gap-1 pb-3">
          {palette.map((color, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded border border-white/20"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-white/80">Saturation</label>
            <span className="text-white/60 font-mono">{adjustments.saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={adjustments.saturation}
            onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-[#ff47b3] [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#ff47b3]/30"
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>Grayscale</span>
            <span>Normal</span>
            <span>Vivid</span>
          </div>
        </div>

        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-white/80">Contrast</label>
            <span className="text-white/60 font-mono">{adjustments.contrast}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            value={adjustments.contrast}
            onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-[#a855f7] [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#a855f7]/30"
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>Flat</span>
            <span>Normal</span>
            <span>Punchy</span>
          </div>
        </div>

        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-white/80">Brightness</label>
            <span className="text-white/60 font-mono">{adjustments.brightness}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={adjustments.brightness}
            onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-[#22d3ee] [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#22d3ee]/30"
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>Dark</span>
            <span>Normal</span>
            <span>Bright</span>
          </div>
        </div>
      </div>

      {/* Info text */}
      <p className="text-xs text-white/40 text-center">
        Preview is at {Math.round(PREVIEW_SCALE * 100)}% size. Final image will be processed at full resolution on the server.
      </p>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white/80 
                     hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading || isProcessing}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#ff47b3] to-[#a855f7] 
                     text-white font-semibold hover:opacity-90 transition-opacity
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Apply & Process
        </button>
      </div>
    </div>
  );
}
