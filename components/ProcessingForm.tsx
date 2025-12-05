'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import { 
  DITHERING_ALGORITHMS, 
  DEFAULT_ENHANCEMENT_OPTIONS,
  FIT_MODE_OPTIONS,
  type DitheringAlgorithm,
  type EnhancementOptions,
} from '@/lib/processors/dither-types';
import { Monitor, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface ProcessingFormProps {
  categories: Category[];
  devices: Device[];
  displays: DisplayProfile[];
  onSubmit: (options: ProcessingOptions) => void;
  isProcessing: boolean;
  hasFiles: boolean;
}

export interface ProcessingOptions {
  categoryId: string;
  deviceIds: string[];
  dithering: DitheringAlgorithm;
  enhancement: EnhancementOptions;
}

/**
 * Form component for configuring image processing options
 */
export default function ProcessingForm({
  categories,
  devices,
  displays,
  onSubmit,
  isProcessing,
  hasFiles,
}: ProcessingFormProps) {
  const [categoryId, setCategoryId] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [dithering, setDithering] = useState<DitheringAlgorithm>('floyd-steinberg');
  const [enhancement, setEnhancement] = useState<EnhancementOptions>(DEFAULT_ENHANCEMENT_OPTIONS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const getDisplayForDevice = (displayId: string) => {
    return displays.find((d) => d.id === displayId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || selectedDevices.length === 0) return;

    onSubmit({
      categoryId,
      deviceIds: selectedDevices,
      dithering,
      enhancement,
    });
  };

  const isValid = categoryId && selectedDevices.length > 0 && hasFiles;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Selection */}
      <div>
        <label htmlFor="category" className="ink-label">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="ink-input"
          disabled={isProcessing}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-white/40 mt-1.5">
          Images will be organized into this category
        </p>
      </div>

      {/* Device Selection */}
      <div>
        <label className="ink-label">Devices</label>
        <p className="text-xs text-white/40 mb-3">
          Select which devices to create images for
        </p>
        
        {devices.length === 0 ? (
          <div className="p-4 rounded-xl bg-black/20 border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center
                            bg-gradient-to-br from-[#ff47b3]/20 to-[#a855f7]/20">
              <Monitor className="w-6 h-6 text-[#ff47b3]/50" />
            </div>
            <p className="text-sm text-white/50 mb-3">No devices configured yet</p>
            <Link
              href="/devices"
              className="inline-flex items-center gap-2 text-sm text-[#ff47b3] hover:text-[#22d3ee] font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add a device
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => {
              const display = getDisplayForDevice(device.displayId);
              const isSelected = selectedDevices.includes(device.id);
              return (
                <label
                  key={device.id}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#ff47b3]/20 border border-[#ff47b3]/40'
                      : 'bg-black/20 border border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleDeviceToggle(device.id)}
                    disabled={isProcessing}
                    className="mt-1 accent-[#ff47b3]"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected 
                        ? 'bg-gradient-to-br from-[#ff47b3] to-[#a855f7]' 
                        : 'bg-white/10'
                    }`}>
                      <Monitor className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{device.name}</p>
                      {display && (
                        <p className="text-xs text-white/50">
                          {display.name} • {display.width}×{display.height} • {display.palette.length} colors
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Fit Mode */}
      <div>
        <label className="ink-label">Image Fit Mode</label>
        <p className="text-xs text-white/40 mb-3">
          How should the image fit into the frame?
        </p>
        <div className="space-y-2">
          {FIT_MODE_OPTIONS.map((option) => {
            const isSelected = enhancement.fitMode === option.value;
            return (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#a855f7]/20 border border-[#a855f7]/40'
                    : 'bg-black/20 border border-white/10 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="fitMode"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => setEnhancement({ ...enhancement, fitMode: option.value })}
                  disabled={isProcessing}
                  className="mt-1 accent-[#a855f7]"
                />
                <div className="flex-1">
                  <p className="font-medium text-white">{option.label}</p>
                  <p className="text-xs text-white/50">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Dithering Algorithm */}
      <div>
        <label htmlFor="dithering" className="ink-label">
          Dithering Algorithm
        </label>
        <select
          id="dithering"
          value={dithering}
          onChange={(e) => setDithering(e.target.value as DitheringAlgorithm)}
          className="ink-input"
          disabled={isProcessing}
        >
          {DITHERING_ALGORITHMS.map((algo) => (
            <option key={algo} value={algo}>
              {algo.charAt(0).toUpperCase() + algo.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>
        <p className="text-xs text-white/40 mt-1.5">
          Floyd-Steinberg works best for most photos
        </p>
      </div>

      {/* Advanced Enhancement Options */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Image Enhancement Options
        </button>
        
        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-black/20 border border-white/10 space-y-4">
            {/* Auto Contrast */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enhancement.autoContrast}
                onChange={(e) => setEnhancement({ ...enhancement, autoContrast: e.target.checked })}
                disabled={isProcessing}
                className="w-4 h-4 accent-[#ff47b3]"
              />
              <div>
                <p className="font-medium text-white text-sm">Auto Contrast</p>
                <p className="text-xs text-white/40">Automatically adjust contrast and levels</p>
              </div>
            </label>

            {/* Saturation */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Saturation Boost</span>
                <span className="text-xs text-white/50">{Math.round((enhancement.saturation - 1) * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={enhancement.saturation}
                onChange={(e) => setEnhancement({ ...enhancement, saturation: parseFloat(e.target.value) })}
                disabled={isProcessing}
                className="w-full accent-[#ff47b3]"
              />
              <p className="text-xs text-white/40 mt-1">Boost colors for better e-ink display</p>
            </div>

            {/* Denoise */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enhancement.denoise}
                onChange={(e) => setEnhancement({ ...enhancement, denoise: e.target.checked })}
                disabled={isProcessing}
                className="w-4 h-4 accent-[#ff47b3]"
              />
              <div>
                <p className="font-medium text-white text-sm">Noise Reduction</p>
                <p className="text-xs text-white/40">Reduces speckling in gradients</p>
              </div>
            </label>

            {/* Sharpen */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enhancement.sharpen}
                onChange={(e) => setEnhancement({ ...enhancement, sharpen: e.target.checked })}
                disabled={isProcessing}
                className="w-4 h-4 accent-[#ff47b3]"
              />
              <div>
                <p className="font-medium text-white text-sm">Sharpen</p>
                <p className="text-xs text-white/40">Restore edge clarity after noise reduction</p>
              </div>
            </label>

            {/* Background Color for Letterboxing */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">Letterbox Background</p>
                  <p className="text-xs text-white/40">Color for bars in contain/smart mode</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={enhancement.backgroundColor}
                    onChange={(e) => setEnhancement({ ...enhancement, backgroundColor: e.target.value })}
                    disabled={isProcessing}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                  />
                  <span className="text-xs font-mono text-white/50">{enhancement.backgroundColor}</span>
                </div>
              </label>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEnhancement({ ...enhancement, backgroundColor: '#FFFFFF' })}
                  className="text-xs px-3 py-1.5 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => setEnhancement({ ...enhancement, backgroundColor: '#000000' })}
                  className="text-xs px-3 py-1.5 bg-black text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Black
                </button>
              </div>
            </div>

            {/* Reset to defaults */}
            <button
              type="button"
              onClick={() => setEnhancement(DEFAULT_ENHANCEMENT_OPTIONS)}
              className="text-xs text-[#ff47b3] hover:text-[#22d3ee] transition-colors"
            >
              Reset to recommended settings
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isProcessing}
        className="w-full ink-button disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Process Images'
        )}
      </button>

      {!hasFiles && (
        <p className="text-sm text-white/40 text-center">
          Upload images above to enable processing
        </p>
      )}

      {hasFiles && devices.length === 0 && (
        <p className="text-sm text-white/40 text-center">
          <Link href="/devices" className="text-[#ff47b3] hover:text-[#22d3ee] transition-colors">
            Add a device
          </Link>{' '}
          to start processing images
        </p>
      )}
    </form>
  );
}
