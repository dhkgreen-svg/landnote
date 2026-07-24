import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';

@UseGuards(SubscriptionGuard)
@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  async list(@CurrentAgent() agent: any) {
    return this.matchingService.getInquiriesWithMatches(agent.id);
  }

  @Get('listings')
  async listingsWithMatches(@CurrentAgent() agent: any) {
    return this.matchingService.getListingsWithMatches(agent.id);
  }

  @Get('listings/:listingId')
  async matchesByListing(
    @CurrentAgent() agent: any,
    @Param('listingId') listingId: string,
  ) {
    return this.matchingService.getMatchesByListing(agent.id, listingId);
  }

  @Get(':inquiryId')
  async matchesByInquiry(
    @CurrentAgent() agent: any,
    @Param('inquiryId') inquiryId: string,
  ) {
    return this.matchingService.getMatchesByInquiry(agent.id, inquiryId);
  }

  @Post('run/:inquiryId')
  async run(
    @CurrentAgent() agent: any,
    @Param('inquiryId') inquiryId: string,
  ) {
    return this.matchingService.runMatching(agent.id, inquiryId);
  }

  @Post('run/listings/:listingId')
  async runReverse(
    @CurrentAgent() agent: any,
    @Param('listingId') listingId: string,
  ) {
    return this.matchingService.runReverseMatching(agent.id, listingId);
  }

  @Patch(':matchId')
  async update(
    @CurrentAgent() agent: any,
    @Param('matchId') matchId: string,
    @Body() body: { is_shown?: boolean; is_liked?: boolean; is_contracted?: boolean },
  ) {
    return this.matchingService.updateMatch(agent.id, matchId, body);
  }
}
