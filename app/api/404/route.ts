import { NextResponse } from 'next/server';

// Catch-all 404 for blocked routes in production
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Not found - only API routes are available in production',
    },
    { status: 404 }
  );
}




