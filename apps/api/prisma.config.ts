import dotenv from 'dotenv';
import path from 'path';
import { defineConfig, env } from 'prisma/config';

const apiRoot = __dirname;

for (const envFile of [
  path.join(apiRoot, '.env'),
  path.join(apiRoot, '..', '..', '.env.dev'),
  path.join(apiRoot, '..', '..', '.env'),
]) {
  dotenv.config({ path: envFile, override: false });
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
