import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

test('documentation files do not contain literal admin key', () => {
  const literalKey = '19/BM/ANM/617/2204';
  const docsToCheck = [
    path.join(process.cwd(), 'README.md'),
    path.join(process.cwd(), 'DEPLOYMENT_SETUP.md'),
  ];

  for (const docPath of docsToCheck) {
    const content = fs.readFileSync(docPath, 'utf-8');
    assert.strictEqual(
      content.includes(literalKey),
      false,
      `${path.basename(docPath)} must not contain literal admin key ${literalKey}`
    );
  }
});

test('documentation uses placeholder for admin key', () => {
  const placeholder = '<YOUR_ADMIN_KEY>';
  const docsToCheck = [
    path.join(process.cwd(), 'README.md'),
    path.join(process.cwd(), 'DEPLOYMENT_SETUP.md'),
  ];

  for (const docPath of docsToCheck) {
    const content = fs.readFileSync(docPath, 'utf-8');
    assert.strictEqual(
      content.includes(placeholder),
      true,
      `${path.basename(docPath)} must use placeholder ${placeholder}`
    );
  }
});

test('pre-commit hook exists and contains security check', () => {
  const hookPath = path.join(process.cwd(), '.husky', 'pre-commit');
  assert.strictEqual(fs.existsSync(hookPath), true, 'pre-commit hook must exist');

  const hookContent = fs.readFileSync(hookPath, 'utf-8');
  assert.strictEqual(
    hookContent.includes('ADMIN_UPLOAD_KEY'),
    true,
    'pre-commit hook must check for ADMIN_KEY values'
  );
  assert.strictEqual(
    hookContent.includes('BLOCKED'),
    true,
    'pre-commit hook must block literal keys'
  );
});
