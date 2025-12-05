'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Device } from '@/lib/types/device';
import { Monitor } from 'lucide-react';

interface DeviceFilterProps {
  devices: Device[];
  currentDeviceId?: string;
}

/**
 * Client component for device filtering in gallery
 */
export default function DeviceFilter({ devices, currentDeviceId }: DeviceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDeviceChange = (deviceId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (deviceId) {
      params.set('device', deviceId);
    } else {
      params.delete('device');
    }
    router.push(`/gallery?${params.toString()}`);
  };

  if (devices.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Monitor className="w-4 h-4 text-white/50" />
      <select
        value={currentDeviceId || ''}
        onChange={(e) => handleDeviceChange(e.target.value)}
        className="ink-input py-2 text-sm min-w-[160px]"
      >
        <option value="">All Devices</option>
        {devices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.name}
          </option>
        ))}
      </select>
    </div>
  );
}
