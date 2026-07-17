import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract')
  async extract(@Body() body: { imageBase64: string }) {
    if (!body.imageBase64) {
      throw new BadRequestException('imageBase64 is required');
    }
    return this.aiService.extractDataFromImage(body.imageBase64);
  }
}
