import { Module } from '@nestjs/common';
import { VideoModule } from '../video/video.module';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controller';

@Module({
  imports: [VideoModule],
  providers: [OracleService],
  controllers: [OracleController],
})
export class OracleModule {}
