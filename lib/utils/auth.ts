/**
 * Authentication utilities for API key validation
 * 
 * Security layer to protect API endpoints from unauthorized access.
 * API key is stored in INKYSTREAM_API_KEY environment variable.
 * 
 * IMPORTANT: API key is only enforced in production (on Vercel).
 * During local development, all requests are allowed to enable
 * the admin interface to work without authentication.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if we're running in a production environment (Vercel)
 * Vercel sets VERCEL=1 in the environment
 */
export function isProduction(): boolean {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

/**
 * Get the configured API key from environment
 * Returns null if not configured
 */
export function getApiKey(): string | null {
  return process.env.INKYSTREAM_API_KEY || null;
}

/**
 * Check if API key protection is active
 * Only active in production when a key is configured
 */
export function isAuthEnabled(): boolean {
  return isProduction() && !!getApiKey();
}

/**
 * Extract API key from request
 * Checks both query parameter (?key=xxx) and Authorization header
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check query parameter first (easier for microcontrollers)
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  if (queryKey) {
    return queryKey;
  }

  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Validate the provided API key against the configured key
 */
export function validateApiKey(providedKey: string | null): boolean {
  // In development, allow all requests
  if (!isProduction()) {
    return true;
  }

  const configuredKey = getApiKey();
  
  // If no key is configured in production, allow access (not recommended)
  if (!configuredKey) {
    return true;
  }
  
  // If key is configured, require it to match
  if (!providedKey) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (providedKey.length !== configuredKey.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < providedKey.length; i++) {
    result |= providedKey.charCodeAt(i) ^ configuredKey.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Middleware helper to validate API key on a request
 * Returns error response if invalid, null if valid
 * 
 * Note: Only enforces authentication in production (Vercel).
 * Local development allows all requests for admin interface access.
 */
export function requireApiKey(request: NextRequest): NextResponse | null {
  const providedKey = extractApiKey(request);
  
  if (!validateApiKey(providedKey)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unauthorized. API key required.',
        hint: 'Include ?key=YOUR_API_KEY in the URL or Authorization: Bearer YOUR_API_KEY header'
      },
      { status: 401 }
    );
  }
  
  return null; // Valid - continue processing
}

/**
 * Generate a secure random API key
 * Used for initial setup documentation
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let result = '';
  
  // Use crypto if available, fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}
