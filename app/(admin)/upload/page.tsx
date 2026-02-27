'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import ProcessingForm, { type ProcessingOptions } from '@/components/ProcessingForm';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import { CheckCircle, AlertCircle, Upload, Sparkles, ArrowRight } from 'lucide-react';

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
  const [clearTrigger, setClearTrigger] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);

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

  const handleProcess = async (options: ProcessingOptions) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('categoryId', options.categoryId);
    formData.append('deviceIds', JSON.stringify(options.deviceIds));
    formData.append('dithering', options.dithering);
    formData.append('fitMode', options.fitMode);
    formData.append('backgroundColor', options.backgroundColor);

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
        // Clear the form and images
        setFiles([]);
        setClearTrigger(prev => prev + 1);
        setResetTrigger(prev => prev + 1);
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
          className={`p-6 rounded-2xl border backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500 ${
            results.failed === 0
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/40 shadow-lg shadow-green-500/10'
              : results.success === 0
              ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-400/40'
              : 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/40'
          }`}
        >
          <div className="flex items-start gap-4">
            {results.failed === 0 ? (
              <div className="p-3 rounded-xl bg-green-500/20">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-red-500/20">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                {results.failed === 0 && results.success > 0 && '✨ Success!'}
                {results.failed > 0 && results.success === 0 && 'Processing Failed'}
                {results.failed > 0 && results.success > 0 && 'Partially Complete'}
              </h3>
              <p className="text-white/80 text-sm mb-3">
                {results.success > 0 && (
                  <>
                    {results.success === 1 
                      ? '1 image has been processed and optimized for your devices'
                      : `${results.success} images have been processed and optimized for your devices`
                    }
                  </>
                )}
                {results.success > 0 && results.failed > 0 && ', but '}
                {results.failed > 0 && (
                  <>
                    {results.failed === 1 ? '1 image failed' : `${results.failed} images failed`}
                  </>
                )}
              </p>
              {results.errors.length > 0 && (
                <ul className="text-sm mb-3 text-white/70 space-y-1 bg-black/20 rounded-lg p-3">
                  {results.errors.map((error, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-3">
                {results.success > 0 && (
                  <button
                    onClick={() => router.push('/gallery')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] text-white text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
                  >
                    View in Gallery
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setResults(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm font-medium hover:bg-white/5 transition-all"
                >
                  Dismiss
                </button>
              </div>
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
            maxFiles={10}
            clearTrigger={clearTrigger}
          />
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
            resetTrigger={resetTrigger}
          />
        </div>
      </div>

    </div>
  );
}
