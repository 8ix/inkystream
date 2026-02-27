'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Upload, Image as ImageIcon, Palette, Monitor } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/upload', icon: Upload, label: 'Upload' },
  { href: '/gallery', icon: ImageIcon, label: 'Gallery' },
  { href: '/categories', icon: Palette, label: 'Categories' },
  { href: '/devices', icon: Monitor, label: 'Devices' },
];

/**
 * Admin layout with navigation sidebar
 * This is only used locally - never deployed to production
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar Navigation - Fixed */}
      <nav className="w-72 h-screen flex-shrink-0 bg-gradient-to-b from-[#1a1a1a] via-[#1f1f2e] to-[#1a1a2e] flex flex-col overflow-y-auto dark-scrollbar">
        {/* Logo */}
        <div className="p-5 pb-2">
          <Link href="/">
            <NextImage 
              src="/inkstreamlogo.png" 
              alt="InkyStream" 
              width={220}
              height={60}
              className="w-full max-w-[220px] drop-shadow-lg"
              priority
            />
          </Link>
        </div>

        {/* Navigation Links */}
        <ul className="space-y-2 px-5 py-4 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(href)
                    ? 'bg-gradient-to-r from-[#d835ba]/20 to-[#8b5cf6]/20 text-white border-l-4 border-[#d835ba] shadow-lg shadow-[#d835ba]/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive(href) ? 'text-[#d835ba]' : ''}`} />
                <span className="font-medium">{label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Info Box */}
        <div className="p-5 pt-2">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
            <p className="text-xs text-gray-400 leading-relaxed">
              InkyStream is designed for local network use to serve images to your household e-ink displays.
            </p>
          </div>
        </div>
      </nav>

      {/* Main Content - Scrollable with vibrant gradient background */}
      <main className="flex-1 h-screen overflow-y-auto main-content-bg">
        {/* Content area */}
        <div className="p-8 pb-16 min-h-full">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
