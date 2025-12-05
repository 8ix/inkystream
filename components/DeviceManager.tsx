'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import { Monitor, Plus, Pencil, Trash2, X, Check, Wifi, Sparkles } from 'lucide-react';

interface DeviceManagerProps {
  devices: Device[];
  displays: DisplayProfile[];
}

/**
 * Device Manager component for creating, editing, and deleting devices
 */
export default function DeviceManager({ devices, displays }: DeviceManagerProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDisplayId, setNewDisplayId] = useState(displays[0]?.id || '');
  const [editName, setEditName] = useState('');
  const [editDisplayId, setEditDisplayId] = useState('');

  const getDisplayName = (displayId: string) => {
    const display = displays.find((d) => d.id === displayId);
    return display?.name || displayId;
  };

  const getDisplayInfo = (displayId: string) => {
    const display = displays.find((d) => d.id === displayId);
    if (!display) return null;
    return `${display.width}×${display.height} • ${display.palette.length} colors`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDisplayId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), displayId: newDisplayId }),
      });

      const data = await response.json();

      if (data.success) {
        setNewName('');
        setNewDisplayId(displays[0]?.id || '');
        setIsCreating(false);
        router.refresh();
      } else {
        setError(data.error || 'Failed to create device');
      }
    } catch {
      setError('An error occurred while creating the device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (device: Device) => {
    setEditingId(device.id);
    setEditName(device.name);
    setEditDisplayId(device.displayId);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDisplayId('');
    setError(null);
  };

  const handleSaveEdit = async (deviceId: string) => {
    if (!editName.trim() || !editDisplayId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), displayId: editDisplayId }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(data.error || 'Failed to update device');
      }
    } catch {
      setError('An error occurred while updating the device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${deviceName}"? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.refresh();
      } else {
        setError(data.error || 'Failed to delete device');
      }
    } catch {
      setError('An error occurred while deleting the device');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Device List Card */}
      <div className="ink-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ff47b3]" />
            <h2 className="text-xl font-bold text-white">Your Devices</h2>
          </div>
          {!isCreating && (
            <button
              onClick={() => {
                setIsCreating(true);
                setError(null);
              }}
              className="ink-button flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              Add Device
            </button>
          )}
        </div>

        {/* Create New Device Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-6 p-5 rounded-xl bg-black/20 border border-white/10">
            <h3 className="font-bold text-white mb-4">New Device</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="newName" className="ink-label">
                  Device Name
                </label>
                <input
                  id="newName"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Living Room Frame"
                  className="ink-input"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="newDisplayId" className="ink-label">
                  Display Type
                </label>
                <select
                  id="newDisplayId"
                  value={newDisplayId}
                  onChange={(e) => setNewDisplayId(e.target.value)}
                  className="ink-input"
                  disabled={isLoading}
                >
                  {displays.map((display) => (
                    <option key={display.id} value={display.id}>
                      {display.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="ink-button flex items-center gap-2"
                disabled={isLoading || !newName.trim()}
              >
                <Check className="w-4 h-4" />
                Create Device
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                  setError(null);
                }}
                className="ink-button-secondary flex items-center gap-2"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Empty State */}
        {devices.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br from-[#ff47b3]/20 to-[#a855f7]/20 border border-white/10">
              <Monitor className="w-10 h-10 text-[#ff47b3]/50" />
            </div>
            <p className="text-xl font-bold text-white mb-2">No devices yet</p>
            <p className="text-white/50 mb-6 max-w-sm mx-auto">
              Create a device to start uploading images for your e-ink frames.
            </p>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="ink-button inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Device
              </button>
            )}
          </div>
        ) : (
          /* Device List */
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                  editingId === device.id
                    ? 'bg-[#ff47b3]/10 border border-[#ff47b3]/30'
                    : 'bg-black/20 border border-white/10 hover:border-white/20'
                }`}
              >
                {editingId === device.id ? (
                  /* Editing Mode */
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="ink-input flex-1 w-full sm:max-w-xs"
                      disabled={isLoading}
                      autoFocus
                    />
                    <select
                      value={editDisplayId}
                      onChange={(e) => setEditDisplayId(e.target.value)}
                      className="ink-input w-full sm:max-w-xs"
                      disabled={isLoading}
                    >
                      {displays.map((display) => (
                        <option key={display.id} value={display.id}>
                          {display.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(device.id)}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        disabled={isLoading || !editName.trim()}
                        title="Save"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                        disabled={isLoading}
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center
                                      bg-gradient-to-br from-[#ff47b3] to-[#a855f7] shadow-lg shadow-[#ff47b3]/20">
                        <Monitor className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{device.name}</p>
                        <p className="text-sm text-white/50">{getDisplayName(device.displayId)}</p>
                        {getDisplayInfo(device.displayId) && (
                          <p className="text-xs text-white/30 mt-0.5">{getDisplayInfo(device.displayId)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(device)}
                        className="p-2.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                        disabled={isLoading}
                        title="Edit device"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(device.id, device.name)}
                        className="p-2.5 rounded-lg bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        disabled={isLoading}
                        title="Delete device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Endpoints Info */}
      {devices.length > 0 && (
        <div className="ink-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center
                            bg-gradient-to-br from-[#22d3ee] to-[#3b82f6]">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">API Endpoints</h3>
              <p className="text-sm text-white/50">Use these URLs to fetch images for your devices</p>
            </div>
          </div>
          <div className="space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="p-4 rounded-xl bg-black/20 border border-white/10">
                <p className="text-sm font-semibold text-white mb-2">{device.name}</p>
                <div className="space-y-2">
                  <code className="block text-xs font-mono bg-black/30 px-3 py-2 rounded-lg border border-white/10 text-white/70">
                    <span className="text-green-400">GET</span> /api/devices/{device.id}/random
                  </code>
                  <code className="block text-xs font-mono bg-black/30 px-3 py-2 rounded-lg border border-white/10 text-white/70">
                    <span className="text-[#22d3ee]">GET</span> /api/devices/{device.id}/next
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
