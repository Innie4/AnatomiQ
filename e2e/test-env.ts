import fs from 'fs';
import path from 'path';

export function getEnvValue(name: string) {
  if (process.env[name]) {
    return process.env[name];
  }

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return undefined;
  }

  const match = fs.readFileSync(envPath, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^["']|["']$/g, '');
}
