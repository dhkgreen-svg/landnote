import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `당신은 랜드노트의 '부동산 매물 자동 접수 AI 봇'입니다.
고객이 매물(아파트, 상가, 공장, 토지 등)을 내놓으려고 할 때 친절하게 응대하며 필요한 정보를 수집하세요.

[필수 수집 정보]
- 매물 종류 (예: 아파트, 상가, 공장, 토지 등)
- 거래 종류 (예: 매매, 전세, 월세)
- 주소 (대략적인 동/리 단위라도)
- 희망 가격 (매매가, 보증금, 월세 등)
- 면적 (대지면적, 전용면적 등)
- 특수 정보 (공장일 경우 층고, 동력 등 / 상가일 경우 권리금 유무 등)

[대화 수칙]
1. 한 번에 너무 많은 질문을 하지 마세요. 한 번에 1~2개씩만 물어보세요.
2. 친절하고 전문적인 톤을 유지하세요.
3. 사용자가 "아파트 전세 내놓을게" 라고 하면, 누락된 주소나 희망 전세금을 물어보세요.
4. 모든 필수 정보가 수집되었다고 판단되면, 요약된 내용을 보여주고 "접수를 완료할까요?" 라고 확인을 받으세요.
5. 사용자가 접수에 동의하면 챗봇의 역할을 종료하고 "[접수완료]" 라는 키워드를 마지막에 포함하여 답변하세요.`;

export async function POST(req: Request) {
  try {
    const { messages, agentId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
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

    // Add system instruction for Gemini 1.5
    const payload = {
      system_instruction: {
        parts: { text: SYSTEM_PROMPT }
      },
      contents: contents,
      tools: [{
        function_declarations: [{
          name: "save_property_listing",
          description: "고객으로부터 필수 매물 정보를 모두 수집했을 때, 이 함수를 호출하여 데이터베이스에 저장합니다.",
          parameters: {
            type: "OBJECT",
            properties: {
              property_type: { type: "STRING", description: "매물 종류 (예: 아파트, 공장, 상가, 토지 등)" },
              transaction_type: { type: "STRING", description: "거래 종류 (예: 매매, 전세, 월세)" },
              address: { type: "STRING", description: "주소 또는 대략적인 위치" },
              price: { type: "STRING", description: "희망 가격 (매매가, 보증금, 월세 등)" },
              area: { type: "STRING", description: "면적 (평수 또는 제곱미터)" },
              features: { type: "STRING", description: "추가 특징 (층고, 방 개수, 층수 등)" }
            },
            required: ["property_type", "transaction_type", "address", "price", "area"]
          }
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      throw new Error('Failed to generate response from Gemini');
    }

    const data = await response.json();
    
    // Check if Gemini returned a function call
    const candidateParts = data.candidates?.[0]?.content?.parts || [];
    const functionCallPart = candidateParts.find((p: any) => p.functionCall);
    
    if (functionCallPart) {
      const args = functionCallPart.functionCall.args;
      // In a real scenario, we would save to Supabase here
      console.log('Received save_property_listing function call:', args);
      
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
