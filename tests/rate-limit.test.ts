import { test } from 'node:test';
import assert from 'node:assert';
import { rateLimit, getClientIP } from '../src/lib/rate-limit';

test('rate limiting gracefully degrades when Redis is not configured', async () => {
  // Without Upstash credentials, rate limiting should allow all requests
  const result = await rateLimit('test-ip-123', 'public');

  assert.strictEqual(result.success, true, 'Should allow requests when Redis is not configured');
  assert.strictEqual(typeof result.limit, 'number', 'Should return numeric limit');
  assert.strictEqual(typeof result.remaining, 'number', 'Should return numeric remaining');
  assert.strictEqual(typeof result.reset, 'number', 'Should return numeric reset timestamp');
});

test('getClientIP extracts IP from x-forwarded-for', () => {
  const headers = new Headers();
  headers.set('x-forwarded-for', '203.0.113.1, 198.51.100.1');

  const ip = getClientIP(headers);

  assert.strictEqual(ip, '203.0.113.1', 'Should extract first IP from x-forwarded-for');
});

test('getClientIP extracts IP from x-real-ip', () => {
  const headers = new Headers();
  headers.set('x-real-ip', '203.0.113.42');

  const ip = getClientIP(headers);

  assert.strictEqual(ip, '203.0.113.42', 'Should extract IP from x-real-ip');
});

test('getClientIP prefers x-forwarded-for over x-real-ip', () => {
  const headers = new Headers();
  headers.set('x-forwarded-for', '203.0.113.1');
  headers.set('x-real-ip', '203.0.113.99');

  const ip = getClientIP(headers);

  assert.strictEqual(ip, '203.0.113.1', 'Should prefer x-forwarded-for when both are present');
});

test('getClientIP falls back to localhost when no headers present', () => {
  const headers = new Headers();
  const ip = getClientIP(headers);

  assert.strictEqual(ip, '127.0.0.1', 'Should fallback to 127.0.0.1 for development');
});

test('rate limit types are properly defined', async () => {
  const types: Array<'auth' | 'questionGeneration' | 'public'> = [
    'auth',
    'questionGeneration',
    'public',
  ];

  for (const type of types) {
    const result = await rateLimit(`test-${type}`, type);

    assert.strictEqual(result.success, true, `Should handle ${type} rate limit type`);
    assert.ok(result.limit > 0, `${type} should have positive limit`);
  }
});

test('rate limit returns proper structure', async () => {
  const result = await rateLimit('test-structure', 'public');

  assert.ok('success' in result, 'Result should have success property');
  assert.ok('limit' in result, 'Result should have limit property');
  assert.ok('remaining' in result, 'Result should have remaining property');
  assert.ok('reset' in result, 'Result should have reset property');

  assert.strictEqual(typeof result.success, 'boolean', 'success should be boolean');
  assert.strictEqual(typeof result.limit, 'number', 'limit should be number');
  assert.strictEqual(typeof result.remaining, 'number', 'remaining should be number');
  assert.strictEqual(typeof result.reset, 'number', 'reset should be number');
});
