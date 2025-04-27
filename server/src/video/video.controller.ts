import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { VideoService } from './video.service';
import { Video } from '../schemas/video.schema';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  async create(
    @Body('metadataCID') metadataCID: string,
    @Body('royaltyBps') royaltyBps: number,
  ): Promise<Video> {
    return this.videoService.create(metadataCID, royaltyBps);
  }

  @Get()
  async findAll(): Promise<Video[]> {
    return this.videoService.findAll();
  }

  @Get(':videoId')
  async findById(@Param('videoId') videoId: string): Promise<Video> {
    return this.videoService.findById(videoId);
  }
}
