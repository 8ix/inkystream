import { getDevices } from '@/lib/utils/devices';
import { getDisplayProfiles } from '@/lib/displays/profiles';
import DeviceManager from '@/components/DeviceManager';
import { Monitor } from 'lucide-react';

/**
 * Device management page
 * Allows users to create, edit, and delete devices
 */
export const revalidate = 0; // Disable caching to always show latest devices
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export default async function DevicesPage() {
  const [devices, displays] = await Promise.all([
    getDevices(),
    getDisplayProfiles(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#22d3ee] to-[#3b82f6] glow-cyan">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Devices</h1>
        </div>
        <p className="text-white/60">
          Manage your e-ink frames and displays. Each device is linked to a specific display type.
        </p>
        <div className="mt-3 text-white/70 text-sm space-y-1">
          <p className="font-semibold text-white/80">Getting started</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Create a device and pick the display type</li>
            <li>Click the Code (&lt;/&gt;) button on the device row</li>
            <li>Set WiFi, API base (e.g. raspberrypi.local:3000), API key, refresh</li>
            <li>Copy the code and flash/run on your frame</li>
          </ul>
        </div>
      </div>

      {/* Device Manager Component */}
      <DeviceManager devices={devices} displays={displays} />
    </div>
  );
}
