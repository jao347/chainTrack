import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoModule } from './video/video.module';
import { OracleModule } from './oracle/oracle.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    VideoModule,
    OracleModule,
  ],
})
export class AppModule {}
