import { NextResponse } from 'next/server';
import { HoleMetadata } from '@/types/parkon';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const SPEC_OCR_SYSTEM_PROMPT = `당신은 대한민국 전국 파크골프장의 티박스 코스 안내판, 구장 안내도, 종이 스코어카드 제원표에서 코스 수와 전 홀별 파(Par)·거리(m)를 정밀 추출하는 AI입니다.

[규칙]:
1. totalCourses: 전체 코스 개수 (1~12, 각 코스는 9홀). 예: A·B코스 = 2, A·B·C코스 = 3, A·B·C·D코스 = 4.
2. courseName: 안내판이나 카드에 적힌 구장명 (안 보이면 힌트 구장명 사용).
3. holes: 1번홀부터 (totalCourses * 9)번홀까지 순서대로 추출.
   - hole: 1부터 시작하는 연속 번호 (A-1=1 ... A-9=9, B-1=10 ... B-9=18, C-1=19 ... C-9=27, D-1=28 ... D-9=36)
   - par: 3, 4, 5 중 하나 (대한파크골프협회 표준 9홀 합계 33타 참고)
   - distanceMeter: 거리(미터 정수, 안 보이면 0)
4. 반드시 아래 JSON 스키마로만 응답하세요:
{
  "courseName": "해평파크골프장",
  "totalCourses": 3,
  "holes": [
    { "hole": 1, "par": 4, "distanceMeter": 85 },
    { "hole": 2, "par": 3, "distanceMeter": 55 }
  ]
}`;

function buildSampleExtractedSpec(courseNameHint?: string): {
  courseName: string;
  totalCourses: number;
  holesMetadata: HoleMetadata[];
  note: string;
} {
  // 현실적인 3코스 27홀(각 코스 33타) 실측 샘플 제원
  const patterns: Array<{ par: 3 | 4 | 5; dist: number }[]> = [
    [
      { par: 4, dist: 85 }, { par: 3, dist: 52 }, { par: 4, dist: 92 },
      { par: 3, dist: 48 }, { par: 5, dist: 128 }, { par: 3, dist: 58 },
      { par: 4, dist: 78 }, { par: 3, dist: 54 }, { par: 4, dist: 88 },
    ],
    [
      { par: 3, dist: 55 }, { par: 4, dist: 82 }, { par: 3, dist: 49 },
      { par: 4, dist: 90 }, { par: 3, dist: 57 }, { par: 4, dist: 84 },
      { par: 5, dist: 132 }, { par: 3, dist: 46 }, { par: 4, dist: 86 },
    ],
    [
      { par: 4, dist: 80 }, { par: 3, dist: 53 }, { par: 3, dist: 60 },
      { par: 4, dist: 94 }, { par: 4, dist: 76 }, { par: 3, dist: 50 },
      { par: 4, dist: 88 }, { par: 3, dist: 55 }, { par: 5, dist: 135 },
    ],
  ];
  const holesMetadata: HoleMetadata[] = [];
  patterns.forEach((courseList, cIdx) => {
    courseList.forEach((item, hIdx) => {
      holesMetadata.push({
        hole: cIdx * 9 + hIdx + 1,
        par: item.par,
        distanceMeter: item.dist,
        isVerified: true,
      });
    });
  });
  return {
    courseName: courseNameHint || '현장 안내판 샘플 구장',
    totalCourses: 3,
    holesMetadata,
    note: '✨ 현장 안내판(3코스 27홀 · 코스별 33타) 샘플 제원을 추출했습니다. 아래 표에서 실제와 다른 홀만 1초 수정 후 제출해 보세요!',
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, courseNameHint, sampleMode } = body || {};

    if (sampleMode) {
      const sample = buildSampleExtractedSpec(courseNameHint);
      return NextResponse.json({ success: true, ...sample });
    }

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, message: '구장 안내판 또는 종이 스코어카드 사진을 올려주세요.' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: '서버에 GEMINI_API_KEY가 설정되지 않아 사진 AI 판독을 수행할 수 없습니다. 아래 표에서 직접 선택하시거나 샘플 체험을 이용해 주세요.',
        },
        { status: 503 }
      );
    }

    let mimeType = 'image/jpeg';
    let base64Content = image;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Content = match[2];
      }
    }

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `이 파크골프장 코스 안내판(또는 종이 스코어카드) 이미지에서 전체 코스 수(totalCourses)와 각 홀별 파(par 3/4/5) 및 거리(distanceMeter)를 정확히 추출해 주세요. 참고 구장명: ${courseNameHint || '미상'}`,
            },
            { inlineData: { mimeType, data: base64Content } },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: SPEC_OCR_SYSTEM_PROMPT }] },
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

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'AI 판독 응답이 지연되고 있습니다. 사진을 선명하게 다시 찍거나 아래 표에서 직접 조정해 주세요.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      return NextResponse.json(
        { success: false, message: '사진에서 코스 제원표를 읽지 못했습니다. 파수(PAR) 숫자가 잘 보이게 촬영해 주세요.' },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(textContent);
    const rawHoles: any[] = Array.isArray(parsed.holes) ? parsed.holes : [];
    const inferredCourses = Math.max(
      1,
      Math.min(12, Number(parsed.totalCourses) || Math.ceil(rawHoles.length / 9) || 2)
    );
    const expectedHoles = inferredCourses * 9;

    const holesMetadata: HoleMetadata[] = Array.from({ length: expectedHoles }, (_, i) => {
      const hNum = i + 1;
      const found = rawHoles.find((x) => Number(x.hole) === hNum) || rawHoles[i];
      const rawPar = Number(found?.par);
      const safePar = rawPar === 3 || rawPar === 4 || rawPar === 5 ? rawPar : 3;
      const rawDist = Math.round(Number(found?.distanceMeter) || 0);
      const safeDist = rawDist >= 15 && rawDist <= 250 ? rawDist : 0;
      return {
        hole: hNum,
        par: safePar,
        distanceMeter: safeDist,
        isVerified: true,
      };
    });

    return NextResponse.json({
      success: true,
      courseName: parsed.courseName || courseNameHint || '파크골프장',
      totalCourses: inferredCourses,
      holesMetadata,
      note: `✅ AI가 ${inferredCourses}코스(${expectedHoles}홀) 제원을 추출했습니다! 아래 표에서 확인 후 제출해 주세요.`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || '구장 제원 사진 판독 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
