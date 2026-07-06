import { existsSync, readFileSync } from 'fs';
import path from 'path';

export interface E2eFixtures {
  slug: string;
  title: string;
  fieldId: string;
  formId: string;
  userId: string;
  accessToken: string;
  accessCookieName: string;
}

const FIXTURES_FILE = path.join(__dirname, '.fixtures.json');

export function loadE2eFixtures(): E2eFixtures | null {
  if (!existsSync(FIXTURES_FILE)) return null;
  return JSON.parse(readFileSync(FIXTURES_FILE, 'utf8')) as E2eFixtures;
}

export const E2E_SKIP_REASON =
  'No e2e/.fixtures.json — start API + DB then run: npm run test:e2e:seed (from apps/forms)';
