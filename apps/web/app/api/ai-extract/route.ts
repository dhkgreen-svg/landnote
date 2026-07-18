import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Server-side call to API on localhost:3001 — bypasses firewall/CORS
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/ai/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[api/ai-extract] proxy error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'PROXY_ERROR', message: error.message || 'AI 프록시 오류' } },
      { status: 500 }
    );
  }
}
