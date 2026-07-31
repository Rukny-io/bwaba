import dotenv from 'dotenv';
import path from 'path';
import { defineConfig, env } from 'prisma/config';

const baseDir = __dirname;
const apiRoot = path.join(baseDir, '..');

// Prefer runtime env (Docker `environment:`) over files; load common env paths for local CLI.
for (const envFile of [
  path.join(apiRoot, '.env'),
  path.join(apiRoot, '..', '..', '.env.dev'),
  path.join(apiRoot, '..', '..', '.env'),
]) {
  dotenv.config({ path: envFile, override: false });
}

export default defineConfig({
  schema: path.join(baseDir, 'schema.prisma'),
  migrations: {
    path: path.join(baseDir, 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
  },
});
