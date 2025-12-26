'use client';

import Link from 'next/link';
import { Upload, Image, Palette, Monitor } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/60">Welcome to InkyStream Admin</p>
      </div>

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
              <Image className="w-6 h-6 text-white" />
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
    </div>
  );
}
