'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ImageMetadata } from '@/lib/types/image';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';
import { Image as ImageIcon, X, Download, Trash2, Eye, Monitor } from 'lucide-react';

interface ImageGalleryProps {
  images: ImageMetadata[];
  categories: Category[];
  devices?: Device[];
  currentDeviceId?: string;
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
        router.refresh(); // Refresh the page to update the gallery
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
      <div className="text-center py-16 ink-card">
        <ImageIcon className="w-16 h-16 mx-auto text-ink-gray/30 mb-4" />
        <p className="text-xl font-medium text-ink-black mb-2">No images yet</p>
        <p className="text-ink-gray">
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
          // Determine thumbnail: use device-specific variant if filtered, otherwise generic thumbnail
          const deviceVariant = currentDeviceId 
            ? image.variants.find((v) => v.deviceId === currentDeviceId)
            : null;
          const thumbnailSrc = deviceVariant
            ? `/images/${image.categoryId}/${image.id}/${deviceVariant.filename}`
            : `/images/${image.categoryId}/${image.id}/thumbnail.png`;

          return (
            <div
              key={image.id}
              className="group relative aspect-[4/3] bg-ink-gray/10 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={thumbnailSrc}
                alt={image.originalFilename}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs text-white/80 truncate">
                    {image.originalFilename}
                  </p>
                </div>
              </div>
              <div
                className="absolute top-2 left-2 w-3 h-3 rounded-full"
                style={{ backgroundColor: getCategoryColor(image.categoryId) }}
              />
              {/* Device count badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Monitor className="w-3 h-3" />
                {image.variants.length}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-ink-gray/20">
              <div>
                <h3 className="font-semibold text-ink-black">
                  {selectedImage.originalFilename}
                </h3>
                <p className="text-sm text-ink-gray">
                  {getCategoryName(selectedImage.categoryId)} •{' '}
                  {formatDate(selectedImage.processedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-ink-gray/10 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview */}
            <div className="p-4 bg-ink-gray/5">
              <img
                src={`/images/${selectedImage.categoryId}/${selectedImage.id}/thumbnail.png`}
                alt={selectedImage.originalFilename}
                className="max-w-full max-h-64 mx-auto rounded-lg"
              />
            </div>

            {/* Device Variants */}
            <div className="p-4">
              <h4 className="font-medium text-ink-black mb-3">
                Device Variants ({selectedImage.variants.length})
              </h4>
              <div className="space-y-2">
                {selectedImage.variants.map((variant) => (
                  <div
                    key={variant.deviceId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      currentDeviceId === variant.deviceId
                        ? 'bg-ink-black/10 border border-ink-black/20'
                        : 'bg-ink-gray/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ink-black rounded flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-ink-black">
                          {getDeviceName(variant.deviceId)}
                        </p>
                        <p className="text-xs text-ink-gray">
                          {variant.width}×{variant.height}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/images/${selectedImage.categoryId}/${selectedImage.id}/${variant.filename}`}
                        download={`${selectedImage.originalFilename.replace(/\.[^.]+$/, '')}-${variant.deviceId}.png`}
                        className="p-2 hover:bg-ink-gray/10 rounded-md"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-ink-gray" />
                      </a>
                      <a
                        href={`/images/${selectedImage.categoryId}/${selectedImage.id}/${variant.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-ink-gray/10 rounded-md"
                        title="View Full Size"
                      >
                        <Eye className="w-4 h-4 text-ink-gray" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="p-4 border-t border-ink-gray/20">
              <h4 className="font-medium text-ink-black mb-3">Metadata</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-ink-gray">Image ID</p>
                  <p className="text-ink-black font-mono text-xs">
                    {selectedImage.id}
                  </p>
                </div>
                <div>
                  <p className="text-ink-gray">Category</p>
                  <p className="text-ink-black">
                    {getCategoryName(selectedImage.categoryId)}
                  </p>
                </div>
                <div>
                  <p className="text-ink-gray">Original Filename</p>
                  <p className="text-ink-black">{selectedImage.originalFilename}</p>
                </div>
                <div>
                  <p className="text-ink-gray">Processed</p>
                  <p className="text-ink-black">
                    {formatDate(selectedImage.processedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 p-4 border-t border-ink-gray/20">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                Delete
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
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-ink-black mb-2">
              Delete Image?
            </h3>
            <p className="text-ink-gray mb-4">
              Are you sure you want to delete "{selectedImage.originalFilename}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="ink-button-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
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
