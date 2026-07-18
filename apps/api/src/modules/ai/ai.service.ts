import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Error handled in method
    });
  }

  async extractDataFromImage(imageBase64: string) {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException('OpenAI API Key가 서버에 설정되지 않았습니다.');
    }

    try {
      const dataUri = imageBase64.startsWith('data:image') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

      console.log('dataUri prefix:', dataUri.substring(0, 50));

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts real estate information from an image (business card, handwritten note, or flyer). 
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
  "agent_memo": "Any other additional information found on the image." // Extra details
}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract real estate information from this image.' },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const jsonStr = response.choices[0].message.content;
      return JSON.parse(jsonStr || '{}');
    } catch (error) {
      console.error('OpenAI Error:', error);
      throw new InternalServerErrorException('AI 이미지 분석 중 오류가 발생했습니다.');
    }
  }
}
