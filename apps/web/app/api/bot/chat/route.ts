import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SYSTEM_PROMPT = `당신은 랜드노트의 '부동산 매물 자동 접수 AI 봇'입니다.
말투는 기계적이거나 지루하지 않고, 생동감 있고 비서처럼 다정하며 친근하고 신속한 말투를 유지해야 합니다. 항상 친절한 느낌의 인사와 공감 표현을 섞어가며 경쾌하게 답변해 주세요!

[금지 사항 - 필수 준수]
1. 답변에 **이모지, 아이콘, 특수 그림 문자(예: 🤖, 👍, ✨ 등)**를 절대 사용하지 마세요. 오직 한글 문자만 출력해야 합니다.
2. 별표(**, ***), 대시(-), 슬래시 등 **마크다운 서식 기호**를 절대 쓰지 마세요. 텍스트 리스트 형태를 피하고 모든 답변을 줄글 형태의 일반 문장으로 출력하세요. 음성 합성 엔진(TTS)이 막힘없이 자연스럽게 읽어야 하기 때문입니다.

[대화 스타일]
- 생동감 있고 밝은 비서 톤 (예: "~요!", "~해드릴게요!", "~이군요!")
- 고객의 답변에 신속하고 따뜻하게 공감한 뒤, 군더더기 없이 빠르고 정확하게 다음 핵심 정보만 간단히 유도하세요.
- 첫 인사나 답변 시작 시 "안녕하세요! 중개사님의 든든한 AI 비서입니다!" 또는 "아, 정말 잘 알겠습니다!" 처럼 에너제틱하게 리액션해 주세요.

[필수 수집 정보]
- 매물 종류 (예: 아파트, 상가, 공장, 토지 등)
- 거래 종류 (예: 매매, 전세, 월세)
- 주소 (대략적인 동/리 단위라도)
- 희망 가격 (매매가, 보증금, 월세 등)
- 면적 (대지면적, 전용면적 등)
- 특수 정보 (공장일 경우 층고, 동력 등 / 상가일 경우 권리금 유무 등)

[대화 수칙]
1. 한 번에 너무 많은 질문을 하지 마세요. 고객이 피로하지 않도록 한 번에 딱 1~2개씩만 간결하고 정확하게 물어보세요.
2. 사용자가 정보를 제공하면 지체하지 말고 핵심 내용만 똑 부러지게 확인해 주세요.
3. 모든 필수 정보가 수집되었다고 판단되면, 수집된 정보를 마크다운 리스트 없이 한글 문장으로 한눈에 확인하도록 요약해 보여주고 "이대로 매물 접수를 완료해 드릴까요?" 라고 물어보세요.
4. 사용자가 접수에 동의하면 즉시 "save_property_listing" 함수를 호출하여 접수 완료 처리하세요.`;

// Helper functions for parsing Korean prices and features
const parseKoreanPrice = (priceStr: string): number => {
  if (!priceStr) return 1;
  const clean = priceStr.replace(/\s/g, '').replace(/,/g, '');
  
  let total = 0;
  const eokMatch = clean.match(/(\d+(?:\.\d+)?)(?:억)/);
  if (eokMatch) {
    total += parseFloat(eokMatch[1]) * 10000; // 1억 = 10,000만 원
  }
  
  const afterEok = clean.split('억')[1] || clean;
  const manMatch = afterEok.match(/(\d+)(?:만)?/);
  if (manMatch && !afterEok.includes('억')) {
    total += parseInt(manMatch[1], 10);
  } else if (manMatch) {
    let val = parseInt(manMatch[1], 10);
    if (afterEok.includes('천') && !afterEok.includes('만')) {
      val = val * 1000;
    }
    total += val;
  }
  
  if (total === 0) {
    const num = parseInt(clean.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      if (num > 1000000) return Math.floor(num / 10000);
      return num;
    }
  }
  return total > 0 ? total : 1;
};

const parseDepositAndRent = (priceStr: string, featuresStr: string = '') => {
  let deposit = 1000;
  let monthly_rent = 50;
  const combined = (priceStr + ' ' + featuresStr).replace(/\s/g, '').replace(/,/g, '');
  
  const depositMatch = combined.match(/(?:보증금|보증|보)(\d+(?:\.\d+)?)(?:억|만)?/);
  if (depositMatch) {
    let val = parseFloat(depositMatch[1]);
    if (depositMatch[0].includes('억')) val *= 10000;
    deposit = val;
  }
  
  const rentMatch = combined.match(/(?:월세|월|세)(\d+(?:\.\d+)?)(?:만)?/);
  if (rentMatch) {
    monthly_rent = parseFloat(rentMatch[1]);
  }
  
  const slashMatch = combined.match(/(\d+)\/(\d+)/);
  if (slashMatch) {
    deposit = parseInt(slashMatch[1], 10);
    monthly_rent = parseInt(slashMatch[2], 10);
  }
  
  return { deposit, monthly_rent };
};

const parsePremiumPrice = (priceStr: string, featuresStr: string = '') => {
  const combined = (priceStr + ' ' + featuresStr).replace(/\s/g, '').replace(/,/g, '');
  const premiumMatch = combined.match(/(?:권리금|권리|권)(\d+(?:\.\d+)?)(?:억|만)?/);
  if (premiumMatch) {
    let val = parseFloat(premiumMatch[1]);
    if (premiumMatch[0].includes('억')) val *= 10000;
    return val;
  }
  return 100;
};

