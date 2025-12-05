import { getDevices } from '@/lib/utils/devices';
import { getDisplayProfiles } from '@/lib/displays/profiles';
import DeviceManager from '@/components/DeviceManager';

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
        <h1 className="text-3xl font-bold text-ink-black">Devices</h1>
        <p className="text-ink-gray mt-2">
          Manage your e-ink frames and displays. Each device is linked to a specific display type.
        </p>
      </div>

      {/* Device Manager Component */}
      <DeviceManager devices={devices} displays={displays} />
    </div>
  );
}

