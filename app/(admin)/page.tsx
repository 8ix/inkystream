import { getCategoriesWithCounts } from '@/lib/utils/categories';
import { getDisplayProfiles } from '@/lib/displays/profiles';
import { getAllImages } from '@/lib/utils/image';
import { getDevices } from '@/lib/utils/devices';
import Link from 'next/link';
import { Upload, Image, Layers, Monitor, Sparkles, ArrowRight, Zap } from 'lucide-react';

/**
 * Admin Dashboard - Overview of the image library
 */
export const revalidate = 0; // Disable caching to always show latest data
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export default async function AdminDashboard() {
  const [categories, displays, images, devices] = await Promise.all([
    getCategoriesWithCounts(),
    getDisplayProfiles(),
    getAllImages(),
    getDevices(),
  ]);

  const totalImages = images.length;
  const recentImages = images.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">
          Welcome back<span className="text-gradient">!</span>
        </h1>
        <p className="text-white/60 mt-2 text-lg">
          InkyStream runs best as a local Raspberry Pi server: generate dithered images and serve API feeds to all your e-ink frames over your LAN.
        </p>
        <p className="text-white/40 text-sm mt-1">
          Purpose-built for privacy on your own hardware. If you expose it beyond your LAN, add API key auth and HTTPS.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Images */}
        <div className="ink-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ff47b3] to-[#d835ba] glow-pink">
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60 font-medium">Total Images</p>
              <p className="text-3xl font-bold text-white">{totalImages}</p>
            </div>
          </div>
        </div>

        {/* Devices */}
        <div className="ink-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#8b5cf6] glow-purple">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60 font-medium">Devices</p>
              <p className="text-3xl font-bold text-white">{devices.length}</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="ink-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] glow-cyan">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60 font-medium">Categories</p>
              <p className="text-3xl font-bold text-white">{categories.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Upload */}
        <Link 
          href="/upload" 
          className="group relative p-6 rounded-2xl overflow-hidden transition-all duration-300
                     bg-gradient-to-br from-[#ff47b3] to-[#a855f7] 
                     shadow-xl shadow-[#ff47b3]/30 hover:shadow-2xl hover:shadow-[#ff47b3]/40 
                     hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white/80 font-medium">Quick Action</p>
              <p className="text-lg font-bold text-white">Upload Images</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Categories Section */}
      <div className="ink-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-[#ff47b3]" />
          <h2 className="text-xl font-bold text-white">Categories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/gallery?category=${category.id}`}
              className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group
                         bg-black/10 border border-white/10 hover:bg-black/20 hover:border-[#ff47b3]/40"
            >
              <div
                className="w-3 h-12 rounded-full"
                style={{ backgroundColor: category.colour, boxShadow: `0 0 20px ${category.colour}60` }}
              />
              <div className="flex-1">
                <p className="font-semibold text-white group-hover:text-[#ff47b3] transition-colors">
                  {category.name}
                </p>
                <p className="text-sm text-white/50">{category.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {category.imageCount}
                </p>
                <p className="text-xs text-white/40">images</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Images */}
      <div className="ink-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#a855f7]" />
            <h2 className="text-xl font-bold text-white">Recent Uploads</h2>
          </div>
          <Link
            href="/gallery"
            className="text-sm text-[#ff47b3] hover:text-[#22d3ee] font-medium flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentImages.map((image) => (
              <Link
                key={image.id}
                href={`/gallery?category=${image.categoryId}`}
                className="aspect-[4/3] rounded-xl overflow-hidden group
                           bg-black/20 border border-white/10 hover:border-[#ff47b3]/50 
                           transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#ff47b3]/20"
              >
                <img
                  src={`/api/img/${image.categoryId}/${image.id}/thumbnail.png`}
                  alt={image.originalFilename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br from-[#ff47b3]/20 to-[#a855f7]/20 border border-white/10">
              <Image className="w-10 h-10 text-[#ff47b3]/50" />
            </div>
            <p className="text-white/50 mb-4">No images yet</p>
            <Link href="/upload" className="ink-button inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload your first image
            </Link>
          </div>
        )}
      </div>

      {/* Your Devices */}
      <div className="ink-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[#22d3ee]" />
            <h2 className="text-xl font-bold text-white">Your Devices</h2>
          </div>
          <Link
            href="/devices"
            className="text-sm text-[#ff47b3] hover:text-[#22d3ee] font-medium flex items-center gap-1 transition-colors"
          >
            Manage <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {devices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => {
              const display = displays.find(d => d.id === device.displayId);
              return (
                <Link
                  key={device.id}
                  href="/devices"
                  className="flex items-center gap-3 p-4 rounded-xl bg-black/10 border border-white/10
                             hover:bg-black/20 hover:border-[#ff47b3]/40 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center
                                  bg-gradient-to-br from-[#ff47b3] to-[#a855f7] glow-pink">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white group-hover:text-[#ff47b3] transition-colors">
                      {device.name}
                    </p>
                    <p className="text-sm text-white/50">
                      {display?.name || device.displayId}
                    </p>
                    {display && (
                      <p className="text-xs text-white/40">
                        {display.width}×{display.height} • {display.palette.length} colors
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br from-[#22d3ee]/20 to-[#06b6d4]/20 border border-white/10">
              <Monitor className="w-8 h-8 text-[#22d3ee]/50" />
            </div>
            <p className="text-white/50 mb-4">No devices configured yet</p>
            <Link href="/devices" className="ink-button inline-flex items-center gap-2">
              Add your first device
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
