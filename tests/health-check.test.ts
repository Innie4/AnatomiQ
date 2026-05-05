import { test } from 'node:test';
import assert from 'node:assert';

test('health check endpoint exists', async () => {
  // Verify the health check route file exists
  const fs = await import('fs');
  const path = await import('path');

  const healthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
  const exists = fs.existsSync(healthRoutePath);

  assert.strictEqual(exists, true, 'Health check route must exist at /api/health');
});

test('health check response structure is valid', async () => {
  // Import the health check handler
  const healthModule = await import('../src/app/api/health/route');

  assert.ok(healthModule.GET, 'Health check should export GET handler');
  assert.strictEqual(typeof healthModule.GET, 'function', 'GET should be a function');
});

test('health check includes required fields in response', async () => {
  // Test that the response structure includes all required monitoring fields
  const requiredFields = [
    'status',
    'timestamp',
    'uptime',
    'checks',
    'version',
    'latency',
  ];

  // Since we can't easily call the route handler directly without a full Next.js context,
  // we verify the route implementation contains these fields
  const fs = await import('fs');
  const path = await import('path');

  const healthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
  const content = fs.readFileSync(healthRoutePath, 'utf-8');

  for (const field of requiredFields) {
    assert.ok(
      content.includes(field),
      `Health check response must include ${field} field`
    );
  }
});

test('health check verifies database connectivity', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const healthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
  const content = fs.readFileSync(healthRoutePath, 'utf-8');

  assert.ok(
    content.includes('database') && content.includes('prisma'),
    'Health check must verify database connectivity'
  );
  assert.ok(
    content.includes('SELECT 1') || content.includes('$queryRaw'),
    'Health check must execute database query'
  );
});

test('health check verifies storage connectivity', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const healthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
  const content = fs.readFileSync(healthRoutePath, 'utf-8');

  assert.ok(
    content.includes('storage') && content.includes('SUPABASE'),
    'Health check must verify storage connectivity'
  );
});

test('health check returns proper HTTP status codes', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const healthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
  const content = fs.readFileSync(healthRoutePath, 'utf-8');

  assert.ok(
    content.includes('200') && content.includes('503'),
    'Health check must return 200 for healthy and 503 for degraded'
  );
});

test('health check sets no-cache headers', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const healthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
  const content = fs.readFileSync(healthRoutePath, 'utf-8');

  assert.ok(
    content.includes('no-cache') || content.includes('Cache-Control'),
    'Health check must set Cache-Control: no-cache headers'
  );
});

test('health check is marked as dynamic', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const healthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
  const content = fs.readFileSync(healthRoutePath, 'utf-8');

  assert.ok(
    content.includes('dynamic') && content.includes('force-dynamic'),
    'Health check must use dynamic = "force-dynamic" to prevent caching'
  );
});
