import { NextResponse } from 'next/server';
import { OFFICIAL_PARK_GOLF_RULES, matchOfficialParkGolfRule, enforceParkGolfRules } from '@/lib/officialRules';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const OFFICIAL_RULES_TEXT = OFFICIAL_PARK_GOLF_RULES.map(
  (r) => `[${r.article}] ${r.title}\n- 공인 규정 원문: ${r.officialRuleText || ''}\n- 판정 결론: ${r.verdict}\n- 벌타: ${r.penalty}\n- 현장 조치: ${r.procedure}\n- 음성 답안: ${r.voiceAnswer}`
).join('\n\n');

const SYSTEM_INSTRUCTION = `당신은 (사)대한파크골프협회 공인 규정에 100% 정통한 최고의 파크골프 룰 판정관 '룰 솔로몬'입니다.
골퍼들이 경기 필드에서 동반자와 룰 분쟁이 발생했을 때 질문합니다.
질문자의 자연어 문맥, 말뚝의 색상(하얀색 vs 빨간색), 시설물의 성격(말뚝 자체 vs 외곽 안전망), 그리고 공의 최종 정지 위치를 종합적으로 고려하여 공정하고 명쾌한 공인 판정을 내려주세요.

★★★★★ [파크골프 절대 불변의 대원칙: 최종 정지 위치 기준 판정] ★★★★★
1. [하얀 말뚝을 지나 그물망(네트)/나무/장애물을 맞고 코스 안으로 들어온 공 -> 무조건 【세이프(IN)】 벌타 없음(무벌)]:
   - 대한파크골프협회 공인 규정 제33조 제2항에 따라, 공이 하얀 OB 말뚝을 지나서 외곽의 그물망(네트, 안전망, 철망)이나 나무, 장애물을 맞고 튕겨서 최종적으로 코스 안(인플레이 구역)으로 다시 들어와 멈췄다면, 공의 최종 정지 위치가 코스 안이므로 무조건 【세이프(IN)】이며 벌타가 전혀 없습니다(무벌)!
   - 마지막에 어떤 형태로든 간에 OB선 밖으로 있지만 않으면 OB가 아닙니다!
   - 멈춘 자리에서 그대로 다음 타(2타째)를 진행합니다.

2. [OB가 성립하는 경우 (2벌타)]:
   - 공이 최종적으로 OB선(하얀 선) 밖으로 나가서 멈춘 경우 (2벌타).
   - 빨간 OB선 밖으로 나간 경우 (2벌타).

3. [파크골프 절대 불변 원칙]:
   - 파크골프에서 OB는 일반 골프와 달리 1벌타가 절대 없고 무조건 【2벌타】입니다.
   - 절대로 원래 자리(티잉그라운드)로 돌아가지 않고 OB 통과 지점 코스 내 2클럽 헤드 이내에서 칩니다.
   - 워터해저드 침수 2벌타, 남의 공을 친 오구 플레이도 2벌타입니다.

[참조: (사)대한파크골프협회 공식 경기 규정집]
${OFFICIAL_RULES_TEXT}

[응답 작성 수칙]
1. 잡다한 서두는 일절 생략하세요.
2. verdict: 판정 결론을 명확하고 굵직하게 작성 (예: "【세이프(IN)】 벌타 없음", "【2벌타 가산 후 2클럽 처치】", "【무벌 구제】")
3. penalty: 벌타 여부만 단도직입적으로 명시 (예: "벌타 없음 (무벌)", "2벌타", "1타 가산")
4. procedure: 현장에서 바로 실행할 수 있는 조치 순서 1~2문장
5. voiceAnswer: 필드에서 스마트폰 스피커로 동반자들에게 직접 들려줄 핵심 판정 한두 문장.
6. officialArticle: 근거가 되는 (사)대한파크골프협회 공식 규정 조항 (예: "제33조(아웃 오브 바운즈: OB 및 처치) 제2항", "제34조 제1항" 등)
7. officialRuleText: 해당 판정의 근거가 되는 협회 공식 경기규정 원문 조항 내용 (공식 규정 문구 인용)

반드시 아래 JSON 포맷으로만 응답하세요:
{
  "title": "상황 요약 제목",
  "verdict": "【판정 결론】",
  "penalty": "벌타 여부",
  "procedure": "현장 처리 절차 안내",
  "voiceAnswer": "스피커로 낭독할 핵심 결론 문장",
  "officialArticle": "(사)대한파크골프협회 경기규정 제XX조 제X항",
  "officialRuleText": "공식 경기 규정 조항 원문 내용"
}`;

