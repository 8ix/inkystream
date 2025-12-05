'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ImageMetadata } from '@/lib/types/image';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';
import { Image as ImageIcon, X, Download, Trash2, Eye, Monitor, Calendar, FileImage } from 'lucide-react';

interface ImageGalleryProps {
  images: ImageMetadata[];
  categories: Category[];
  devices?: Device[];
  currentDeviceId?: string;
}

/**
 * Helper to get image URL through the API
 * In local development, no key is needed
 * In production, images are served through the authenticated API
 */
function getImageApiUrl(categoryId: string, imageId: string, filename: string): string {
  return `/api/img/${categoryId}/${imageId}/${filename}`;
}

/**
 * Gallery component displaying processed images
 */
export default function ImageGallery({ 
  images, 
  categories, 
  devices = [],
  currentDeviceId 
}: ImageGalleryProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!selectedImage || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/images/${selectedImage.categoryId}/${selectedImage.id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        setSelectedImage(null);
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        alert('Failed to delete image: ' + data.error);
      }
    } catch (error) {
      alert('An error occurred while deleting the image');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.colour || '#888888';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    return device?.name || deviceId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-20 ink-card">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center
                        bg-gradient-to-br from-[#ff47b3]/20 to-[#a855f7]/20 border border-white/10">
          <ImageIcon className="w-10 h-10 text-[#ff47b3]/50" />
        </div>
        <p className="text-xl font-bold text-white mb-2">No images yet</p>
        <p className="text-white/50">
          Upload and process images to see them here
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image) => {
          const deviceVariant = currentDeviceId 
            ? image.variants.find((v) => v.deviceId === currentDeviceId)
            : null;
          const thumbnailSrc = deviceVariant
            ? getImageApiUrl(image.categoryId, image.id, deviceVariant.filename)
            : getImageApiUrl(image.categoryId, image.id, 'thumbnail.png');

          return (
            <div
              key={image.id}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer
                         bg-black/20 border border-white/10 hover:border-[#ff47b3]/50 
                         transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#ff47b3]/10"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={thumbnailSrc}
                alt={image.originalFilename}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs text-white truncate font-medium">
                    {image.originalFilename}
                  </p>
                </div>
              </div>
              <div
                className="absolute top-2 left-2 w-3 h-3 rounded-full shadow-lg"
                style={{ backgroundColor: getCategoryColor(image.categoryId), boxShadow: `0 0 10px ${getCategoryColor(image.categoryId)}` }}
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Monitor className="w-3 h-3" />
                {image.variants.length}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Screen Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8"
          onClick={() => setSelectedImage(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          
          {/* Modal Content */}
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl
                       bg-gradient-to-b from-[#531153] to-[#3d0d3d] border border-white/20
                       shadow-2xl shadow-[#ff47b3]/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 
                            bg-gradient-to-b from-[#531153] to-transparent backdrop-blur-sm border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedImage.originalFilename}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: getCategoryColor(selectedImage.categoryId) }}
                    />
                    {getCategoryName(selectedImage.categoryId)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(selectedImage.processedAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Image Preview */}
            <div className="p-6 flex justify-center bg-black/20">
              <img
                src={getImageApiUrl(selectedImage.categoryId, selectedImage.id, 'thumbnail.png')}
                alt={selectedImage.originalFilename}
                className="max-w-full max-h-80 rounded-xl shadow-2xl"
              />
            </div>

            {/* Device Variants */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-5 h-5 text-[#ff47b3]" />
                <h4 className="font-bold text-white">Device Variants ({selectedImage.variants.length})</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedImage.variants.map((variant) => (
                  <div
                    key={variant.deviceId}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                      currentDeviceId === variant.deviceId
                        ? 'bg-[#ff47b3]/20 border border-[#ff47b3]/40'
                        : 'bg-black/20 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center
                                      bg-gradient-to-br from-[#ff47b3] to-[#a855f7]">
                        <Monitor className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{getDeviceName(variant.deviceId)}</p>
                        <p className="text-xs text-white/50">{variant.width}×{variant.height}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={getImageApiUrl(selectedImage.categoryId, selectedImage.id, variant.filename)}
                        download={`${selectedImage.originalFilename.replace(/\.[^.]+$/, '')}-${variant.deviceId}.png`}
                        className="p-2 rounded-lg bg-white/10 hover:bg-[#22d3ee]/20 hover:text-[#22d3ee] text-white/70 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <a
                        href={getImageApiUrl(selectedImage.categoryId, selectedImage.id, variant.filename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/10 hover:bg-[#a855f7]/20 hover:text-[#a855f7] text-white/70 transition-colors"
                        title="View Full Size"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <FileImage className="w-5 h-5 text-[#22d3ee]" />
                <h4 className="font-bold text-white">Metadata</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Image ID</p>
                  <p className="text-white font-mono text-xs truncate">{selectedImage.id}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Category</p>
                  <p className="text-white text-sm">{getCategoryName(selectedImage.categoryId)}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Original File</p>
                  <p className="text-white text-sm truncate">{selectedImage.originalFilename}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Processed</p>
                  <p className="text-white text-sm">{formatDate(selectedImage.processedAt)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 flex justify-between gap-3 p-5 
                            bg-gradient-to-t from-[#3d0d3d] to-transparent backdrop-blur-sm border-t border-white/10">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold
                           bg-red-500/20 text-red-400 border border-red-500/30
                           hover:bg-red-500/30 transition-colors"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                Delete Image
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="ink-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          
          {/* Modal Content */}
          <div
            className="relative w-full max-w-md p-6 rounded-2xl
                       bg-gradient-to-b from-[#531153] to-[#3d0d3d] border border-white/20
                       shadow-2xl shadow-red-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                            bg-red-500/20 border border-red-500/30">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">
              Delete Image?
            </h3>
            <p className="text-white/60 text-center mb-6">
              Are you sure you want to delete <span className="text-white font-medium">&quot;{selectedImage.originalFilename}&quot;</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 ink-button-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold
                           bg-red-500 text-white hover:bg-red-600 transition-colors
                           disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
