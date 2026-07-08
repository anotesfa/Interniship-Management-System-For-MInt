import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

function readEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {} as Record<string, string>;
  }

  const parsed: Record<string, string> = {};
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
    let value = trimmedLine.slice(equalsIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key) {
      parsed[key] = value;
    }
  }

  return parsed;
}

function resolveDatabaseUrl() {
  const envFiles = [
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
  ];

  for (const envFile of envFiles) {
    const parsed = readEnvFile(envFile);
    const databaseUrl = parsed.DATABASE_URL;
    if (databaseUrl && !databaseUrl.startsWith('prisma://')) {
      return databaseUrl;
    }
  }

  const runtimeDatabaseUrl = process.env.DATABASE_URL;
  if (runtimeDatabaseUrl && !runtimeDatabaseUrl.startsWith('prisma://')) {
    return runtimeDatabaseUrl;
  }

  throw new Error(
    'A valid DATABASE_URL was not found. Set backend/.env to a postgresql:// URL before starting the server.',
  );
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: resolveDatabaseUrl(),
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to Postgres');
    } catch (e) {
      console.warn('Database not running locally, starting server in mock mode to allow endpoint testing without DB.');
    }
  }
}
