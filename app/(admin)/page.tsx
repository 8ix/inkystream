'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, Image as ImageIcon, Palette, Monitor, ArrowRight, Code, Sparkles } from 'lucide-react';
import type { ImageMetadata } from '@/lib/types/image';
import type { Category } from '@/lib/types/category';
import type { Device } from '@/lib/types/device';

function getThumbnailUrl(categoryId: string, imageId: string): string {
  return `/api/img/${categoryId}/${imageId}/thumbnail.png`;
}

export default function AdminDashboard() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
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
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recentImages = images.slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/60">Welcome to InkyStream Admin</p>
      </div>

      {/* What is InkyStream */}
      <div className="ink-card p-6 border-2 border-[#ff47b3]/30">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#ff47b3] to-[#a855f7] flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">What is InkyStream?</h2>
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              InkyStream is a specialized tool for creating <span className="text-[#ff47b3] font-semibold">dithered images optimized for e-ink displays</span>. 
              This isn't just an image library—it's purpose-built to transform your photos (both color and black & white) into images that look beautiful on e-ink screens.
            </p>
            
            <div className="bg-black/30 rounded-lg p-4 border border-white/10 mb-3">
              <h3 className="text-white font-semibold text-sm mb-2">Why Dithering Matters</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-3">
                E-ink screens can only display a fixed number of shades—often just black and white on monochrome panels, 
                or 7 colors on color displays. Standard photos have 256 shades of grey, so displaying them directly results 
                in flat, muddy images with lost detail.
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                Dithering uses patterns of dots to simulate mid-tones and gradients—your eye blends them together to perceive 
                shades that aren't actually there. It's the same technique used in old newspaper photos. Without dithering, 
                photos look poor on e-ink. With it, they look significantly better.
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-2">Dithering Algorithm</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                InkyStream uses <span className="text-[#22d3ee] font-medium">Floyd-Steinberg dithering</span>, the industry-standard algorithm 
                for photo processing. It spreads pixel error to neighboring pixels, creating natural-looking results that preserve detail 
                and smooth gradients—perfect for displaying photos on e-ink screens.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage guidance */}
      <div className="ink-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Getting Started with InkyStream</h2>
        <p className="text-white/80 text-sm mb-5">
          Transform your photos into beautiful e-ink displays in three simple steps:
        </p>
        
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Create a Device</h3>
              <p className="text-white/60 text-sm">
                Go to <Link href="/devices" className="text-[#22d3ee] hover:underline font-medium">Devices</Link> and 
                add your e-ink frame. Choose your display type (like Pimoroni Inky Frame or Waveshare) 
                and give it a name like "Living Room Frame".
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff47b3] to-[#a855f7] flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Upload Your Photos</h3>
              <p className="text-white/60 text-sm">
                Head to <Link href="/upload" className="text-[#22d3ee] hover:underline font-medium">Upload</Link>, 
                drop in your images, select a category, and choose which device(s) to optimize for. 
                InkyStream will automatically dither and format them perfectly for your display.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Connect Your Frame</h3>
              <p className="text-white/60 text-sm">
                In <Link href="/devices" className="text-[#22d3ee] hover:underline font-medium">Devices</Link>, 
                click the code icon next to your device to get ready-to-use MicroPython code. 
                Copy it to your e-ink frame and watch your photos come to life!
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/devices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] text-white text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
          >
            <Monitor className="w-4 h-4" />
            Create Your First Device
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#22d3ee]/30 text-[#22d3ee] text-sm font-medium hover:bg-[#22d3ee]/10 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Images
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="ink-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#22d3ee]/20 to-[#06b6d4]/20">
              <ImageIcon className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{images.length}</p>
              <p className="text-sm text-white/50">Images</p>
            </div>
          </div>
          <div className="ink-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#f59e0b]/20 to-[#d97706]/20">
              <Palette className="w-6 h-6 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
              <p className="text-sm text-white/50">Categories</p>
            </div>
          </div>
          <div className="ink-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#10b981]/20 to-[#059669]/20">
              <Monitor className="w-6 h-6 text-[#10b981]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{devices.length}</p>
              <p className="text-sm text-white/50">Devices</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/upload"
          className="ink-card p-6 hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#ff47b3] to-[#a855f7]">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Upload</h2>
          </div>
          <p className="text-white/60 text-sm">Upload and process images for your e-ink displays</p>
        </Link>

        <Link
          href="/gallery"
          className="ink-card p-6 hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#22d3ee] to-[#06b6d4]">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Gallery</h2>
          </div>
          <p className="text-white/60 text-sm">Browse and manage your processed images</p>
        </Link>

        <Link
          href="/categories"
          className="ink-card p-6 hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706]">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Categories</h2>
          </div>
          <p className="text-white/60 text-sm">Organize your images into categories</p>
        </Link>

        <Link
          href="/devices"
          className="ink-card p-6 hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669]">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Devices</h2>
          </div>
          <p className="text-white/60 text-sm">Configure your e-ink display devices</p>
        </Link>
      </div>

      {/* Recent uploads */}
      {!isLoading && recentImages.length > 0 && (
        <div className="ink-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent uploads</h2>
            <Link
              href="/gallery"
              className="text-sm text-[#22d3ee] hover:text-[#06b6d4] font-medium transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {recentImages.map((img) => (
              <Link
                key={img.id}
                href="/gallery"
                className="block rounded-xl overflow-hidden border border-white/10 bg-black/20 aspect-square hover:border-[#22d3ee]/40 transition-colors"
              >
                <Image
                  src={getThumbnailUrl(img.categoryId, img.id)}
                  alt={img.originalFilename}
                  width={120}
                  height={120}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
