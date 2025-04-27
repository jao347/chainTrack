import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { OracleService } from './oracle.service';

@Controller('oracle')
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  @Post('report')
  async report(
    @Body('videoId') videoId: string,
    @Body('proofCID') proofCID: string,
    @Body('revenue') revenue: number,
    @Body('matchedSeconds') matchedSeconds: number,
  ) {
    if (!videoId || !proofCID) {
      throw new BadRequestException('Missing parameters');
    }
    const txHash = await this.oracleService.reportUsage(
      videoId,
      proofCID,
      revenue,
      matchedSeconds,
    );
    return { txHash };
  }
}
