import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, equalsIndex).trim();
    if (!key) {
      continue;
    }

    let value = trimmedLine.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

for (const envFile of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(__dirname, '..', '.env'),
]) {
  loadEnvFile(envFile);
}

async function bootstrap() {
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule);
  
  // Enforce Helmet for Security Headers (CSP, XSS, etc.)
  app.use(helmet());

  // Set global prefix as specified in API Design Principles
  app.setGlobalPrefix('api/v1');

  // Swagger OpenAPI Setup (For Frontend Team)
  const config = new DocumentBuilder()
    .setTitle('Internship Management System API')
    .setDescription('Official API Documentation for the MInT IMS Frontend Team')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Restrict CORS securely (INSA Compliance); allow local dev origins
  const corsOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enforce DTO validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Apply standard JSON envelope for all errors
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 5000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api/v1`);
}
bootstrap();
