import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { StorageModule } from '../storage/storage.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [StorageModule, MatchingModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
