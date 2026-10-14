import fs from 'fs';
import path from 'path';
import { defineConfig } from 'prisma/config';

const apiRoot = __dirname;

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

for (const envFile of [
  path.join(apiRoot, '.env'),
  path.join(apiRoot, '..', '..', '.env.dev'),
  path.join(apiRoot, '..', '..', '.env'),
]) {
  loadEnvFile(envFile);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Dummy URL allows `prisma generate` during Docker builds (no .env mounted).
  // Runtime always overrides via process.env.DATABASE_URL / compose env.
  datasource: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://dummy:dummy@localhost:5432/dummy',
  },
});
