'use client';

import { X, Code, Palette } from 'lucide-react';
import Portal from './Portal';

interface CustomDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomDisplayModal({ isOpen, onClose }: CustomDisplayModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        {/* Modal Content */}
        <div
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl
                     bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1e] border border-white/20
                     shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-b from-[#1a1a2e] to-[#1a1a2e]/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#22d3ee] to-[#06b6d4]">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Adding Custom Displays</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <p className="text-white/80 text-sm leading-relaxed">
              InkyStream can work with any e-ink display. To add your own display type, you&apos;ll need to edit the configuration file 
              to define your display&apos;s specifications.
            </p>

            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-white">Locate the Configuration File</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed ml-9">
                Open <code className="text-[#22d3ee] bg-black/40 px-2 py-1 rounded font-mono text-xs">config/displays.json</code> in 
                your InkyStream installation directory.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-white">Add Your Display Profile</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed ml-9 mb-3">
                Add a new entry to the <code className="text-[#22d3ee] bg-black/40 px-1.5 py-0.5 rounded font-mono text-xs">displays</code> array 
                with your display&apos;s specifications:
              </p>
              <div className="ml-9 bg-black/40 rounded-lg p-4 border border-white/10 overflow-x-auto">
                <pre className="text-xs text-white/80 font-mono">
{`{
  "id": "my_custom_display",
  "name": "My Custom Display 7.5\\"",
  "description": "Custom e-ink display (800×480)",
  "width": 800,
  "height": 480,
  "palette": ["#000000", "#FFFFFF", "#FF0000"],
  "manufacturer": "Generic",
  "defaultDithering": "floyd-steinberg"
}`}
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-white">Configure the Settings</h3>
              </div>
              <div className="ml-9 space-y-3">
                <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <p className="text-white font-medium text-sm mb-1">Resolution</p>
                  <p className="text-white/60 text-xs">
                    Set <code className="text-[#22d3ee] bg-black/40 px-1 py-0.5 rounded font-mono">width</code> and{' '}
                    <code className="text-[#22d3ee] bg-black/40 px-1 py-0.5 rounded font-mono">height</code> to 
                    your display&apos;s exact pixel dimensions (check the datasheet).
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <p className="text-white font-medium text-sm mb-1">Color Palette</p>
                  <p className="text-white/60 text-xs mb-2">
                    The <code className="text-[#22d3ee] bg-black/40 px-1 py-0.5 rounded font-mono">palette</code> array 
                    defines which colors your display can show. Common examples:
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <code className="text-white/80 bg-black/40 px-1.5 py-0.5 rounded font-mono">["#000000", "#FFFFFF"]</code>
                      <span className="text-white/50">Black & White</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-white/80 bg-black/40 px-1.5 py-0.5 rounded font-mono">["#000000", "#FFFFFF", "#FF0000"]</code>
                      <span className="text-white/50">Black/White/Red</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-white/80 bg-black/40 px-1.5 py-0.5 rounded font-mono">["#000000", "#FFFFFF", "#FFFF00"]</code>
                      <span className="text-white/50">Black/White/Yellow</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white font-bold text-sm">
                  4
                </div>
                <h3 className="text-lg font-bold text-white">Restart and Test</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed ml-9">
                Save the file and restart InkyStream. Your custom display will appear in the device creation dropdown. 
                Upload a test image to verify the resolution and colors are correct.
              </p>
            </div>

            {/* Tips */}
            <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Code className="w-5 h-5 text-[#22d3ee] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Finding Display Specifications</h4>
                  <p className="text-white/70 text-xs leading-relaxed">
                    Check your display&apos;s technical datasheet or product documentation for the exact resolution and supported colors. 
                    Most manufacturers provide this information on their website or in the product manual.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-t from-[#0f0f1e] to-[#0f0f1e]/95 backdrop-blur-sm border-t border-white/10 p-6">
            <button
              onClick={onClose}
              className="w-full ink-button"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
