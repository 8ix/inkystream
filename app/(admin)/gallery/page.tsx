'use client';

import { useState, useEffect } from 'react';
import ImageGallery from '@/components/ImageGallery';
import type { ImageMetadata } from '@/lib/types/image';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';

export default function GalleryPage() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [imgRes, catRes, devRes] = await Promise.all([
          fetch('/api/images'),
          fetch('/api/categories'),
          fetch('/api/devices'),
        ]);

        const imgData = await imgRes.json();
        const catData = await catRes.json();
        const devData = await devRes.json();

        if (imgData.success) setImages(imgData.data || []);
        if (catData.success) setCategories(catData.data.categories || []);
        if (devData.success) setDevices(devData.data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Gallery</h1>
        <p className="text-white/60">Browse and manage your processed images</p>
      </div>
      <ImageGallery images={images} categories={categories} devices={devices} />
    </div>
  );
}
