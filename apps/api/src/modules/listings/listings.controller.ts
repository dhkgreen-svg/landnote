import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body,
  UseInterceptors, UploadedFile, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ListingsService } from './listings.service';
import { StorageService } from '../storage/storage.service';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { PLAN_LIMITS } from '@landnote/shared';

@UseGuards(SubscriptionGuard)
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  async list(@CurrentAgent() agent: any, @Query() query: any) {
    return this.listingsService.list(agent.id, query);
  }

  @Get(':id')
  async detail(@CurrentAgent() agent: any, @Param('id') id: string) {
    return this.listingsService.detail(agent.id, id);
  }

  @Post()
  async create(@CurrentAgent() agent: any, @Body() body: CreateListingDto) {
    return this.listingsService.create(agent, body);
  }

  @Patch(':id')
  async update(@CurrentAgent() agent: any, @Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(agent.id, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentAgent() agent: any, @Param('id') id: string) {
    return this.listingsService.remove(agent.id, id);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentAgent() agent: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const plan = agent.subscription_plan as 'minimal' | 'standard' | 'pro';
    const maxImages = PLAN_LIMITS[plan].max_images_per_listing;
    const currentImages = await this.listingsService.getImages(agent.id, id);

    return this.storageService.uploadListingImage(
      agent.id,
      id,
      file,
      currentImages,
      maxImages,
    );
  }

  @Delete(':id/images')
  async deleteImage(
    @CurrentAgent() agent: any,
    @Param('id') id: string,
    @Body() body: { imagePath: string },
  ) {
    await this.storageService.deleteListingImage(agent.id, id, body.imagePath);
    return { deleted: true };
  }
}
