import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import fastifyCookie from 'fastify-cookie';
import fastifyMultipart from 'fastify-multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );
  // app.setGlobalPrefix('v1');
  app.enableCors({
    origin: true,
    credentials: true,
    maxAge: 86400,
  });
  app.register(fastifyCookie);
  app.register(fastifyMultipart);

  const options = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription('The awesome todo API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('doc', app, document);

  await app.listen(process.env.PORT!, '0.0.0.0');
}
bootstrap();
