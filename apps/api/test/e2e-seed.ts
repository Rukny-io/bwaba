/**
 * Seeds a published form for Playwright UI tests.
 * Run: npm run e2e:seed (from apps/api, requires DATABASE_URL)
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  cleanupE2eUser,
  createE2eAuthContext,
} from './helpers/e2e-auth.helper';
import { seedPublishedForm } from './helpers/e2e-forms.fixture';

const FIXTURES_PATH = join(__dirname, '../../forms/e2e/.fixtures.json');
const MARKER_PATH = join(__dirname, '../../forms/e2e/.seed-user-id');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required for e2e seed');
    process.exit(1);
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    if (existsSync(MARKER_PATH)) {
      const prevUserId = readFileSync(MARKER_PATH, 'utf8').trim();
      if (prevUserId) {
        await cleanupE2eUser(prisma, prevUserId);
      }
    }

    const auth = await createE2eAuthContext(prisma);
    const form = await seedPublishedForm(prisma, auth.userId);

    const fixturesDir = join(__dirname, '../../forms/e2e');
    if (!existsSync(fixturesDir)) {
      mkdirSync(fixturesDir, { recursive: true });
    }

    writeFileSync(
      FIXTURES_PATH,
      JSON.stringify(
        {
          slug: form.slug,
          fieldId: form.fieldId,
          formId: form.formId,
          title: form.title,
          userId: auth.userId,
          accessToken: auth.accessToken,
          accessCookieName: auth.accessCookieName,
        },
        null,
        2,
      ),
    );
    writeFileSync(MARKER_PATH, auth.userId);

    console.log(`E2E fixtures written: slug=${form.slug}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
