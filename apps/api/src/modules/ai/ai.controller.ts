import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract')
  async extract(@Body() body: { imageBase64: string }) {
    console.log('--- AI EXTRACT REQUEST RECEIVED ---');
    console.log('Base64 length:', body?.imageBase64?.length);
    if (!body?.imageBase64) {
      console.log('Body does not have imageBase64');
      throw new BadRequestException('imageBase64 is required');
    }
    console.log('Calling AiService.extractDataFromImage...');
    const result = await this.aiService.extractDataFromImage(body.imageBase64);
    console.log('AiService returned successfully.');
    return result;
  }
}
