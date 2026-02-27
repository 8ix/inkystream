'use client';

import { useState, useEffect } from 'react';
import type { Device, DevicePlatform } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import { Monitor, Plus, Pencil, Trash2, X, Check, Wifi, Sparkles, Code, Circle } from 'lucide-react';
import FrameCodeSnippet from './FrameCodeSnippet';
import Portal from './Portal';
import { suggestPlatform } from '@/lib/utils/frame-code';

interface DeviceManagerProps {
  devices: Device[];
  displays: DisplayProfile[];
  onRefresh?: () => void;
}

/**
 * Device Manager component for creating, editing, and deleting devices
 */
export default function DeviceManager({ devices, displays, onRefresh }: DeviceManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDisplayId, setNewDisplayId] = useState(displays[0]?.id || '');
  const [newPlatform, setNewPlatform] = useState<DevicePlatform | ''>('');
  const [newCodeTemplate, setNewCodeTemplate] = useState('');
  const [newRefreshMinutes, setNewRefreshMinutes] = useState<number | ''>(60);
  const [editName, setEditName] = useState('');
  const [editDisplayId, setEditDisplayId] = useState('');
  const [editPlatform, setEditPlatform] = useState<DevicePlatform | ''>('');
  const [editCodeTemplate, setEditCodeTemplate] = useState('');
  const [editRefreshMinutes, setEditRefreshMinutes] = useState<number | ''>('');
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<{ id: string; name: string } | null>(null);

  const getDisplayName = (displayId: string) => {
    const display = displays.find((d) => d.id === displayId);
    return display?.name || displayId;
  };

  const getDisplayInfo = (displayId: string) => {
    const display = displays.find((d) => d.id === displayId);
    if (!display) return null;
    return `${display.width}×${display.height} • ${display.palette.length} colors`;
  };

  const getDisplay = (displayId: string): DisplayProfile | undefined => {
    return displays.find((d) => d.id === displayId);
  };

  const formatAgo = (iso?: string) => {
    if (!iso) return 'No check-ins yet';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 'Unknown';
    const diffMs = Date.now() - then;
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 48) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const getHealth = (device: Device) => {
    const refreshSeconds = device.refreshIntervalSeconds ?? 3600;
    const last = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : null;
    if (!last || Number.isNaN(last)) {
      return { label: 'No check-ins', tone: 'amber', overdue: true };
    }
    const ageSec = Math.max(0, (Date.now() - last) / 1000);
    const staleThreshold = refreshSeconds * 1.5;
    const offlineThreshold = refreshSeconds * 4;
    if (ageSec <= staleThreshold) return { label: 'Healthy', tone: 'green', overdue: false };
    if (ageSec <= offlineThreshold) return { label: 'Stale', tone: 'amber', overdue: true };
    return { label: 'Offline', tone: 'red', overdue: true };
  };

  const HealthBadge = ({ device }: { device: Device }) => {
    const health = getHealth(device);
    const colors: Record<string, string> = {
      green: 'bg-green-500/20 text-green-300 border-green-500/30',
      amber: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
      red: 'bg-red-500/20 text-red-200 border-red-500/30',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border ${colors[health.tone] || 'bg-white/10 text-white/70 border-white/10'}`}>
        <Circle className="w-3 h-3" />
        {health.label}
      </span>
    );
  };

  // Auto-suggest platform when display changes
  useEffect(() => {
    if (newDisplayId) {
      const suggested = suggestPlatform(newDisplayId);
      if (!newPlatform) {
        setNewPlatform(suggested);
      }
    }
  }, [newDisplayId, newPlatform]);

  useEffect(() => {
    if (editDisplayId) {
      const suggested = suggestPlatform(editDisplayId);
      if (!editPlatform) {
        setEditPlatform(suggested);
      }
    }
  }, [editDisplayId, editPlatform]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDisplayId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName.trim(), 
          displayId: newDisplayId,
          platform: newPlatform || undefined,
          codeTemplate: newPlatform === 'custom' ? newCodeTemplate : undefined,
          refreshIntervalSeconds: newRefreshMinutes ? Number(newRefreshMinutes) * 60 : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewName('');
        setNewDisplayId(displays[0]?.id || '');
        setNewPlatform('');
        setNewCodeTemplate('');
        setNewRefreshMinutes(60);
        setIsCreating(false);
        onRefresh?.();
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
    setEditPlatform(device.platform || '');
    setEditCodeTemplate(device.codeTemplate || '');
    setEditRefreshMinutes(
      device.refreshIntervalSeconds !== undefined
        ? Math.round(device.refreshIntervalSeconds / 60)
        : ''
    );
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDisplayId('');
    setEditPlatform('');
    setEditCodeTemplate('');
    setEditRefreshMinutes('');
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
        body: JSON.stringify({ 
          name: editName.trim(), 
          displayId: editDisplayId,
          platform: editPlatform || undefined,
          codeTemplate: editPlatform === 'custom' ? editCodeTemplate : undefined,
          refreshIntervalSeconds: editRefreshMinutes ? Number(editRefreshMinutes) * 60 : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        onRefresh?.();
      } else {
        setError(data.error || 'Failed to update device');
      }
    } catch {
      setError('An error occurred while updating the device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (deviceId: string, deviceName: string) => {
    setDeviceToDelete({ id: deviceId, name: deviceName });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deviceToDelete || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/devices/${deviceToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteConfirm(false);
        setDeviceToDelete(null);
        onRefresh?.();
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
              <div>
                <label htmlFor="newPlatform" className="ink-label">
                  Platform
                </label>
                <select
                  id="newPlatform"
                  value={newPlatform}
                  onChange={(e) => {
                    setNewPlatform(e.target.value as DevicePlatform);
                    if (e.target.value !== 'custom') {
                      setNewCodeTemplate('');
                    }
                  }}
                  className="ink-input"
                  disabled={isLoading}
                >
                  <option value="">Auto-detect</option>
                  <option value="micropython-inky-frame">MicroPython (Inky Frame)</option>
                  <option value="arduino-esp32">Arduino (ESP32)</option>
                  <option value="python-raspberry-pi">Python (Raspberry Pi)</option>
                  <option value="custom">Custom Template</option>
                </select>
                <p className="text-xs text-white/50 mt-1">
                  Platform for code generation. Auto-detect suggests based on display type.
                </p>
              </div>
              <div>
                <label htmlFor="newRefresh" className="ink-label">
                  Expected refresh (minutes)
                </label>
                <input
                  id="newRefresh"
                  type="number"
                  min={1}
                  value={newRefreshMinutes}
                  onChange={(e) => setNewRefreshMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                  className="ink-input"
                  placeholder="e.g., 60"
                  disabled={isLoading}
                />
                <p className="text-xs text-white/50 mt-1">
                  Used for health checks; frames typically wake on this cadence.
                </p>
              </div>
              {newPlatform === 'custom' && (
                <div className="md:col-span-2">
                  <label htmlFor="newCodeTemplate" className="ink-label">
                    Custom Code Template
                  </label>
                  <textarea
                    id="newCodeTemplate"
                    value={newCodeTemplate}
                    onChange={(e) => setNewCodeTemplate(e.target.value)}
                    placeholder="Enter your code template. Use variables: {{DEVICE_ID}}, {{API_BASE_URL}}, {{API_KEY}}, {{DISPLAY_WIDTH}}, {{DISPLAY_HEIGHT}}, etc."
                    className="ink-input min-h-[200px] font-mono text-sm"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-white/50 mt-1">
                    Use template variables that will be replaced with device-specific values.
                  </p>
                </div>
              )}
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
            {devices.map((device) => {
              const display = getDisplay(device.displayId);
              const isExpanded = expandedDeviceId === device.id;
              
              return (
                <div key={device.id} className="space-y-3">
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                      editingId === device.id
                        ? 'bg-[#ff47b3]/10 border border-[#ff47b3]/30'
                        : 'bg-black/20 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {editingId === device.id ? (
                      /* Editing Mode */
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/50 mb-1 block">Device Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="ink-input w-full"
                              disabled={isLoading}
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/50 mb-1 block">Display Type</label>
                            <select
                              value={editDisplayId}
                              onChange={(e) => setEditDisplayId(e.target.value)}
                              className="ink-input w-full"
                              disabled={isLoading}
                            >
                              {displays.map((display) => (
                                <option key={display.id} value={display.id}>
                                  {display.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-white/50 mb-1 block">Platform</label>
                            <select
                              value={editPlatform}
                              onChange={(e) => {
                                setEditPlatform(e.target.value as DevicePlatform);
                                if (e.target.value !== 'custom') {
                                  setEditCodeTemplate('');
                                }
                              }}
                              className="ink-input w-full"
                              disabled={isLoading}
                            >
                              <option value="">Auto-detect</option>
                              <option value="micropython-inky-frame">MicroPython (Inky Frame)</option>
                              <option value="arduino-esp32">Arduino (ESP32)</option>
                              <option value="python-raspberry-pi">Python (Raspberry Pi)</option>
                              <option value="custom">Custom Template</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-white/50 mb-1 block">Refresh Interval (minutes)</label>
                            <input
                              type="number"
                              min={1}
                              value={editRefreshMinutes}
                              onChange={(e) => setEditRefreshMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g., 60"
                              className="ink-input w-full"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(device.id)}
                            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors inline-flex items-center gap-2 text-sm font-medium"
                            disabled={isLoading || !editName.trim()}
                          >
                            <Check className="w-4 h-4" />
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors inline-flex items-center gap-2 text-sm font-medium"
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                        {editPlatform === 'custom' && (
                          <div>
                            <label className="ink-label text-sm">Custom Code Template</label>
                            <textarea
                              value={editCodeTemplate}
                              onChange={(e) => setEditCodeTemplate(e.target.value)}
                              placeholder="Enter your code template with variables..."
                              className="ink-input min-h-[150px] font-mono text-sm"
                              disabled={isLoading}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center
                                          bg-gradient-to-br from-[#ff47b3] to-[#a855f7] shadow-lg shadow-[#ff47b3]/20">
                            <Monitor className="w-6 h-6 text-white" />
                          </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{device.name}</p>
                        <p className="text-sm text-white/50">{getDisplayName(device.displayId)}</p>
                        {getDisplayInfo(device.displayId) && (
                          <p className="text-xs text-white/30">{getDisplayInfo(device.displayId)}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <HealthBadge device={device} />
                          {device.lastSeenAt && (
                            <span className="text-[11px] text-white/60 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                              Last seen {formatAgo(device.lastSeenAt)}
                            </span>
                          )}
                          <span className="text-[11px] text-white/50 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                            Refresh ~{Math.round((device.refreshIntervalSeconds ?? 3600) / 60)}m
                          </span>
                        </div>
                      </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpandedDeviceId(isExpanded ? null : device.id)}
                            className={`px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1 text-sm ${
                              isExpanded
                                ? 'bg-[#22d3ee]/20 text-[#22d3ee] hover:bg-[#22d3ee]/30'
                                : 'bg-[#22d3ee]/15 text-white hover:bg-[#22d3ee]/25 hover:text-white'
                            }`}
                            disabled={isLoading}
                            title={isExpanded ? "Hide integration code" : "Show integration code"}
                          >
                            <Code className="w-4 h-4" />
                            <span className="hidden sm:inline">Code</span>
                          </button>
                          <button
                            onClick={() => handleStartEdit(device)}
                            className="p-2.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                            disabled={isLoading}
                            title="Edit device"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(device.id, device.name)}
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
                  
                  {/* Integration Code - shown when expanded */}
                  {isExpanded && display && (
                    <div className="ink-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Code className="w-5 h-5 text-[#22d3ee]" />
                          <h3 className="font-bold text-white">Integration Code: {device.name}</h3>
                        </div>
                        <button
                          onClick={() => setExpandedDeviceId(null)}
                          className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                          title="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <FrameCodeSnippet device={device} display={display} />
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deviceToDelete && (
        <Portal>
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeviceToDelete(null);
            }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            {/* Modal Content */}
            <div
              className="relative w-full max-w-md p-6 rounded-2xl
                         bg-gradient-to-b from-[#531153] to-[#3d0d3d] border border-white/20
                         shadow-2xl shadow-red-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                              bg-red-500/20 border border-red-500/30">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Delete Device?
              </h3>
              <p className="text-white/60 text-center mb-6">
                Are you sure you want to delete <span className="text-white font-medium">&quot;{deviceToDelete.name}&quot;</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeviceToDelete(null);
                  }}
                  className="flex-1 ink-button-secondary"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold
                             bg-red-500 text-white hover:bg-red-600 transition-colors
                             disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
