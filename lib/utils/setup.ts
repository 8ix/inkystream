/**
 * Setup utilities for InkyStream
 * Handles first-time setup including API key generation
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const ENV_LOCAL_PATH = path.join(process.cwd(), '.env.local');

export interface SetupStatus {
  isConfigured: boolean;
  apiKey: string | null;
  isNewlyGenerated: boolean;
}

/**
 * Generate a cryptographically secure API key
 */
export function generateSecureApiKey(): string {
  // Generate 32 bytes of random data and encode as base64
  // This creates a 43-character string that's URL-safe after encoding
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Check if .env.local exists
 */
async function envLocalExists(): Promise<boolean> {
  try {
    await fs.access(ENV_LOCAL_PATH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the current API key from .env.local
 */
async function readApiKeyFromEnvLocal(): Promise<string | null> {
  try {
    const content = await fs.readFile(ENV_LOCAL_PATH, 'utf-8');
    const match = content.match(/^INKYSTREAM_API_KEY=(.+)$/m);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create .env.local with a new API key
 */
async function createEnvLocalWithKey(apiKey: string): Promise<void> {
  const content = `# InkyStream Configuration
# Generated automatically on first run

# API Key for authenticating requests from your e-ink frames
# Use this key when setting up Vercel and your frames
INKYSTREAM_API_KEY=${apiKey}

# To use this key:
# 1. Copy this key to your Vercel project's Environment Variables
# 2. Include ?key=${apiKey} in your frame's API requests
# 3. Redeploy your Vercel project after adding the environment variable
`;

  await fs.writeFile(ENV_LOCAL_PATH, content, 'utf-8');
}

/**
 * Check setup status and create API key if needed
 * Returns the setup status including the API key (for display to user)
 */
export async function checkAndSetupApiKey(): Promise<SetupStatus> {
  // First check if we already have an API key in environment
  const envApiKey = process.env.INKYSTREAM_API_KEY;
  if (envApiKey) {
    return {
      isConfigured: true,
      apiKey: envApiKey,
      isNewlyGenerated: false,
    };
  }

  // Check if .env.local exists
  const exists = await envLocalExists();
  
  if (exists) {
    // Try to read existing key
    const existingKey = await readApiKeyFromEnvLocal();
    if (existingKey) {
      return {
        isConfigured: true,
        apiKey: existingKey,
        isNewlyGenerated: false,
      };
    }
  }

  // Generate new key and create .env.local
  const newApiKey = generateSecureApiKey();
  
  try {
    await createEnvLocalWithKey(newApiKey);
    return {
      isConfigured: true,
      apiKey: newApiKey,
      isNewlyGenerated: true,
    };
  } catch (error) {
    console.error('Failed to create .env.local:', error);
    return {
      isConfigured: false,
      apiKey: null,
      isNewlyGenerated: false,
    };
  }
}

/**
 * Get the current API key (if configured)
 * Does not generate a new one - use checkAndSetupApiKey for that
 */
export async function getApiKeyStatus(): Promise<{ isConfigured: boolean; apiKey: string | null }> {
  // Check environment first
  const envApiKey = process.env.INKYSTREAM_API_KEY;
  if (envApiKey) {
    return { isConfigured: true, apiKey: envApiKey };
  }

  // Check .env.local
  const localKey = await readApiKeyFromEnvLocal();
  if (localKey) {
    return { isConfigured: true, apiKey: localKey };
  }

  return { isConfigured: false, apiKey: null };
}

