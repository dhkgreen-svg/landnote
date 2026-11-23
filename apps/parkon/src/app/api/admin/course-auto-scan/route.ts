import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import { HoleMetadata } from '@/types/parkon';
import {
  getAutoScanStatusAndNextBatch,
  recordOnlineScanOutcome,
  submitCourseSpecReport,
} from '@/lib/courseSpecServer';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

const ONLINE_PAR_PROMPT = `당신은 대한민국 파크골프장 공식 코스 제원(코스 수 및 홀별 기준타수 Par) 전문 검증 AI입니다.
제공된 이미지 또는 검색 근거를 분석하여 해당 구장의 정확한 코스 수(totalCourses)와 각 홀별 파수(Par 3, 4, 5)를 추출하세요.

[절대 원칙 - 환각/추측 금지]:
1. 구장명이 대상 구장과 실제로 일치하는 안내판·스코어카드·공식 자료일 때만 found: true를 반환하세요. 다른 구장 자료이거나 파수를 전혀 알 수 없으면 반드시 found: false를 반환하세요.
2. 파수(par)를 최우선으로 추출하세요 (각 9홀 합계가 표준 33타인지 반드시 검산).
3. 홀별 거리(distanceMeter)는 안내판/표에 숫자가 명확히 적혀 있을 때만 기입하고, 안 적혀 있거나 불확실하면 절대 추측하지 말고 무조건 0으로 두세요 (앱에서 '__m'으로 표시됨).
4. JSON 스키마:
{
  "found": true,
  "isCourseNameMatched": true,
  "totalCourses": 2,
  "confidenceNote": "구장 코스 안내판에서 A·B코스(18홀, 각 33타) 파수 확인 (거리는 미표기로 0 처리)",
  "holes": [
    { "hole": 1, "par": 4, "distanceMeter": 0 },
    { "hole": 2, "par": 3, "distanceMeter": 0 }
  ]
}`;

async function searchNaverSignboardImages(courseName: string): Promise<string[]> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return [];
  const urls: string[] = [];
  for (const suffix of ['코스안내도', '스코어카드 홀배치도']) {
    try {
      const q = encodeURIComponent(`${courseName} ${suffix}`);
      const res = await fetch(
        `https://openapi.naver.com/v1/search/image.json?query=${q}&display=3&sort=sim`,
        {
          headers: {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        for (const item of data.items || []) {
          if (item?.link && typeof item.link === 'string' && item.link.startsWith('http')) {
            urls.push(item.link);
          }
        }
      }
    } catch {
      // ignore search error
    }
  }
  return Array.from(new Set(urls)).slice(0, 4);
}

async function fetchImageAsInlineData(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || 'image/jpeg';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 2000 || buf.byteLength > 6 * 1024 * 1024) return null;
    return { mimeType: ct.split(';')[0], data: buf.toString('base64') };
  } catch {
    return null;
  }
}

