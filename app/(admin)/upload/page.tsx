'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import ProcessingForm, { type ProcessingOptions } from '@/components/ProcessingForm';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Upload page - upload and process images for e-ink displays
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
    formData.append('enhancement', JSON.stringify(options.enhancement));

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
        <h1 className="text-3xl font-bold text-ink-black">Upload Images</h1>
        <p className="text-ink-gray mt-1">
          Upload and process images for your e-ink devices
        </p>
      </div>

      {/* Results Message */}
      {results && (
        <div
          className={`p-4 rounded-lg border ${
            results.failed === 0
              ? 'bg-green-50 border-green-200'
              : results.success === 0
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {results.failed === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                {results.success > 0 && `${results.success} image(s) processed successfully`}
                {results.success > 0 && results.failed > 0 && ', '}
                {results.failed > 0 && `${results.failed} failed`}
              </p>
              {results.errors.length > 0 && (
                <ul className="text-sm mt-1 text-ink-gray">
                  {results.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              )}
              {results.success > 0 && (
                <button
                  onClick={() => router.push('/gallery')}
                  className="text-sm text-ink-black hover:underline mt-2"
                >
                  View in Gallery →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="ink-card p-6">
          <h2 className="text-xl font-semibold text-ink-black mb-4">
            Select Images
          </h2>
          <ImageUpload
            onFilesSelected={setFiles}
            maxFiles={10}
          />
        </div>

        {/* Processing Options */}
        <div className="ink-card p-6">
          <h2 className="text-xl font-semibold text-ink-black mb-4">
            Processing Options
          </h2>
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

      {/* Help Section */}
      <div className="ink-card p-6 bg-ink-gray/5">
        <h3 className="font-semibold text-ink-black mb-2">Tips for Best Results</h3>
        <ul className="text-sm text-ink-gray space-y-1">
          <li>• Use high-quality source images for better output</li>
          <li>• High-contrast images work best on e-ink displays</li>
          <li>• Floyd-Steinberg dithering is recommended for photos</li>
          <li>• Ordered dithering works well for graphics with sharp edges</li>
        </ul>
      </div>
    </div>
  );
}
