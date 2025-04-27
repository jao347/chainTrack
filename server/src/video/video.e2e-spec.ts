import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import * as mongoose from 'mongoose';

describe('VideoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await app.close();
  });

  it('/videos (POST) → create video', () => {
    return request(app.getHttpServer())
      .post('/videos')
      .send({ metadataCID: 'QmTest', royaltyBps: 1000 })
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty('videoId');
        expect(res.body.metadataCID).toBe('QmTest');
        expect(res.body.royaltyBps).toBe(1000);
      });
  });

  it('/videos (GET) → array of videos', () => {
    return request(app.getHttpServer())
      .get('/videos')
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
