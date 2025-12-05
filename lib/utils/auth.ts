/**
 * Authentication utilities for API key validation
 * 
 * Security layer to protect API endpoints from unauthorized access.
 * API key is stored in INKYSTREAM_API_KEY environment variable.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get the configured API key from environment
 * Returns null if not configured (allows open access in development)
 */
export function getApiKey(): string | null {
  return process.env.INKYSTREAM_API_KEY || null;
}

/**
 * Check if API key protection is enabled
 */
export function isAuthEnabled(): boolean {
  return !!getApiKey();
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
  const configuredKey = getApiKey();
  
  // If no key is configured, allow access (development mode)
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
 */
export function requireApiKey(request: NextRequest): NextResponse | null {
  const providedKey = extractApiKey(request);
  
  if (!validateApiKey(providedKey)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unauthorized. API key required.',
        hint: isAuthEnabled() 
          ? 'Include ?key=YOUR_API_KEY in the URL or Authorization: Bearer YOUR_API_KEY header'
          : 'Set INKYSTREAM_API_KEY environment variable to enable authentication'
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

