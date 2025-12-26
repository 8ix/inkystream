/**
 * API helper utilities for shared logic across API routes
 */

import { NextResponse } from 'next/server';

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error API response
 */
export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Parse query parameters from a request
 */
export function getQueryParams(request: Request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}





