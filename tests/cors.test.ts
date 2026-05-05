import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

test('next.config restricts image remote patterns to Supabase only', () => {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf-8');

  // Should NOT have wildcard hostname
  assert.strictEqual(
    configContent.includes('hostname: "**"'),
    false,
    'next.config must not use wildcard hostname for images'
  );

  // Should have Supabase-specific patterns
  assert.strictEqual(
    configContent.includes('supabase.co'),
    true,
    'next.config must restrict image hostnames to Supabase'
  );

  // Verify remotePatterns structure exists
  assert.strictEqual(
    /remotePatterns\s*:\s*\[/.test(configContent),
    true,
    'next.config must have remotePatterns array'
  );
});

test('no wildcard CORS patterns in codebase', () => {
  // Check API route handlers don't set permissive CORS
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

  function checkFilesRecursive(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        checkFilesRecursive(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Check for permissive CORS headers
        if (content.includes('Access-Control-Allow-Origin')) {
          assert.strictEqual(
            content.includes('Access-Control-Allow-Origin: *'),
            false,
            `${fullPath} must not use wildcard CORS (Access-Control-Allow-Origin: *)`
          );
        }
      }
    }
  }

  if (fs.existsSync(apiDir)) {
    checkFilesRecursive(apiDir);
  }

  assert.ok(true, 'No wildcard CORS patterns found in API routes');
});

test('Supabase storage URL is the only allowed remote image source', () => {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf-8');

  // Extract remotePatterns section
  const remotePatternsMatch = configContent.match(/remotePatterns\s*:\s*\[([\s\S]*?)\]/);

  if (remotePatternsMatch) {
    const patterns = remotePatternsMatch[1];

    // Count how many different domains are allowed
    const hostnameMatches = patterns.match(/hostname\s*:\s*["']([^"']+)["']/g);

    if (hostnameMatches) {
      for (const hostnameMatch of hostnameMatches) {
        const hostname = hostnameMatch.match(/["']([^"']+)["']/)?.[1];

        assert.ok(
          hostname?.includes('supabase.co'),
          `All image hostnames must be Supabase domains, found: ${hostname}`
        );
      }
    }
  }

  assert.ok(true, 'Image remote patterns restricted to Supabase');
});
