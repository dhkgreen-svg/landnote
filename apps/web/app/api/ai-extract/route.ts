import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60; // Set Vercel serverless function max duration to 60s for AI

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Attempt 1: Call Backend (NestJS)
    // Works perfectly on localhost, or when a real backend is deployed and linked.
    try {
      const res = await fetch(`${apiUrl}/ai/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
    } catch (backendError) {
      console.log('[api/ai-extract] Backend unreachable, falling back to direct OpenAI call...');
    }

    // Attempt 2: Direct OpenAI call (Vercel serverless fallback)
    // Works on Vercel as long as OPENAI_API_KEY is set in Vercel Environment Variables.
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: { code: 'NO_API_KEY', message: '백엔드 서버에 연결할 수 없으며, Vercel 환경변수에 OPENAI_API_KEY가 없습니다.' } },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { imageBase64, textContent } = body;
    
    if (!imageBase64 && !textContent) {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: '이미지나 텍스트 내용 중 하나는 필수입니다.' } },
        { status: 400 }
      );
    }

    const userMessageContent: any[] = [];
    
    if (textContent) {
      userMessageContent.push({ type: 'text', text: `Extract real estate information from the following text:\n\n${textContent}` });
    } else {
      userMessageContent.push({ type: 'text', text: 'Extract real estate information from this image.' });
    }

    if (imageBase64) {
      const dataUri = imageBase64.startsWith('data:image') 
          ? imageBase64 
          : `data:image/jpeg;base64,${imageBase64}`;
      userMessageContent.push({ type: 'image_url', image_url: { url: dataUri } });
    }

    const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts real estate information from an image or text (business card, handwritten note, flyer, KakaoTalk/SMS messages). 
Return ONLY a valid JSON object matching the following structure without markdown formatting or comments.
Structure:
{
  "type": "listing" | "looking_for", // "listing" if selling/renting out a property. "looking_for" if buying/renting.
  "category_codes": ["residential", "commercial", "industrial", "land"], // Infer based on context. "residential" for 아파트, 빌라. "commercial" for 상가. Array.
  "transaction_types": ["sale", "jeonse", "monthly_rent", "premium_transfer"], // Infer based on context (매매, 전세, 월세, 권리금양도). Array.
  "price_sale": 50000, // Number in 10,000 KRW (만 원). e.g., 5억 = 50000. null if not found.
  "deposit": 1000, // Deposit in 10,000 KRW
  "monthly_rent": 50, // Monthly rent in 10,000 KRW
  "area_exclusive": 84, // Area in square meters (㎡). Pyeong (평) should be converted to ㎡ (* 3.3058). null if not found.
  "address_full": "서울시 강남구...", // Full address string
  "customer_name": "홍길동", // Extracted customer/contact name
  "customer_phone": "010-1234-5678", // Extracted phone number
  "agent_memo": "Any other additional information found on the image or text." // Extra details
}`
          },
          {
            role: 'user',
            content: userMessageContent,
          },
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' }
    });

    const jsonStr = aiResponse.choices[0].message.content;
    const data = JSON.parse(jsonStr || '{}');

    return NextResponse.json({ ok: true, data }, { status: 200 });

  } catch (error: any) {
    console.error('[api/ai-extract] error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'PROXY_ERROR', message: error.message || 'AI 프록시/직접 호출 오류' } },
      { status: 500 }
    );
  }
}
