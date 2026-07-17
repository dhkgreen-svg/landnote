import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseInterceptors, UploadedFile,
  NotFoundException, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient } from '@supabase/supabase-js';
import { InquiriesService } from './inquiries.service';
import { StorageService } from '../storage/storage.service';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';

@UseGuards(SubscriptionGuard)
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  async list(@CurrentAgent() agent: any, @Query() query: any) {
    return this.inquiriesService.list(agent.id, query);
  }

  @Post()
  async createByAgent(@CurrentAgent() agent: any, @Body() dto: CreateInquiryDto) {
    return this.inquiriesService.createByAgent(agent, dto);
  }

  @Get(':id')
  async detail(@CurrentAgent() agent: any, @Param('id') id: string) {
    return this.inquiriesService.detail(agent.id, id);
  }

  @Patch(':id')
  async update(@CurrentAgent() agent: any, @Param('id') id: string, @Body() dto: UpdateInquiryDto) {
    return this.inquiriesService.update(agent.id, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentAgent() agent: any, @Param('id') id: string) {
    return this.inquiriesService.remove(agent.id, id);
  }
}

@Public()
@Controller('public')
export class PublicInquiriesController {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  constructor(
    private readonly inquiriesService: InquiriesService,
    private readonly storageService: StorageService,
  ) {}

  @Post('otp/send')
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.inquiriesService.sendOtp(dto.phone);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.inquiriesService.verifyOtp(dto.phone, dto.code);
  }

  @Post('inquiries/:agentCode')
  async createPublic(
    @Param('agentCode') agentCode: string,
    @Body() dto: CreateInquiryDto,
  ) {
    return this.inquiriesService.createPublic(agentCode, dto);
  }

  @Post('inquiries/:agentCode/images/:inquiryId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('agentCode') agentCode: string,
    @Param('inquiryId') inquiryId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { data: agent } = await this.supabase
      .from('agents')
      .select('id')
      .eq('agent_code', agentCode)
      .single();

    if (!agent) {
      throw new NotFoundException('중개사를 찾을 수 없습니다');
    }

    return this.storageService.uploadInquiryImage(agent.id, inquiryId, file);
  }
}
