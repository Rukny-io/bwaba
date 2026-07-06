import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * E2E seed DB — mirrors docker-compose.rukny-dev.yml API (local Postgres on :5433).
 * Override with E2E_DATABASE_URL (CI / native API on Neon).
 */
function resolveE2eDatabaseUrl(): string | undefined {
  const explicit = process.env.E2E_DATABASE_URL?.trim();
  if (explicit) return explicit;

  if (process.env.E2E_USE_NEON === 'true' || process.env.E2E_USE_NEON === '1') {
    return process.env.DATABASE_URL;
  }

  if (process.env.DB_PASSWORD) {
    const user = process.env.DB_USER || 'rukny_admin';
    const db = process.env.DB_NAME || 'rukny_io';
    return `postgresql://${user}:${process.env.DB_PASSWORD}@127.0.0.1:5433/${db}`;
  }

  return process.env.DATABASE_URL;
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export default async function globalSetup() {
  const repoRoot = path.join(__dirname, '../../..');
  loadEnvFile(path.join(repoRoot, '.env.dev'));
  loadEnvFile(path.join(repoRoot, '.env'));
  loadEnvFile(path.join(__dirname, '../.env.local'));

  const e2eDatabaseUrl = resolveE2eDatabaseUrl();
  if (e2eDatabaseUrl) {
    process.env.DATABASE_URL = e2eDatabaseUrl;
  }

  if (!process.env.DATABASE_URL) {
    console.warn(
      '[e2e] DATABASE_URL not set — skipping seed. Run with .env.dev or create e2e/.fixtures.json manually.',
    );
    return;
  }

  const apiDir = path.join(__dirname, '../../api');
  const fixturesPath = path.join(__dirname, '.fixtures.json');

  try {
    execSync('npm run e2e:seed', {
      cwd: apiDir,
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (error) {
    if (existsSync(fixturesPath)) {
      console.warn(
        '[e2e] Seed failed but e2e/.fixtures.json exists — continuing with existing fixtures.',
      );
      console.warn(error);
      return;
    }
    throw error;
  }
}
