'use client';

import { useState, useEffect, useCallback } from 'react';
import DeviceManager from '@/components/DeviceManager';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [displays, setDisplays] = useState<DisplayProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <DeviceManager devices={devices} displays={displays} onRefresh={loadData} />
    </div>
  );
}