export async function POST(req: Request) {
  try {
    const { question, category } = await req.json();

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const trimmedQuestion = question.trim();

    // 1단계: 제미나이 AI 실시간 문맥 심층 판정 (Primary Intelligence Engine)
    try {
      const promptText = `[질문 카테고리]: ${category || '전체'}\n[골퍼의 현장 질문]: ${trimmedQuestion}\n\n위 상황에 대해 (사)대한파크골프협회 공식 규정집 원칙과 하얀 말뚝 vs 외곽 안전망 vs 빨간 선 구분 기준에 따른 공인 판정을 JSON 형식으로 내려주세요.`;

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ],
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1, // High consistency and domain adherence
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          let parsed: any = {};
          try {
            parsed = JSON.parse(candidateText);
          } catch {
            parsed = { verdict: candidateText, procedure: candidateText, voiceAnswer: candidateText };
          }

          // 최소 안전 가드 (일반 골프 1벌타/티 복귀 오류만 정화 및 공인 규정 매핑)
          const enforced = enforceParkGolfRules(trimmedQuestion, {
            title: parsed.title || '파크골프 공식 규정 판정',
            verdict: parsed.verdict || '',
            penalty: parsed.penalty || '',
            procedure: parsed.procedure || '',
            voiceAnswer: parsed.voiceAnswer || '',
            officialArticle: parsed.officialArticle || '',
            officialRuleText: parsed.officialRuleText || '',
          });

          return NextResponse.json({
            success: true,
            data: {
              id: `gemini-${Date.now()}`,
              title: enforced.title,
              situation: trimmedQuestion,
              verdict: enforced.verdict,
              penalty: enforced.penalty,
              procedure: enforced.procedure,
              voiceAnswer: enforced.voiceAnswer || `${enforced.verdict}. ${enforced.procedure}`,
              officialArticle: enforced.officialArticle,
              officialRuleText: enforced.officialRuleText,
              tags: ['대한파크골프협회공인', '제미나이AI심층판정', '실시간분석'],
            },
          });
        }
      }
    } catch (aiErr) {
      console.warn('Gemini AI call failed, falling back to local rule matching:', aiErr);
    }

    // 2단계: 네트워크 장애 시 오프라인 로컬 규정집 폴백
    const directOfficialMatch = matchOfficialParkGolfRule(trimmedQuestion);
    if (directOfficialMatch) {
      return NextResponse.json({
        success: true,
        data: {
          id: `official-${Date.now()}`,
          title: directOfficialMatch.title,
          situation: trimmedQuestion,
          verdict: directOfficialMatch.verdict,
          penalty: directOfficialMatch.penalty,
          procedure: directOfficialMatch.procedure,
          voiceAnswer: directOfficialMatch.voiceAnswer,
          officialArticle: directOfficialMatch.article,
          officialRuleText: directOfficialMatch.officialRuleText,
          tags: ['대한파크골프협회공인', directOfficialMatch.article, '오프라인규정집'],
        },
      });
    }

    // 기본 안전 응답
    return NextResponse.json({
      success: true,
      data: {
        id: `default-${Date.now()}`,
        title: '파크골프 공인 규정 안내',
        situation: trimmedQuestion,
        verdict: '【현장 확인 요망】',
        penalty: '규정집 참조',
        procedure: '공의 최종 정지 위치가 코스 안쪽이면 세이프, 외곽 안전망이나 빨간 선 밖으로 나갔다면 2벌타 OB 처리 후 2클럽 이내에서 진행합니다.',
        voiceAnswer: '공이 코스 안쪽에 있으면 세이프이며, 안전망이나 선 밖으로 나갔다면 2벌타입니다.',
        officialArticle: '제33조(아웃 오브 바운즈: OB 및 처치)',
        officialRuleText: '공 전체가 코스 경계선(OB선)을 벗어나지 않고 코스 안에 최종 정지한 경우에는 세이프이며, 완전히 벗어난 때에는 2벌타를 가산하고 2클럽 이내에서 플레이한다.',
        tags: ['대한파크골프협회공인'],
      },
    });
  } catch (error: any) {
    console.error('Solomon API Route Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
