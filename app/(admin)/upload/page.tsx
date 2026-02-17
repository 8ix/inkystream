'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import ProcessingForm, { type ProcessingOptions } from '@/components/ProcessingForm';
import ImageEditor from '@/components/ImageEditor';
import Portal from '@/components/Portal';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import type { ImageAdjustments } from '@/lib/client/image-processing';
import { CheckCircle, AlertCircle, Upload, Sparkles, Info, Sliders } from 'lucide-react';

/**
 * Upload page - simplified image upload and processing for e-ink displays
 */
export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [displays, setDisplays] = useState<DisplayProfile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  
  // Image editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingFileIndex, setEditingFileIndex] = useState(0);
  const [customAdjustments, setCustomAdjustments] = useState<ImageAdjustments | null>(null);

  // Load categories, devices, and displays
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, devRes, dispRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/devices'),
          fetch('/api/displays'),
        ]);

        const catData = await catRes.json();
        const devData = await devRes.json();
        const dispData = await dispRes.json();

        if (catData.success) setCategories(catData.data.categories || []);
        if (devData.success) setDevices(devData.data || []);
        if (dispData.success) setDisplays(dispData.data.displays || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }

    loadData();
  }, []);

  // Get the first device's display for the editor preview
  const getEditorDisplay = (): DisplayProfile | null => {
    if (devices.length === 0) return displays[0] || null;
    const firstDevice = devices[0];
    return displays.find(d => d.id === firstDevice.displayId) || displays[0] || null;
  };

  const handleOpenEditor = (fileIndex: number = 0) => {
    setEditingFileIndex(fileIndex);
    setShowEditor(true);
  };

  const handleEditorConfirm = (adjustments: ImageAdjustments) => {
    setCustomAdjustments(adjustments);
    setShowEditor(false);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
  };

  const handleProcess = async (options: ProcessingOptions) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults(null);

    // Merge custom adjustments with the enhancement options
    const enhancement = { ...options.enhancement };
    if (customAdjustments) {
      // Convert ImageAdjustments (0-200 scale) to enhancement options (multiplier scale)
      enhancement.saturation = (customAdjustments.saturation / 100) * (enhancement.saturation || 1);
      enhancement.contrast = (customAdjustments.contrast / 100) * (enhancement.contrast || 1);
      // Add brightness as gamma adjustment (inverse relationship)
      if (customAdjustments.brightness !== 100) {
        const brightnessMultiplier = customAdjustments.brightness / 100;
        enhancement.gamma = (enhancement.gamma || 2.0) / brightnessMultiplier;
      }
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('categoryId', options.categoryId);
    formData.append('deviceIds', JSON.stringify(options.deviceIds));
    formData.append('dithering', options.dithering);
    formData.append('enhancement', JSON.stringify(enhancement));

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResults({
          success: data.data.processed || 0,
          failed: data.data.failed || 0,
          errors: data.data.errors || [],
        });
        setFiles([]);
        setCustomAdjustments(null);
      } else {
        setResults({
          success: 0,
          failed: files.length,
          errors: [data.error || 'Processing failed'],
        });
      }
    } catch (error) {
      setResults({
        success: 0,
        failed: files.length,
        errors: ['An unexpected error occurred'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const editorDisplay = getEditorDisplay();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#ff47b3] to-[#a855f7] glow-pink">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Upload Images</h1>
        </div>
        <p className="text-white/60">
          Tell us what you&apos;re uploading and we&apos;ll optimize it for your e-ink displays
        </p>
      </div>

      {/* Results Message */}
      {results && (
        <div
          className={`p-5 rounded-2xl border backdrop-blur-sm ${
            results.failed === 0
              ? 'bg-green-500/20 border-green-500/30'
              : results.success === 0
              ? 'bg-red-500/20 border-red-500/30'
              : 'bg-yellow-500/20 border-yellow-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            {results.failed === 0 ? (
              <CheckCircle className="w-6 h-6 text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-white">
                {results.success > 0 && `${results.success} image(s) processed successfully`}
                {results.success > 0 && results.failed > 0 && ', '}
                {results.failed > 0 && `${results.failed} failed`}
              </p>
              {results.errors.length > 0 && (
                <ul className="text-sm mt-2 text-white/70">
                  {results.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              )}
              {results.success > 0 && (
                <button
                  onClick={() => router.push('/gallery')}
                  className="text-sm text-[#ff47b3] hover:text-[#22d3ee] font-medium mt-3 transition-colors"
                >
                  View in Gallery →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="ink-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#ff47b3]" />
            <h2 className="text-xl font-bold text-white">Select Images</h2>
          </div>
          <ImageUpload
            onFilesSelected={setFiles}
            onEditRequest={editorDisplay ? handleOpenEditor : undefined}
            maxFiles={10}
            showEditButtons={!!editorDisplay && files.length > 0}
          />
          
          {/* Adjustments indicator */}
          {files.length > 0 && customAdjustments && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/30">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#22d3ee]" />
                  <span className="text-sm text-white">Custom adjustments applied</span>
                </div>
                <button
                  onClick={() => setCustomAdjustments(null)}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  Reset
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2 text-center">
                Hover over any image and click <Sliders className="w-3 h-3 inline" /> to preview
              </p>
            </div>
          )}
          
          {/* Hint when no adjustments */}
          {files.length > 0 && !customAdjustments && editorDisplay && (
            <p className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40 text-center">
              Hover over any image and click <Sliders className="w-3 h-3 inline" /> to preview & adjust colors
            </p>
          )}
        </div>

        {/* Processing Options */}
        <div className="ink-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#a855f7]" />
            <h2 className="text-xl font-bold text-white">Configure</h2>
          </div>
          <ProcessingForm
            categories={categories}
            devices={devices}
            displays={displays}
            onSubmit={handleProcess}
            isProcessing={isProcessing}
            hasFiles={files.length > 0}
          />
        </div>
      </div>

      {/* How it Works */}
      <div className="ink-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-[#22d3ee]" />
          <h3 className="font-bold text-white">How It Works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
            <div className="text-2xl mb-2">1️⃣</div>
            <p className="font-medium text-white mb-1">Upload your images</p>
            <p className="text-white/50">Drag and drop or click to select up to 10 images</p>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
            <div className="text-2xl mb-2">2️⃣</div>
            <p className="font-medium text-white mb-1">Preview & adjust</p>
            <p className="text-white/50">Optional: fine-tune saturation, contrast & brightness</p>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
            <div className="text-2xl mb-2">3️⃣</div>
            <p className="font-medium text-white mb-1">Tell us what it is</p>
            <p className="text-white/50">We&apos;ll apply the best settings for your content</p>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
            <div className="text-2xl mb-2">4️⃣</div>
            <p className="font-medium text-white mb-1">Choose your devices</p>
            <p className="text-white/50">We&apos;ll create optimized versions for each display</p>
          </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {showEditor && files[editingFileIndex] && editorDisplay && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleEditorCancel}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
                            bg-gradient-to-br from-[#1a1a2e] to-[#16213e] 
                            rounded-2xl border border-white/10 shadow-2xl">
              <div className="p-6">
                <ImageEditor
                  file={files[editingFileIndex]}
                  palette={editorDisplay.palette}
                  targetWidth={editorDisplay.width}
                  targetHeight={editorDisplay.height}
                  onConfirm={handleEditorConfirm}
                  onCancel={handleEditorCancel}
                />
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
