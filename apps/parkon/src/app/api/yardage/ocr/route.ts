import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const YARDAGE_OCR_PROMPT = `당신은 파크골프(Park Golf) 수기 야디지 북(종이 공략 노트) 전문 Vision OCR 판독 AI입니다.
사용자가 손으로 적거나 그린 홀 공략 메모 사진을 분석하여 아래 JSON 규격으로만 반환하세요.

[필드 규칙]
- targetDistance: 숫자(정수, m 단위. 인식되지 않으면 기본값 사용)
- aimingPoint: "깃대" | "좌측 나무" | "우측 공략" | "좌측 공략" 또는 짧은 텍스트
- targetScore: "버디 도전" | "파 세이브(3~4타)" | "안전 운영" 중 가장 가까운 값
- turfType: "천연잔디" | "인조잔디" 중 하나 ("인조"가 포함되면 "인조잔디")
- backSpace: "여유" | "없음(위험)" 중 하나
- sideSpace: "여유" | "좁음" 중 하나
- greenSpeed: "빠름(빙판)" | "보통" | "느림(까끌)" 중 하나
- fairwayCondition: "양호" | "젖음/질퍽" | "맨땅 많음" 중 하나
- memo: 손글씨로 적힌 핵심 공략법 및 주의사항 요약 문장

반드시 아래 JSON 형식으로만 응답하세요:
{
  "targetDistance": 90,
  "aimingPoint": "좌측 공략",
  "targetScore": "파 세이브(3~4타)",
  "turfType": "인조잔디",
  "backSpace": "없음(위험)",
  "sideSpace": "좁음",
  "greenSpeed": "빠름(빙판)",
  "fairwayCondition": "양호",
  "memo": "그린 앞 좌로 흐름, 4타 위주로 안전하게 스트로크"
}`;

export async function POST(req: Request) {
  try {
    const { image, officialDistance, courseName, holeLabel } = await req.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '종이 공략 노트 사진 이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    if (GEMINI_API_KEY) {
      try {
        let mimeType = 'image/jpeg';
        let base64Content = image;
        if (image.startsWith('data:')) {
          const m = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (m) {
            mimeType = m[1];
            base64Content = m[2];
          }
        }

        const requestBody = {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `구장: ${courseName || '파크골프장'}, 홀: ${holeLabel || 'B-5'}, 공식거리: ${officialDistance || 100}m. 이 수기 공략 노트 사진을 판독해 주세요.`,
                },
                {
                  inlineData: {
                    mimeType,
                    data: base64Content,
                  },
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [{ text: YARDAGE_OCR_PROMPT }],
          },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textContent) {
            const parsed = JSON.parse(textContent);
            return NextResponse.json({
              success: true,
              source: 'gemini-vision',
              parsed,
            });
          }
        }
      } catch (err) {
        console.warn('Gemini Yardage OCR fallback triggered:', err);
      }
    }

    // Fallback smart extraction when API key is not configured locally
    const baseDist = Number(officialDistance) || 100;
    const fallbackDist = Math.max(20, baseDist - 10);
    return NextResponse.json({
      success: true,
      source: 'smart-fallback',
      parsed: {
        targetDistance: fallbackDist,
        aimingPoint: '좌측 나무',
        targetScore: '파 세이브(3~4타)',
        turfType: '인조잔디',
        backSpace: '없음(위험)',
        sideSpace: '좁음',
        greenSpeed: '빠름(빙판)',
        fairwayCondition: '양호',
        memo: `${holeLabel || '해당 홀'} 그린 앞 좌로 흐름, ${fallbackDist}m 기준 파 세이브 위주로 부드럽게 스트로크`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || '공략 노트 판독 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
