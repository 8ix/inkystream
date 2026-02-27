'use client';

import { useState, useEffect, useCallback } from 'react';
import DeviceManager from '@/components/DeviceManager';
import CustomDisplayModal from '@/components/CustomDisplayModal';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import { Monitor, ExternalLink, ArrowRight } from 'lucide-react';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [displays, setDisplays] = useState<DisplayProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomDisplayModal, setShowCustomDisplayModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [devRes, dispRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/displays'),
      ]);

      const devData = await devRes.json();
      const dispData = await dispRes.json();

      if (devData.success) setDevices(devData.data || []);
      if (dispData.success) setDisplays(dispData.data.displays || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Devices</h1>
        <p className="text-white/60">Manage your e-ink display devices</p>
      </div>

      {/* Display Configuration Info */}
      <div className="ink-card p-6 bg-black/20 border border-white/10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/10 flex-shrink-0">
            <Monitor className="w-6 h-6 text-white/70" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-2">Default Display Configuration</h2>
            <p className="text-white/70 text-sm leading-relaxed mb-3">
              This installation includes one pre-configured display type: the <span className="text-white font-medium">Pimoroni Inky Frame 7.3&quot; Spectra 6</span> (800×480, 6 colors). 
              This is simply the hardware used during development.
            </p>
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-2">Using a Different E-ink Display?</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-3">
                InkyStream works with any e-ink display. To add your own, edit <code className="text-[#22d3ee] bg-black/40 px-1.5 py-0.5 rounded font-mono text-xs">config/displays.json</code> to 
                define your display&apos;s resolution and color palette. See the documentation for examples and instructions.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCustomDisplayModal(true)}
                  className="text-sm text-[#22d3ee] hover:text-[#06b6d4] font-medium transition-colors inline-flex items-center gap-1"
                >
                  Learn how to add custom displays
                  <ArrowRight className="w-3 h-3" />
                </button>
                <a
                  href="https://shop.pimoroni.com/products/inky-frame-7-3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/50 hover:text-white/70 transition-colors inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Inky Frame specs
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeviceManager devices={devices} displays={displays} onRefresh={loadData} />

      {/* Custom Display Modal */}
      <CustomDisplayModal 
        isOpen={showCustomDisplayModal} 
        onClose={() => setShowCustomDisplayModal(false)} 
      />
    </div>
  );
}
