import { getAllImages, getCategoryImages } from '@/lib/utils/image';
import { getCategories } from '@/lib/utils/categories';
import { getDevices } from '@/lib/utils/devices';
import ImageGallery from '@/components/ImageGallery';
import DeviceFilter from '@/components/DeviceFilter';
import Link from 'next/link';
import { Image, Upload, Sparkles } from 'lucide-react';

interface GalleryPageProps {
  searchParams: Promise<{ category?: string; device?: string }>;
}

/**
 * Gallery page - view and manage processed images
 */
export const revalidate = 0; // Disable caching to always show latest images
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const categoryFilter = params.category;
  const deviceFilter = params.device;
  
  const [categories, devices, allImages] = await Promise.all([
    getCategories(),
    getDevices(),
    categoryFilter ? getCategoryImages(categoryFilter) : getAllImages(),
  ]);

  // Apply device filter if specified
  let images = allImages;
  if (deviceFilter) {
    images = allImages.filter((image) =>
      image.variants.some((v) => v.deviceId === deviceFilter)
    );
  }

  const currentCategory = categories.find((c) => c.id === categoryFilter);
  const currentDevice = devices.find((d) => d.id === deviceFilter);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#3b82f6] glow-purple">
              <Image className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              {currentCategory ? currentCategory.name : 'Gallery'}
            </h1>
          </div>
          <p className="text-white/60">
            {currentCategory
              ? currentCategory.description
              : 'Browse all processed images'}
            {currentDevice && (
              <span className="ml-2 px-3 py-1 bg-[#ff47b3]/20 border border-[#ff47b3]/30 rounded-full text-xs text-[#ff47b3]">
                {currentDevice.name}
              </span>
            )}
          </p>
        </div>
        <Link href="/upload" className="ink-button flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Images
        </Link>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1">
          <Link
            href={deviceFilter ? `/gallery?device=${deviceFilter}` : '/gallery'}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              !categoryFilter
                ? 'bg-gradient-to-r from-[#ff47b3] to-[#a855f7] text-white shadow-lg shadow-[#ff47b3]/20'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/gallery?category=${category.id}${deviceFilter ? `&device=${deviceFilter}` : ''}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                categoryFilter === category.id
                  ? 'bg-gradient-to-r from-[#ff47b3] to-[#a855f7] text-white shadow-lg shadow-[#ff47b3]/20'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10'
              }`}
              style={
                categoryFilter !== category.id
                  ? { borderLeftColor: category.colour, borderLeftWidth: '3px' }
                  : undefined
              }
            >
              {category.name}
            </Link>
          ))}
        </div>

        {/* Device Filter */}
        <DeviceFilter devices={devices} currentDeviceId={deviceFilter} />
      </div>

      {/* Image Count */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#ff47b3]" />
        <p className="text-sm text-white/60">
          <span className="text-white font-semibold">{images.length}</span> image{images.length !== 1 ? 's' : ''}
          {categoryFilter && ` in ${currentCategory?.name}`}
          {deviceFilter && ` for ${currentDevice?.name}`}
        </p>
      </div>

      {/* Image Gallery */}
      <ImageGallery 
        images={images} 
        categories={categories} 
        devices={devices}
        currentDeviceId={deviceFilter}
      />
    </div>
  );
}
