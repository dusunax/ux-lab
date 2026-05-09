import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  app.use(require('body-parser').json({ limit: '20mb' }));

  app.enableCors();
  app.setGlobalPrefix('api');

  const doc = new DocumentBuilder()
    .setTitle('OpenRouter Proxy')
    .setDescription('OpenRouter API 프록시 — 이미지/텍스트 모델 자동 폴백 지원')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));

  const port = process.env.PORT ? Number(process.env.PORT) : 3035;
  await app.listen(port);
  console.log(`[openrouter-proxy] http://localhost:${port}`);
  console.log(`[swagger]          http://localhost:${port}/docs`);
}

bootstrap();
