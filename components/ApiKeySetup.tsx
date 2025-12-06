'use client';

import { useState } from 'react';
import { Key, Copy, Check, Shield, ExternalLink, RefreshCw } from 'lucide-react';

interface ApiKeySetupProps {
  apiKey: string;
  isNewlyGenerated: boolean;
}

/**
 * API Key Setup component
 * Shows the generated API key and instructions for using it
 */
export default function ApiKeySetup({ apiKey, isNewlyGenerated }: ApiKeySetupProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(isNewlyGenerated);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const maskedKey = apiKey.slice(0, 8) + '...' + apiKey.slice(-4);

  return (
    <div className={`ink-card p-6 ${isNewlyGenerated ? 'border-[#22d3ee]/50 shadow-lg shadow-[#22d3ee]/20' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${
          isNewlyGenerated 
            ? 'bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] glow-cyan animate-pulse'
            : 'bg-gradient-to-br from-green-500 to-emerald-600'
        }`}>
          {isNewlyGenerated ? (
            <Key className="w-6 h-6 text-white" />
          ) : (
            <Shield className="w-6 h-6 text-white" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-white text-lg">
              {isNewlyGenerated ? 'API Key Generated!' : 'API Security Active'}
            </h3>
            {isNewlyGenerated && (
              <span className="px-2 py-0.5 bg-[#22d3ee]/20 text-[#22d3ee] text-xs font-medium rounded-full">
                New
              </span>
            )}
          </div>
          
          {isNewlyGenerated ? (
            <p className="text-white/70 text-sm mb-4">
              Your API key has been automatically generated and saved to <code className="text-[#22d3ee]">.env.local</code>. 
              Copy this key to set up Vercel and your e-ink frames. 
              <span className="text-white/50">Local development works without the key.</span>
            </p>
          ) : (
            <p className="text-white/70 text-sm mb-4">
              Your images will be protected with API key authentication when deployed to Vercel.
            </p>
          )}

          {/* API Key Display */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-black/30 rounded-xl border border-white/10 font-mono text-sm">
              <span className="text-white/90 select-all">
                {showKey ? apiKey : maskedKey}
              </span>
            </div>
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              <RefreshCw className="w-4 h-4 text-white/70" />
            </button>
            <button
              onClick={copyToClipboard}
              className={`p-3 rounded-xl transition-all ${
                copied 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Setup Instructions */}
          {isNewlyGenerated && (
            <div className="space-y-3 p-4 bg-black/20 rounded-xl border border-white/10">
              <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#ff47b3] flex items-center justify-center text-xs">1</span>
                Set up Vercel
              </h4>
              <p className="text-white/60 text-sm pl-7">
                Add <code className="text-[#22d3ee]">INKYSTREAM_API_KEY</code> to your Vercel project&apos;s Environment Variables with this key, then redeploy.
              </p>
              
              <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#ff47b3] flex items-center justify-center text-xs">2</span>
                Update your frames
              </h4>
              <p className="text-white/60 text-sm pl-7">
                Include <code className="text-[#22d3ee]">?key=YOUR_KEY</code> in your frame&apos;s API requests to your Vercel URL.
              </p>
              
              <p className="text-white/40 text-xs pl-7 mt-2">
                💡 Local development works without the API key - it&apos;s only enforced on Vercel.
              </p>
            </div>
          )}

          {!isNewlyGenerated && (
            <a
              href="/docs/setup/vercel-deployment.md"
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-[#22d3ee] hover:text-[#22d3ee]/80 transition-colors"
            >
              View security documentation
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

