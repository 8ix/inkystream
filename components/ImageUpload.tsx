'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

interface PreviewFile {
  file: File;
  preview: string;
}

/**
 * Image upload component with drag-and-drop support
 */
export default function ImageUpload({
  onFilesSelected,
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newPreviews = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setPreviews((prev) => [...prev, ...newPreviews].slice(0, maxFiles));
      onFilesSelected([...previews.map((p) => p.file), ...acceptedFiles].slice(0, maxFiles));
    },
    [previews, maxFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index].preview);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    onFilesSelected(newPreviews.map((p) => p.file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    multiple: true,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'dropzone cursor-pointer',
          isDragActive && 'dropzone-active border-ink-black'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="p-4 bg-ink-gray/10 rounded-full">
            <Upload className="w-8 h-8 text-ink-gray" />
          </div>
          {isDragActive ? (
            <p className="text-ink-black font-medium">Drop images here...</p>
          ) : (
            <>
              <p className="text-ink-black font-medium">
                Drag and drop images here
              </p>
              <p className="text-sm text-ink-gray">
                or click to select files
              </p>
            </>
          )}
          <p className="text-xs text-ink-gray">
            Supports JPEG, PNG, WebP • Max {maxFiles} files
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-black">
              Selected Images ({previews.length})
            </p>
            <button
              onClick={() => {
                previews.forEach((p) => URL.revokeObjectURL(p.preview));
                setPreviews([]);
                onFilesSelected([]);
              }}
              className="text-sm text-ink-gray hover:text-ink-black"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {previews.map((preview, index) => (
              <div
                key={preview.preview}
                className="relative aspect-square bg-ink-gray/10 rounded-lg overflow-hidden group"
              >
                <img
                  src={preview.preview}
                  alt={preview.file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 bg-ink-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white truncate">
                    {preview.file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

