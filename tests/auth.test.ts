import { test } from 'node:test';
import assert from 'node:assert';
import { signToken, verifyToken, hashPassword, comparePassword } from '../src/lib/auth';

test('JWT token signing and verification', () => {
  const payload = {
    userId: 'test-123',
    email: 'test@example.com',
    fullName: 'Test User',
    department: 'Human Anatomy',
  };

  const token = signToken(payload);
  assert.strictEqual(typeof token, 'string', 'Token should be a string');
  assert.strictEqual(token.length > 0, true, 'Token should not be empty');

  const decoded = verifyToken(token);
  assert.notStrictEqual(decoded, null, 'Token should be verifiable');
  assert.strictEqual(decoded?.userId, payload.userId, 'User ID should match');
  assert.strictEqual(decoded?.email, payload.email, 'Email should match');
  assert.strictEqual(decoded?.fullName, payload.fullName, 'Full name should match');
  assert.strictEqual(decoded?.department, payload.department, 'Department should match');
});

test('JWT token verification rejects invalid tokens', () => {
  const invalidToken = 'invalid.token.here';
  const decoded = verifyToken(invalidToken);
  assert.strictEqual(decoded, null, 'Invalid token should return null');
});

test('JWT token verification rejects tampered tokens', () => {
  const payload = {
    userId: 'test-123',
    email: 'test@example.com',
    fullName: 'Test User',
    department: 'Human Anatomy',
  };

  const token = signToken(payload);
  // Tamper with the token by changing a character
  const tamperedToken = token.slice(0, -5) + 'xxxxx';
  const decoded = verifyToken(tamperedToken);
  assert.strictEqual(decoded, null, 'Tampered token should be rejected');
});

test('password hashing and comparison', async () => {
  const password = 'SecurePassword123!';
  const hash = await hashPassword(password);

  assert.strictEqual(typeof hash, 'string', 'Hash should be a string');
  assert.strictEqual(hash.length > 0, true, 'Hash should not be empty');
  assert.notStrictEqual(hash, password, 'Hash should not equal plaintext password');

  const isValid = await comparePassword(password, hash);
  assert.strictEqual(isValid, true, 'Correct password should validate');

  const isInvalid = await comparePassword('WrongPassword', hash);
  assert.strictEqual(isInvalid, false, 'Incorrect password should fail');
});

test('password hashes are unique for same password', async () => {
  const password = 'SamePassword123';
  const hash1 = await hashPassword(password);
  const hash2 = await hashPassword(password);

  assert.notStrictEqual(hash1, hash2, 'Hashes should differ due to salt');

  const valid1 = await comparePassword(password, hash1);
  const valid2 = await comparePassword(password, hash2);
  assert.strictEqual(valid1, true, 'First hash should validate');
  assert.strictEqual(valid2, true, 'Second hash should validate');
});