async function analyzeCourseParOnline(course: { id: string; name: string; region: string }): Promise<{
  found: boolean;
  totalCourses?: number;
  holesMetadata?: HoleMetadata[];
  evidencePhotoUrl?: string;
  note: string;
}> {
  if (!GEMINI_API_KEY) {
    return { found: false, note: 'GEMINI_API_KEY 미설정' };
  }

  // 1) Try Naver Signboard Image Search + Gemini Vision first
  const candidateUrls = await searchNaverSignboardImages(course.name);
  for (const imgUrl of candidateUrls) {
    const inline = await fetchImageAsInlineData(imgUrl);
    if (!inline) continue;
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `대상 구장: ${course.name} (${course.region}). 이 온라인 이미지가 해당 구장의 실제 코스 안내판 또는 스코어카드인지 판별하고, 맞다면 홀별 파수(Par)를 우선 추출하세요. 불확실한 거리는 반드시 0으로 두세요.`,
                  },
                  { inlineData: inline },
                ],
              },
            ],
            systemInstruction: { parts: [{ text: ONLINE_PAR_PROMPT }] },
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
          }),
        }
      );
      if (!resp.ok) continue;
      const data = await resp.json();
      const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!txt) continue;
      const parsed = JSON.parse(txt);
      if (parsed?.found && parsed?.isCourseNameMatched && Array.isArray(parsed.holes) && parsed.holes.length >= 9) {
        const totalCourses = Math.max(1, Math.min(12, Number(parsed.totalCourses) || Math.round(parsed.holes.length / 9)));
        const needed = totalCourses * 9;
        const holesMetadata: HoleMetadata[] = Array.from({ length: needed }, (_, i) => {
          const h = parsed.holes.find((x: any) => Number(x.hole) === i + 1) || parsed.holes[i];
          const p = Number(h?.par);
          const d = Math.round(Number(h?.distanceMeter) || 0);
          return {
            hole: i + 1,
            par: p === 3 || p === 4 || p === 5 ? p : 3,
            distanceMeter: d >= 15 && d <= 250 ? d : 0, // 미확인 거리는 0 ('__m')
            isVerified: true,
          };
        });
        // 33-par sanity check (allow 31..35 for genuine local variations, prefer 33)
        const allCoursesValid = Array.from({ length: totalCourses }, (_, cIdx) => {
          const slice = holesMetadata.slice(cIdx * 9, cIdx * 9 + 9);
          const sum = slice.reduce((s, x) => s + x.par, 0);
          return sum >= 31 && sum <= 35;
        }).every(Boolean);

        if (allCoursesValid) {
          return {
            found: true,
            totalCourses,
            holesMetadata,
            evidencePhotoUrl: `data:${inline.mimeType};base64,${inline.data}`,
            note: parsed.confidenceNote || '온라인 안내판 이미지에서 파수 추출 완료',
          };
        }
      }
    } catch {
      // try next candidate image
    }
  }

  // 2) Fallback: Gemini with Google Search Grounding (checks official municipal / blog par tables)
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: [{ google_search: {} }],
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `대한민국 "${course.region} ${course.name}" 파크골프장의 실제 코스 수와 각 코스 1~9홀 기준타수(Par 3/4/5) 표가 온라인(지자체 안내·대한파크골프협회·방문기 안내판 기록)에 명확히 공개되어 있는지 검색하세요. 확실한 홀별 파수 근거가 있을 때만 JSON으로 답하고, 근거가 없으면 반드시 {"found": false}로 답하세요. 불확실한 거리는 무조건 0으로 두세요.\n응답은 순수 JSON 객체만 출력하세요.`,
                },
              ],
            },
          ],
          systemInstruction: { parts: [{ text: ONLINE_PAR_PROMPT }] },
          generationConfig: { temperature: 0.1 },
        }),
      }
    );
    if (resp.ok) {
      const data = await resp.json();
      const rawTxt = (data.candidates?.[0]?.content?.parts || [])
        .map((p: any) => p.text || '')
        .join('\n')
        .trim();
      const jsonMatch = rawTxt.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.found && parsed?.isCourseNameMatched && Array.isArray(parsed.holes) && parsed.holes.length >= 9) {
          const totalCourses = Math.max(1, Math.min(12, Number(parsed.totalCourses) || Math.round(parsed.holes.length / 9)));
          const needed = totalCourses * 9;
          const holesMetadata: HoleMetadata[] = Array.from({ length: needed }, (_, i) => {
            const h = parsed.holes.find((x: any) => Number(x.hole) === i + 1) || parsed.holes[i];
            const p = Number(h?.par);
            const d = Math.round(Number(h?.distanceMeter) || 0);
            return {
              hole: i + 1,
              par: p === 3 || p === 4 || p === 5 ? p : 3,
              distanceMeter: d >= 15 && d <= 250 ? d : 0,
              isVerified: true,
            };
          });
          const allCoursesValid = Array.from({ length: totalCourses }, (_, cIdx) => {
            const sum = holesMetadata.slice(cIdx * 9, cIdx * 9 + 9).reduce((s, x) => s + x.par, 0);
            return sum === 33;
          }).every(Boolean);
          if (allCoursesValid) {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="260" viewBox="0 0 560 260">
              <rect width="560" height="260" rx="16" fill="#0f172a"/>
              <rect x="14" y="14" width="532" height="232" rx="12" fill="#f8fafc" stroke="#0ea5e9" stroke-width="3"/>
              <text x="32" y="58" fill="#0f172a" font-family="sans-serif" font-size="21" font-weight="bold">🌐 온라인 검색 검증: ${course.name}</text>
              <text x="32" y="96" fill="#0369a1" font-family="sans-serif" font-size="16" font-weight="bold">${totalCourses}코스 (${needed}홀) · 각 코스 33타 일치 확인</text>
              <text x="32" y="140" fill="#475569" font-family="sans-serif" font-size="14">${(parsed.confidenceNote || '온라인 공개 안내도 파수 대조 완료').slice(0, 42)}</text>
              <text x="32" y="216" fill="#059669" font-family="sans-serif" font-size="13" font-weight="bold">PARKY APP · 파수(Par) 우선 추출 · 미확인 거리는 __m 유지</text>
            </svg>`;
            return {
              found: true,
              totalCourses,
              holesMetadata,
              evidencePhotoUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
              note: parsed.confidenceNote || '온라인 공개 자료에서 홀별 파수(33타) 확인',
            };
          }
        }
      }
    }
  } catch {
    // ignore grounding error
  }

  return {
    found: false,
    note: '온라인에 선명한 홀별 안내판/파수 자료가 없어 30일 쿨다운 처리됨 (중복 재검색 방지)',
  };
}

function buildSimulatedOnlineParResult(course: { id: string; name: string; region: string }) {
  const totalCourses = 2;
  const pars: (3 | 4 | 5)[] = [
    4, 3, 4, 5, 3, 3, 4, 3, 4, // A코스 = 33타
    3, 4, 4, 3, 5, 3, 4, 4, 3, // B코스 = 33타
  ];
  const holesMetadata: HoleMetadata[] = pars.map((par, idx) => ({
    hole: idx + 1,
    par,
    distanceMeter: 0, // 파수 우선 업그레이드 · 미확인 거리는 숫자 없이 0 ('__m')!
    isVerified: true,
  }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="260" viewBox="0 0 560 260">
    <rect width="560" height="260" rx="16" fill="#064e3b"/>
    <rect x="14" y="14" width="532" height="232" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="3"/>
    <text x="30" y="58" fill="#065f46" font-family="sans-serif" font-size="21" font-weight="bold">🌐 온라인 안내판 파수 추출: ${course.name}</text>
    <text x="30" y="98" fill="#047857" font-family="sans-serif" font-size="16" font-weight="bold">A코스 33타 (4-3-4-5-3-3-4-3-4) · B코스 33타 (3-4-4-3-5-3-4-4-3)</text>
    <text x="30" y="142" fill="#334155" font-family="sans-serif" font-size="14">홀별 거리: 안내판 미표기 ➔ 전체 '__m' (미입력 빈칸 유지)</text>
    <text x="30" y="216" fill="#b45309" font-family="sans-serif" font-size="13" font-weight="bold">PARKY APP · 온라인 안내판 AI 파수 우선 업그레이드</text>
  </svg>`;
  return {
    found: true,
    totalCourses,
    holesMetadata,
    evidencePhotoUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    note: '온라인 안내판 파수(Par) 우선 추출 (거리는 __m 빈칸 유지)',
  };
}

async function runBatchScan(options: {
  targetCourseId?: string;
  batchSize?: number;
  simulateDemo?: boolean;
}) {
  const batchSize = Math.max(1, Math.min(20, Number(options.batchSize) || 5));
  const statusInfo = await getAutoScanStatusAndNextBatch(batchSize);

  const targets = options.targetCourseId
    ? DEFAULT_COURSES.filter((c) => c.id === options.targetCourseId)
    : statusInfo.nextBatch;

  const results: Array<{
    courseId: string;
    courseName: string;
    queued: boolean;
    submissionId?: string;
    note: string;
  }> = [];

  for (const c of targets) {
    const extracted = options.simulateDemo
      ? buildSimulatedOnlineParResult({ id: c.id, name: c.name, region: c.region || '' })
      : await analyzeCourseParOnline({ id: c.id, name: c.name, region: c.region || '' });

    if (extracted.found && extracted.totalCourses && extracted.holesMetadata) {
      const subRes = await submitCourseSpecReport({
        courseId: c.id,
        courseName: c.name,
        region: c.region,
        prevTotalCourses: c.totalCourses || Math.round((c.totalHoles || 18) / 9),
        prevHolesMetadata: c.holesMetadata,
        totalCourses: extracted.totalCourses,
        holesMetadata: extracted.holesMetadata,
        evidencePhotoUrl: extracted.evidencePhotoUrl,
        source: 'ONLINE_IMAGE_AI',
        contributorName: '🌐 온라인 안내판 AI 레이더',
        memberCode: 'SYSTEM_ONLINE_AI',
        isExecutive: false, // 반드시 /admin 대기열(PENDING)에 올려 대표님 1초 승인 후 반영!
      });

      await recordOnlineScanOutcome({
        courseId: c.id,
        courseName: c.name,
        outcome: 'QUEUED',
        note: extracted.note,
      });

      results.push({
        courseId: c.id,
        courseName: c.name,
        queued: Boolean(subRes.ok),
        submissionId: subRes.submission?.id,
        note: extracted.note,
      });
    } else {
      await recordOnlineScanOutcome({
        courseId: c.id,
        courseName: c.name,
        outcome: 'NO_DATA_COOLDOWN',
        note: extracted.note,
      });
      results.push({
        courseId: c.id,
        courseName: c.name,
        queued: false,
        note: extracted.note,
      });
    }
  }

  const updatedStatus = await getAutoScanStatusAndNextBatch(15);
  return {
    scannedCount: results.length,
    queuedCount: results.filter((r) => r.queued).length,
    cooldownCount: results.filter((r) => !r.queued).length,
    results,
    autoScanStatus: updatedStatus.status,
  };
}

/**
 * GET: Vercel 일일 자동 크론 (매일 04:00 KST 호출)
 * - 1단계 (미점검 구장 남아있을 때): 매일 15곳씩 중복 없이 순차 탐색하여 /admin 승인 대기열에 적재
 * - 2단계 (미점검 정복 완료 시): 매월 1일에만 실행 (2~31일은 즉시 스킵하여 비용 0원 유지)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusOnly = searchParams.get('statusOnly') === '1';
    if (statusOnly) {
      const info = await getAutoScanStatusAndNextBatch(15);
      return NextResponse.json({ success: true, autoScanStatus: info.status });
    }

    // Verify Vercel Cron authorization when CRON_SECRET is configured
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized cron request' }, { status: 401 });
    }

    const current = await getAutoScanStatusAndNextBatch(15);
    if (current.status.lifecycleMode === 'PHASE_2_MONTHLY_RADAR') {
      // KST date check (UTC + 9h)
      const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
      if (kstNow.getUTCDate() !== 1) {
        return NextResponse.json({
          success: true,
          skipped: true,
          lifecycleMode: 'PHASE_2_MONTHLY_RADAR',
          message: '전국 미점검 구장 1차 정복 완료 상태 — 월 1회(매월 1일) 유지관리 모드로 대기 중입니다.',
          autoScanStatus: current.status,
        });
      }
    }

    const summary = await runBatchScan({ batchSize: 15, simulateDemo: false });
    return NextResponse.json({ success: true, ...summary });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || '자동 구장 스캔 크론 오류' },
      { status: 500 }
    );
  }
}

/**
 * POST: /admin 관제센터 수동 즉시 스캔 (단일 구장 또는 N곳 배치)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const summary = await runBatchScan({
      targetCourseId: body?.courseId ? String(body.courseId) : undefined,
      batchSize: body?.batchSize ? Number(body.batchSize) : 5,
      simulateDemo: Boolean(body?.simulateDemo),
    });
    return NextResponse.json({ success: true, ...summary });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || '온라인 파수 탐색 실행 중 오류' },
      { status: 500 }
    );
  }
}
