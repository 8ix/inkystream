'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import { 
  IMAGE_TYPE_PRESETS,
  IMAGE_TYPES,
  FIT_MODE_OPTIONS,
  createEnhancementFromPreset,
  type ImageType,
  type DitheringAlgorithm,
  type EnhancementOptions,
  type FitMode,
} from '@/lib/processors/dither-types';
import { Monitor, Plus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

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
 * Simplified form component for image processing
 * Users select what type of image they're uploading, and we handle the rest
 */
export default function ProcessingForm({
  categories,
  devices,
  displays,
  onSubmit,
  isProcessing,
  hasFiles,
}: ProcessingFormProps) {
  const [imageType, setImageType] = useState<ImageType>('photograph');
  const [categoryId, setCategoryId] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [fitMode, setFitMode] = useState<FitMode>('smart');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedPreset = IMAGE_TYPE_PRESETS[imageType];

  // Auto-select first category if none selected and categories are available
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Auto-select the only device if there's just one
  useEffect(() => {
    if (devices.length === 1 && selectedDevices.length === 0) {
      setSelectedDevices([devices[0].id]);
    }
  }, [devices, selectedDevices.length]);

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

    const enhancement = createEnhancementFromPreset(selectedPreset, fitMode, backgroundColor);

    onSubmit({
      categoryId,
      deviceIds: selectedDevices,
      dithering: selectedPreset.algorithm,
      enhancement,
    });
  };

  const isValid = categoryId && selectedDevices.length > 0 && hasFiles;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Type Selection - The main question */}
      <div>
        <label className="ink-label flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ff47b3]" />
          What are you uploading?
        </label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {IMAGE_TYPES.map((type) => {
            const preset = IMAGE_TYPE_PRESETS[type];
            const isSelected = imageType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setImageType(type)}
                disabled={isProcessing}
                className={`p-4 rounded-xl text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#ff47b3]/30 to-[#a855f7]/30 border-2 border-[#ff47b3] scale-[1.02]'
                    : 'bg-black/20 border border-white/10 hover:border-white/30'
                }`}
              >
                <div className="text-2xl mb-2">{preset.icon}</div>
                <p className="font-bold text-white text-sm">{preset.label}</p>
                <p className="text-xs text-white/50 mt-1 line-clamp-2">{preset.examples}</p>
              </button>
            );
          })}
        </div>
        
        {/* Show what settings will be used */}
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-[#ff47b3]/10 to-[#a855f7]/10 border border-[#ff47b3]/20">
          <p className="text-xs text-white/70">
            <span className="text-[#ff47b3] font-medium">Optimized for {selectedPreset.label}:</span>{' '}
            {selectedPreset.description}
          </p>
          <p className="text-xs text-white/40 mt-1">
            Using {selectedPreset.algorithm.charAt(0).toUpperCase() + selectedPreset.algorithm.slice(1).replace('-', ' ')} algorithm
            {selectedPreset.saturation > 1 && ` • +${Math.round((selectedPreset.saturation - 1) * 100)}% saturation`}
            {selectedPreset.denoise && ' • Noise reduction'}
            {selectedPreset.sharpen && ' • Sharpening'}
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <label htmlFor="category" className="ink-label">
          Save to Category
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
      </div>

      {/* Device Selection */}
      <div>
        <label className="ink-label">Target Devices</label>
        
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
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
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
                    className="accent-[#ff47b3]"
                  />
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected 
                      ? 'bg-gradient-to-br from-[#ff47b3] to-[#a855f7]' 
                      : 'bg-white/10'
                  }`}>
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{device.name}</p>
                    {display && (
                      <p className="text-xs text-white/50">
                        {display.width}×{display.height} • {display.palette.length} colors
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Advanced Options (collapsed) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced Options
        </button>
        
        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-black/20 border border-white/10 space-y-4">
            {/* Fit Mode */}
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Image Fit Mode</label>
              <div className="space-y-2">
                {FIT_MODE_OPTIONS.map((option) => {
                  const isSelected = fitMode === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#a855f7]/20 border border-[#a855f7]/40'
                          : 'bg-black/10 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="fitMode"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => setFitMode(option.value)}
                        disabled={isProcessing}
                        className="mt-0.5 accent-[#a855f7]"
                      />
                      <div>
                        <p className="font-medium text-white text-sm">{option.label}</p>
                        <p className="text-xs text-white/40">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Letterbox Background
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  disabled={isProcessing}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBackgroundColor('#FFFFFF')}
                    className="text-xs px-3 py-1.5 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                  >
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundColor('#000000')}
                    className="text-xs px-3 py-1.5 bg-black text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Black
                  </button>
                </div>
              </div>
            </div>
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
          `Process as ${selectedPreset.label}`
        )}
      </button>

      {/* Help text */}
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
