import { Module } from '@nestjs/common';
import { InquiriesController, PublicInquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { StorageModule } from '../storage/storage.module';
import { EmailModule } from '../email/email.module';
import { MatchingModule } from '../matching/matching.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [StorageModule, EmailModule, MatchingModule, NotificationsModule],
  controllers: [InquiriesController, PublicInquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
