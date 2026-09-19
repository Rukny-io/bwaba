import { readFileSync } from 'fs';
import { getEnvFilePaths } from '../core/config/env-paths';

/** Load repo `.env.dev` / `.env` for CLI scripts (same paths as Nest `ConfigModule`). */
export function loadScriptEnv(): void {
  for (const filePath of getEnvFilePaths()) {
    applyEnvFile(filePath);
  }
}

function applyEnvFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
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