export async function POST(req: Request) {
  try {
    const { messages, agentId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Verify beta tester authorization
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const agentRes = await fetch(`${apiUrl}/public/agent/${agentId}`);
    if (!agentRes.ok) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    const agentData = await agentRes.json();
    if (!agentData.data?.is_beta_tester) {
      return NextResponse.json({ error: 'Stealth Mode: Agent is not authorized for beta features' }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
    }

    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Call Gemini API with SYSTEM_PROMPT and messages
    const requestBody = {
      system_instruction: {
        parts: { text: SYSTEM_PROMPT }
      },
      contents: contents,
      generationConfig: {
        temperature: 0.1,
      },
      tools: [
        {
          functionDeclarations: [
            {
              name: 'save_property_listing',
              description: 'Save property listing details collected from the user to the database once the user explicitly agrees to complete the registration.',
              parameters: {
                type: 'OBJECT',
                properties: {
                  property_type: { type: 'STRING', description: '매물 종류 (아파트, 상가, 공장, 토지 등)' },
                  transaction_type: { type: 'STRING', description: '거래 종류 (매매, 전세, 월세)' },
                  address: { type: 'STRING', description: '매물 주소' },
                  price: { type: 'STRING', description: '희망 가격 (예: 매매가 4억 5천만 원, 보증금 1천 / 월세 80)' },
                  area: { type: 'STRING', description: '면적 (대지/연면적 등)' },
                  features: { type: 'STRING', description: '특이 사항 및 기타 조건' },
                },
                required: ['property_type', 'transaction_type', 'address', 'price', 'area'],
              },
            },
          ],
        },
      ],
    };

    const responseGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!responseGemini.ok) {
      const errText = await responseGemini.text();
      console.error('Gemini API Error details:', errText);
      throw new Error(`Gemini API Error: ${responseGemini.statusText}`);
    }

    const data = await responseGemini.json();
    console.log('Gemini API Full Response:', JSON.stringify(data, null, 2));

    // Check if Gemini returned a function call
    const candidateParts = data.candidates?.[0]?.content?.parts || [];
    const functionCallPart = candidateParts.find((p: any) => p.functionCall);
    
    if (functionCallPart) {
      const args = functionCallPart.functionCall.args;
      console.log('Received save_property_listing function call:', args);
      
      try {
        // 1. Initialize Supabase with service role key to bypass RLS in server environment
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoucvlpmhrqymziktevu.supabase.co',
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LaugXgJoQNozOLkG14J-CQ_i8PJgJ6b'
        );

        // 2. Fetch agent code case-insensitively using maybeSingle
        const { data: agentDbData, error: agentError } = await supabase
          .from('agents')
          .select('agent_code')
          .ilike('agent_code', agentId)
          .maybeSingle();

        if (agentError) {
          console.error('Error fetching agent code:', agentError);
        }

        const agentCode = agentDbData?.agent_code || 'ATEST';

        // 3. Helper functions for mapping
        const mapPropertyType = (type: string) => {
          const val = (type || '').toLowerCase();
          if (val.includes('아파트') || val.includes('주택') || val.includes('빌라') || val.includes('원룸') || val.includes('주거')) return 'residential';
          if (val.includes('상가') || val.includes('사무실') || val.includes('점포') || val.includes('상업')) return 'commercial';
          if (val.includes('공장') || val.includes('창고') || val.includes('산업')) return 'industrial';
          return 'land';
        };

        const mapTransactionType = (type: string) => {
          const val = (type || '').toLowerCase();
          if (val.includes('매매')) return 'sale';
          if (val.includes('전세')) return 'jeonse';
          if (val.includes('월세')) return 'monthly_rent';
          return 'premium_transfer';
        };

        // 4. Save via Public API call to NestJS backend with correct price validation mapping
        const mappedTxType = mapTransactionType(args.transaction_type);
        const parsedPrice = parseKoreanPrice(args.price);

        const bodyPayload: any = {
          inquiry_type: 'listing',
          customer_name: 'AI 봇 접수 고객',
          customer_phone: '010-0000-0000',
          category_codes: [mapPropertyType(args.property_type)],
          transaction_types: [mappedTxType],
          detailed_conditions: {
            memo: `[AI 봇 접수]\n- 매물종류: ${args.property_type}\n- 거래형태: ${args.transaction_type}\n- 주소: ${args.address}\n- 희망가: ${args.price}\n- 면적: ${args.area}\n- 특징: ${args.features || '없음'}`
          }
        };

        // Apply price fields mapping depending on transaction type to satisfy DTO validators
        if (mappedTxType === 'sale') {
          bodyPayload.price_sale = parsedPrice;
        } else if (mappedTxType === 'jeonse') {
          bodyPayload.price_jeonse = parsedPrice;
        } else if (mappedTxType === 'monthly_rent') {
          const { deposit, monthly_rent } = parseDepositAndRent(args.price, args.features);
          bodyPayload.deposit = deposit;
          bodyPayload.monthly_rent = monthly_rent;
        } else if (mappedTxType === 'premium_transfer') {
          const { deposit, monthly_rent } = parseDepositAndRent(args.price, args.features);
          bodyPayload.deposit = deposit;
          bodyPayload.monthly_rent = monthly_rent;
          bodyPayload.premium_price = parsePremiumPrice(args.price, args.features);
        }

        const apiRes = await fetch(`${apiUrl}/public/inquiries/${agentCode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });

        if (!apiRes.ok) {
          const err = await apiRes.text();
          console.error('NestJS public inquiry API failed:', err);
        } else {
          console.log('Inquiry successfully created in NestJS database!');
        }
      } catch (dbErr) {
        console.error('Failed to store inquiry in database:', dbErr);
      }

      return NextResponse.json({ 
        reply: "매물 접수가 성공적으로 완료되었습니다! 담당 공인중개사가 곧 확인 후 연락드리겠습니다. 감사합니다.",
        isComplete: true,
        savedData: args
      });
    }

    const replyText = candidateParts.find((p: any) => p.text)?.text || '죄송합니다. 답변을 생성하지 못했습니다.';
    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error('Bot Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
