import { getDevices } from '@/lib/utils/devices';
import { getDisplayProfiles } from '@/lib/displays/profiles';
import DeviceManager from '@/components/DeviceManager';
import { Monitor } from 'lucide-react';

/**
 * Device management page
 * Allows users to create, edit, and delete devices
 */
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
      </div>

      {/* Device Manager Component */}
      <DeviceManager devices={devices} displays={displays} />
    </div>
  );
}
