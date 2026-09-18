import { existsSync } from 'node:fs';

/**
 * Loads a local `.env` for development. Deployed environments inject variables
 * from the hosting platform's secrets manager (security-and-audit.md §9), so a
 * missing file is not an error. Already-set variables are never overwritten.
 */
export function loadLocalEnvFile(path = '.env'): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
