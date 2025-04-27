import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video, VideoDocument } from '../schemas/video.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideoService {
  constructor(@InjectModel(Video.name) private model: Model<VideoDocument>) {}

  async create(
    metadataCID: string,
    royaltyBps: number,
  ): Promise<VideoDocument> {
    const video = new this.model({
      videoId: uuidv4(),
      metadataCID,
      royaltyBps,
    });
    return video.save();
  }

  async findAll(): Promise<VideoDocument[]> {
    return this.model.find().exec();
  }

  async findById(videoId: string): Promise<VideoDocument> {
    const vid = await this.model.findOne({ videoId });
    if (!vid) throw new NotFoundException('Video not found');
    return vid;
  }

  async addProof(
    videoId: string,
    proofCID: string,
    revenue: number,
    matchedSeconds: number,
  ): Promise<VideoDocument> {
    const vid = await this.findById(videoId);
    vid.proofs.push({
      proofCID,
      revenue,
      matchedSeconds,
      timestamp: new Date(),
    });
    return vid.save();
  }
}
