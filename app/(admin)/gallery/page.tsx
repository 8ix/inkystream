import { getAllImages, getCategoryImages } from '@/lib/utils/image';
import { getCategories } from '@/lib/utils/categories';
import { getDevices } from '@/lib/utils/devices';
import ImageGallery from '@/components/ImageGallery';
import DeviceFilter from '@/components/DeviceFilter';
import Link from 'next/link';

interface GalleryPageProps {
  searchParams: Promise<{ category?: string; device?: string }>;
}

/**
 * Gallery page - view and manage processed images
 */
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
          <h1 className="text-3xl font-bold text-ink-black">
            {currentCategory ? currentCategory.name : 'Gallery'}
          </h1>
          <p className="text-ink-gray mt-1">
            {currentCategory
              ? currentCategory.description
              : 'Browse all processed images'}
            {currentDevice && (
              <span className="ml-2 px-2 py-0.5 bg-ink-black/10 rounded text-xs">
                Filtered by: {currentDevice.name}
              </span>
            )}
          </p>
        </div>
        <Link href="/upload" className="ink-button">
          Upload Images
        </Link>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1">
          <Link
            href={deviceFilter ? `/gallery?device=${deviceFilter}` : '/gallery'}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !categoryFilter
                ? 'bg-ink-black text-ink-white'
                : 'bg-ink-gray/10 text-ink-black hover:bg-ink-gray/20'
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/gallery?category=${category.id}${deviceFilter ? `&device=${deviceFilter}` : ''}`}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === category.id
                  ? 'bg-ink-black text-ink-white'
                  : 'bg-ink-gray/10 text-ink-black hover:bg-ink-gray/20'
              }`}
              style={
                categoryFilter === category.id
                  ? undefined
                  : { borderLeft: `3px solid ${category.colour}` }
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
      <p className="text-sm text-ink-gray">
        {images.length} image{images.length !== 1 ? 's' : ''}
        {categoryFilter && ` in ${currentCategory?.name}`}
        {deviceFilter && ` for ${currentDevice?.name}`}
      </p>

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
