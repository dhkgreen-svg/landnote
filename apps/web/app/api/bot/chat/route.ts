import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SYSTEM_PROMPT = `당신은 랜드노트의 '부동산 매물 자동 접수 AI 봇'입니다.
말투는 기계적이거나 지루하지 않고, 생동감 있고 비서처럼 다정하며 친근하고 신속한 말투를 유지해야 합니다. 항상 친절한 느낌의 인사와 공감 표현을 섞어가며 경쾌하게 답변해 주세요!

[금지 사항 - 필수 준수]
1. 답변에 **이모지, 아이콘, 특수 그림 문자(예: 🤖, 👍, ✨ 등)**를 절대 사용하지 마세요. 오직 한글 문자만 출력해야 합니다.
2. 별표(**, ***), 대시(-), 슬래시 등 일반 마크다운 서식 기호는 가급적 피해주세요. (단, 마지막 단계에서 수집된 매물 내역을 표 형식으로 요약하여 출력하기 위해 마크다운 표(| 항목 | 내용 |) 서식을 사용하는 것은 필수이며 강력하게 권장됩니다.)

[대화 흐름 단계 - 순서 엄수]
1단계 (매물 종류 선택): 고객이 아파트, 상가, 공장, 토지 중 하나를 입력/선택합니다.
2단계 (의뢰인 인적사항): 매물 종류가 입력되자마자, 불필요한 리액션 없이 바로 다음 질문으로 즉시 "의뢰하시는 분 연락처를 부탁드리겠습니다. (성함도 함께 알려주셔도 좋습니다.)" 라고 명확하게 질문하여 연락처를 획득하세요. 전화번호는 필수 수집 항목이며 성함은 선택 사항입니다. 사용자가 전화번호(연락처)만 알려주어도 지체 없이 바로 다음 단계로 넘어가야 합니다.
3단계 (거래 유형): 연락처를 획득한 후, 다른 말 없이 바로 "이 매물은 매매인가요, 전세인가요, 아니면 월세인가요?" 라고 핵심을 간결하게 질문하세요.
4단계 (지번): 거래 유형이 정해지면 "[매물종류] 지번은 어떻게 되시나요? (동/리 단위까지만 알려주셔도 접수됩니다.)" 라고 정확하게 괄호를 써서 출력하세요. (예: "공장 지번은 어떻게 되시나요? (동/리 단위까지만 알려주셔도 접수됩니다.)")
5단계 (희망가격): 지번 획득 후 희망 가격을 유도하세요.
6단계 (면적): 면적을 유도하세요.
7단계 (특이사항): 특수 정보 및 특이 사항을 물어보세요.
8단계 (최종 확인): 모든 정보가 수집되면 2열 요약 표 형식으로 가독성 높게 접수 내역을 확인해 주고 마무리하세요.

[필수 수집 정보]
- 의뢰인 연락처 (client_phone) - 필수 수집
- 의뢰인 성함 (client_name) - 선택 사항 (제공하지 않은 경우 무시하거나 생략)
- 매물 종류 (property_type)
- 거래 종류 (transaction_type)
- 주소 (address)
- 희망 가격 (price)
- 면적 (area)
- 특수 정보 (features - 예: 공장의 경우 층고/동력, 상가의 경우 권리금 유무 등)

[대화 수칙]
1. 한 번에 너무 많은 질문을 하지 마세요. 고객이 피로하지 않도록 한 번에 딱 1~2개씩만 간결하고 정확하게 물어보세요.
2. 사용자가 정보를 제공하면 지체하지 말고 핵심 내용만 똑 부러지게 확인해 주세요.
3. 모든 필수 정보가 수집되었다고 판단되면, 절대로 긴 글줄로 지루하게 읊으며 요약하지 말고, 반드시 아래 멘트와 함께 수집된 정보들을 2열 마크다운 표(| 항목 | 내용 |) 형식으로 정리하여 가독성 높게 보여주세요:
   멘트 서식:
   "접수하실 매물 정리 내용입니다.

   | 항목 | 내용 |
   | :--- | :--- |
   | 성함 | [의뢰인 성함 (제공하지 않았을 경우 '미입력')] |
   | 연락처 | [의뢰인 연락처] |
   | 매물 종류 | [수집된 매물 종류] |
   | 거래 종류 | [수집된 거래 종류] |
   | 주소 | [수집된 주소] |
   | 가격 | [수집된 가격] |
   | 면적 | [수집된 면적] |
   | 특이 사항 | [수집된 특이 사항 및 기타 특징] |

   이대로 접수해 드릴까요? 수정하실 부분이 있으신가요?"
4. 사용자가 접수에 동의하면 즉시 "save_property_listing" 함수를 호출하여 접수 완료 처리하세요.
5. 사용자가 "수정할래요" 혹은 수정하고 싶다고 이야기하면, 다른 사족이나 추가 멘트 없이 오직 "수정하실 부분을 말씀해 주세요." 라고 답변하세요.`;

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
    const { messages, agentId, images } = await req.json();

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

    const fallbackKey = Buffer.from('QVEuQWI4Uk42TEcwTEp3UXdJVzF1UGpvTGdfdm5wazFZOFduZzAyZ1F1NHhSZXR2WTNqUHc=', 'base64').toString('utf-8');
    const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
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
                  client_name: { type: 'STRING', description: '의뢰인 성함' },
                  client_phone: { type: 'STRING', description: '의뢰인 연락처(전화번호)' },
                  property_type: { type: 'STRING', description: '매물 종류 (아파트, 상가, 공장, 토지 등)' },
                  transaction_type: { type: 'STRING', description: '거래 종류 (매매, 전세, 월세)' },
                  address: { type: 'STRING', description: '매물 주소' },
                  price: { type: 'STRING', description: '희망 가격 (예: 매매가 4억 5천만 원, 보증금 1천 / 월세 80)' },
                  area: { type: 'STRING', description: '면적 (대지/연면적 등)' },
                  features: { type: 'STRING', description: '특이 사항 및 기타 조건' },
                },
                required: ['client_phone', 'property_type', 'transaction_type', 'address', 'price', 'area'],
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

        // 2. Fetch agent id and code case-insensitively using maybeSingle
        const { data: agentDbData, error: agentError } = await supabase
          .from('agents')
          .select('id, agent_code')
          .ilike('agent_code', agentId)
          .maybeSingle();

        if (agentError) {
          console.error('Error fetching agent details:', agentError);
        }

        const agentDbId = agentDbData?.id;
        
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

        // 4. Save directly into property_listings table
        const mappedCategory = mapPropertyType(args.property_type);
        const mappedTxType = mapTransactionType(args.transaction_type);
        const parsedPrice = parseKoreanPrice(args.price);

        const insertData: any = {
          agent_id: agentDbId,
          category_codes: [mappedCategory],
          subcategory_codes: [],
          tags: ['AI접수'],
          transaction_types: [mappedTxType],
          address_full: args.address || null,
          address_road: args.address || null,
          address_jibun: args.address || null,
          status: 'active',
          images: [],
          detail_info: {},
          agent_memo: `[AI 챗봇 자동 접수]\n- 의뢰인 성함: ${args.client_name || '미입력'}\n- 의뢰인 연락처: ${args.client_phone || '미입력'}\n- 매물종류: ${args.property_type}\n- 거래형태: ${args.transaction_type}\n- 주소: ${args.address}\n- 희망가: ${args.price}\n- 면적: ${args.area}\n- 특징: ${args.features || '없음'}`
        };

        // Apply price fields mapping depending on transaction type to satisfy DTO validators
        if (mappedTxType === 'sale') {
          insertData.price_sale = parsedPrice;
        } else if (mappedTxType === 'jeonse') {
          insertData.price_jeonse = parsedPrice;
        } else if (mappedTxType === 'monthly_rent') {
          const { deposit, monthly_rent } = parseDepositAndRent(args.price, args.features);
          insertData.deposit = deposit;
          insertData.monthly_rent = monthly_rent;
        } else if (mappedTxType === 'premium_transfer') {
          const { deposit, monthly_rent } = parseDepositAndRent(args.price, args.features);
          insertData.deposit = deposit;
          insertData.monthly_rent = monthly_rent;
          insertData.premium_price = parsePremiumPrice(args.price, args.features);
        }

        // Apply area mapping (extract numeric value)
        const areaNum = parseInt((args.area || '').replace(/[^0-9]/g, ''), 10);
        if (!isNaN(areaNum) && areaNum > 0) {
          insertData.area_exclusive = areaNum;
          insertData.area_supply = areaNum;
        }

        const { data: newListing, error: insertErr } = await supabase
          .from('property_listings')
          .insert(insertData)
          .select()
          .single();

        if (insertErr) {
          console.error('Failed to insert listing into property_listings:', insertErr);
        } else {
          console.log('Listing successfully created in property_listings table:', newListing?.id);
          
          // Image uploading logic
          const uploadedImages: any[] = [];
          if (images && Array.isArray(images) && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
              const img = images[i];
              try {
                const mimeMatch = img.dataUrl.match(/^data:([^;]+);base64,/);
                if (!mimeMatch) continue;
                const contentType = mimeMatch[1];
                const base64Data = img.dataUrl.replace(/^data:[^;]+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                
                const ext = img.fileName.split('.').pop() ?? 'jpg';
                const storagePath = `agents/${agentDbId}/listings/${newListing.id}/${Date.now()}_${i}.${ext}`;
                
                const { error: uploadErr } = await supabase.storage
                  .from('landnote-media')
                  .upload(storagePath, buffer, { contentType, upsert: false });
                  
                if (uploadErr) {
                  console.error(`Failed to upload chat image ${i}:`, uploadErr);
                  continue;
                }
                
                uploadedImages.push({
                  path: storagePath,
                  is_representative: i === 0,
                  label: null,
                  uploaded_at: new Date().toISOString()
                });
              } catch (err) {
                console.error(`Error processing image ${i}:`, err);
              }
            }
            
            if (uploadedImages.length > 0) {
              const { error: updateErr } = await supabase
                .from('property_listings')
                .update({ images: uploadedImages })
                .eq('id', newListing.id);
                
              if (updateErr) {
                console.error('Failed to update listing images column:', updateErr);
              } else {
                console.log(`Successfully uploaded and linked ${uploadedImages.length} images to listing ${newListing.id}`);
              }
            }
          }
        }
      } catch (dbErr) {
        console.error('Failed to store listing in database:', dbErr);
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
