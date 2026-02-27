'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  onEditRequest?: (fileIndex: number) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  showEditButtons?: boolean;
  clearTrigger?: number; // Increment this to trigger a clear from parent
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
  onEditRequest,
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  showEditButtons = false,
  clearTrigger = 0,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);

  // Clear previews when clearTrigger changes
  useEffect(() => {
    if (clearTrigger > 0 && previews.length > 0) {
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
      setPreviews([]);
    }
  }, [clearTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

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
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300',
          isDragActive 
            ? 'border-[#ff47b3] bg-[#ff47b3]/10 scale-[1.02]' 
            : 'border-white/30 hover:border-white/50 hover:bg-white/5'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 py-10 px-4">
          <div className={cn(
            'p-4 rounded-2xl transition-all duration-300',
            isDragActive 
              ? 'bg-gradient-to-br from-[#ff47b3] to-[#a855f7] shadow-lg shadow-[#ff47b3]/30' 
              : 'bg-white/10'
          )}>
            <Upload className={cn(
              'w-8 h-8 transition-colors',
              isDragActive ? 'text-white' : 'text-white/50'
            )} />
          </div>
          {isDragActive ? (
            <p className="text-lg font-bold text-[#ff47b3]">Drop images here...</p>
          ) : (
            <>
              <p className="text-white font-semibold">
                Drag and drop images here
              </p>
              <p className="text-sm text-white/50">
                or click to select files
              </p>
            </>
          )}
          <p className="text-xs text-white/30">
            Supports JPEG, PNG, WebP • Max {maxFiles} files
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4 text-[#ff47b3]" />
              <p className="text-sm font-semibold text-white">
                Selected Images ({previews.length})
              </p>
            </div>
            <button
              onClick={() => {
                previews.forEach((p) => URL.revokeObjectURL(p.preview));
                setPreviews([]);
                onFilesSelected([]);
              }}
              className="text-sm text-white/50 hover:text-[#ff47b3] transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div
                key={preview.preview}
                className="relative aspect-square rounded-xl overflow-hidden group
                           border border-white/10 hover:border-[#ff47b3]/50 transition-all duration-300
                           hover:scale-[1.02] hover:shadow-lg hover:shadow-[#ff47b3]/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.preview}
                  alt={preview.file.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-white 
                             opacity-0 group-hover:opacity-100 transition-all duration-200
                             hover:bg-red-500 hover:scale-110"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Edit button */}
                {showEditButtons && onEditRequest && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRequest(index);
                    }}
                    className="absolute top-2 left-2 p-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-white 
                               opacity-0 group-hover:opacity-100 transition-all duration-200
                               hover:bg-[#22d3ee] hover:scale-110"
                    title="Preview & Adjust"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-xs text-white truncate font-medium">
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
