'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Code, ExternalLink, KeyRound, Timer, Wifi, ToggleLeft, ToggleRight, AlertTriangle, Wand2 } from 'lucide-react';
import type { Device } from '@/lib/types/device';
import type { DisplayProfile } from '@/lib/types/display';
import { generateDeviceCode, getPlatformInstructions, suggestPlatform } from '@/lib/utils/frame-code';

interface FrameCodeSnippetProps {
  device: Device;
  display: DisplayProfile;
}

/**
 * Component to display and copy device integration code
 */
export default function FrameCodeSnippet({ device, display }: FrameCodeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [code, setCode] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [includeApiKey, setIncludeApiKey] = useState(true);
  const [wifiSsid, setWifiSsid] = useState('YOUR_WIFI_SSID');
  const [wifiPassword, setWifiPassword] = useState('YOUR_WIFI_PASSWORD');
  const [refreshInterval, setRefreshInterval] = useState(3600); // seconds
  const [enableButtons, setEnableButtons] = useState(false);
  const presets = [
    { label: 'Fast demo', seconds: 300 },
    { label: 'Balanced', seconds: 3600 },
    { label: 'Saver', seconds: 21600 },
  ];

  // Auto-detect API base URL from browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // For local development, suggest common Pi hostname
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        setApiBaseUrl('http://raspberrypi.local:3000');
      } else {
        setApiBaseUrl(origin);
      }
    }
    if (device.refreshIntervalSeconds) {
      setRefreshInterval(device.refreshIntervalSeconds);
    }
  }, [device.refreshIntervalSeconds]);

  // Generate code when device, display, or URL changes
  useEffect(() => {
    if (apiBaseUrl && device && display) {
      const generatedCode = generateDeviceCode({
        device,
        display,
        apiBaseUrl,
        apiKey: apiKey || undefined,
        overrides: {
          includeApiKey,
          wifiSsid,
          wifiPassword,
          refreshIntervalSeconds: Number(refreshInterval) || 3600,
          enableButtons,
        },
      });
      setCode(generatedCode);
    }
  }, [device, display, apiBaseUrl, apiKey, includeApiKey, wifiSsid, wifiPassword, refreshInterval, enableButtons]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const platform = device.platform || suggestPlatform(display.id);
  const instructions = getPlatformInstructions(platform);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="ink-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-[#22d3ee]" />
            <h3 className="font-bold text-white">Integration Code</h3>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="ink-label flex items-center gap-2">
              <Wifi className="w-4 h-4" /> WiFi SSID
            </label>
            <input
              type="text"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              className="ink-input"
              placeholder="YOUR_WIFI_SSID"
            />
          </div>
          <div>
            <label className="ink-label">WiFi Password</label>
            <input
              type="text"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              className="ink-input"
              placeholder="YOUR_WIFI_PASSWORD"
            />
          </div>
          <div>
            <label className="ink-label flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> API Key (optional)
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="ink-input"
              placeholder="YOUR_API_KEY"
            />
            <label className="flex items-center gap-2 text-xs text-white/60 mt-1">
              <input
                type="checkbox"
                checked={includeApiKey}
                onChange={(e) => setIncludeApiKey(e.target.checked)}
                className="accent-[#22d3ee]"
              />
              Include API key in URLs
            </label>
            {includeApiKey && !apiKey && (
              <p className="text-xs text-amber-300 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> No API key set — requests will be unauthenticated.
              </p>
            )}
          </div>
          <div>
            <label className="ink-label flex items-center gap-2">
              <Timer className="w-4 h-4" /> Refresh Interval (seconds)
            </label>
            <input
              type="number"
              min={10}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value) || 3600)}
              className="ink-input"
            />
            <p className="text-xs text-white/50 mt-1">Time between image updates.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRefreshInterval(p.seconds)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    refreshInterval === p.seconds
                      ? 'bg-[#22d3ee]/20 border-[#22d3ee]/40 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {p.label} ({Math.round(p.seconds / 60)}m)
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEnableButtons(!enableButtons)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                enableButtons
                  ? 'bg-[#22d3ee]/20 border-[#22d3ee]/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              {enableButtons ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              Enable buttons (next/random)
            </button>
            <div className="flex-1" />
          </div>
          <div>
            <label className="ink-label">API Base URL</label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="ink-input text-xs"
              placeholder="API Base URL"
            />
            <p className="text-xs text-white/50 mt-1">Auto-detected. Override if your frame is on a different network.</p>
          </div>
        </div>

        <div className="relative">
          <pre className="text-xs font-mono bg-black/40 p-4 rounded-lg border border-white/10 overflow-x-auto text-white/90">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="ink-card p-6">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full flex items-center justify-between mb-2"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white">{instructions.title}</h3>
            <span className="text-xs text-white/50">({platform})</span>
          </div>
          <span className="text-white/50 text-sm">
            {showInstructions ? 'Hide' : 'Show'} Instructions
          </span>
        </button>

        {showInstructions && (
          <div className="mt-4 space-y-4">
            <p className="text-white/70 text-sm">{instructions.description}</p>
            
            <ol className="list-decimal list-inside space-y-2 text-sm text-white/70">
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>

            {instructions.links && instructions.links.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/50 mb-2">Useful Links:</p>
                <div className="flex flex-wrap gap-2">
                  {instructions.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#22d3ee] hover:text-[#3b82f6] transition-colors"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-sm text-white">
                <Wand2 className="w-4 h-4 text-[#22d3ee]" />
                <span>Troubleshooting quick checks</span>
              </div>
              <ul className="list-disc list-inside text-xs text-white/70 space-y-1">
                <li>WiFi connects (SSID/password correct)</li>
                <li>API base URL reachable from the frame</li>
                <li>API key present if your server requires it</li>
                <li>`/api/devices/{device.id}/random` returns 200</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

