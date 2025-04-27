import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoDocument = Video & Document;

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true, unique: true })
  videoId: string;

  @Prop({ required: true })
  metadataCID: string;

  @Prop({ required: true })
  royaltyBps: number; // basis points, e.g. 2000 = 20%

  @Prop({ default: [] })
  proofs: {
    proofCID: string;
    revenue: number;
    matchedSeconds: number;
    timestamp: Date;
  }[];
}

export const VideoSchema = SchemaFactory.createForClass(Video);
