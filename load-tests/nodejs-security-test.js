const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test results
const results = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  vulnerabilities: [],
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000,
      ...options,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });

      res.on('error', (err) => {
        reject(err);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

function logTest(category, testName, passed, details = '') {
  results.totalTests++;
  if (passed) {
    results.passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    results.failed++;
    results.vulnerabilities.push({
      category,
      test: testName,
      details,
    });
    console.log(`  ✗ ${testName}${details ? ': ' + details : ''}`);
  }
}

async function testSQLInjection() {
  console.log('\n📝 Testing SQL Injection Protection...');

  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users--",
    "' OR 1=1--",
    "admin'--",
  ];

  for (const payload of payloads) {
    try {
      const res = await makeRequest(`${BASE_URL}/api/topics?q=${encodeURIComponent(payload)}`);
      const safe = res.statusCode !== 500 && !res.body.includes('SQL') && !res.body.includes('database error');
      logTest('SQL Injection', `Payload blocked: ${payload.substring(0, 20)}...`, safe, res.statusCode === 500 ? 'Server error exposed' : '');
    } catch (error) {
      logTest('SQL Injection', `Payload test: ${payload.substring(0, 20)}...`, false, error.message);
    }
  }
}

async function testXSS() {
  console.log('\n🔒 Testing XSS Protection...');

  const payloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
  ];

  for (const payload of payloads) {
    try {
      const res = await makeRequest(`${BASE_URL}/topics?q=${encodeURIComponent(payload)}`);
      const safe = !res.body.includes('<script>') && !res.body.includes('onerror=');
      logTest('XSS', `XSS payload sanitized: ${payload.substring(0, 20)}...`, safe);
    } catch (error) {
      logTest('XSS', `XSS test: ${payload.substring(0, 20)}...`, false, error.message);
    }
  }
}

async function testAuthenticationBypass() {
  console.log('\n🔐 Testing Authentication & Authorization...');

  const adminEndpoints = [
    '/api/admin-materials',
    '/api/admin-overview',
    '/api/upload-material',
  ];

  for (const endpoint of adminEndpoints) {
    try {
      const res = await makeRequest(`${BASE_URL}${endpoint}`);
      const protected = res.statusCode === 401 || res.statusCode === 403;
      logTest('Authentication', `Endpoint protected: ${endpoint}`, protected, `Got status ${res.statusCode}`);
    } catch (error) {
      logTest('Authentication', `Endpoint ${endpoint}`, false, error.message);
    }
  }

  // Test invalid admin keys
  const invalidKeys = ['invalid-key', '12345', '', '<script>alert("XSS")</script>'];

  for (const key of invalidKeys) {
    try {
      const res = await makeRequest(`${BASE_URL}/api/admin-materials`, {
        headers: { 'x-admin-upload-key': key },
      });
      const rejected = res.statusCode === 401 || res.statusCode === 403;
      logTest('Authentication', `Invalid key rejected: ${key.substring(0, 15)}...`, rejected, `Got status ${res.statusCode}`);
    } catch (error) {
      logTest('Authentication', `Invalid key test: ${key}`, false, error.message);
    }
  }
}

async function testInputValidation() {
  console.log('\n✅ Testing Input Validation...');

  // Test invalid JSON
  try {
    const res = await makeRequest(`${BASE_URL}/api/start-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{',
    });
    logTest('Input Validation', 'Invalid JSON rejected', res.statusCode === 400);
  } catch (error) {
    logTest('Input Validation', 'Invalid JSON handling', false, error.message);
  }

  // Test missing required fields
  try {
    const res = await makeRequest(`${BASE_URL}/api/start-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {},
    });
    logTest('Input Validation', 'Missing fields rejected', res.statusCode === 400);
  } catch (error) {
    logTest('Input Validation', 'Missing fields test', false, error.message);
  }

  // Test invalid data types
  try {
    const res = await makeRequest(`${BASE_URL}/api/start-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        topicSlug: true,
        type: 'INVALID',
        count: 'ten',
        durationMinutes: null,
      },
    });
    logTest('Input Validation', 'Invalid data types rejected', res.statusCode === 400);
  } catch (error) {
    logTest('Input Validation', 'Invalid data types test', false, error.message);
  }
}

async function testSecurityHeaders() {
  console.log('\n🛡️  Testing Security Headers...');

  try {
    const res = await makeRequest(`${BASE_URL}/`);

    // Check for CSP
    const hasCSP = res.headers['content-security-policy'] !== undefined;
    logTest('Security Headers', 'Content-Security-Policy header present', hasCSP);

    // Check for X-Frame-Options
    const hasFrameOptions = res.headers['x-frame-options'] !== undefined;
    logTest('Security Headers', 'X-Frame-Options header present', hasFrameOptions);

    // Check that sensitive headers are not exposed
    const noXPoweredBy = !res.headers['x-powered-by'];
    logTest('Security Headers', 'X-Powered-By header not exposed', noXPoweredBy);

    const noServer = !res.headers['server'] || !res.headers['server'].includes('Express');
    logTest('Security Headers', 'Server version not exposed', noServer);

    // Check for HSTS (if HTTPS)
    if (BASE_URL.startsWith('https')) {
      const hasHSTS = res.headers['strict-transport-security'] !== undefined;
      logTest('Security Headers', 'Strict-Transport-Security header present', hasHSTS);
    }
  } catch (error) {
    logTest('Security Headers', 'Security headers test', false, error.message);
  }
}

async function testRateLimiting() {
  console.log('\n⏱️  Testing Rate Limiting...');

  const requests = [];
  const rapidRequestCount = 100;

  try {
    for (let i = 0; i < rapidRequestCount; i++) {
      requests.push(makeRequest(`${BASE_URL}/api/health`).catch(() => ({ statusCode: 0 })));
    }

    const results = await Promise.all(requests);
    const rateLimited = results.some((r) => r.statusCode === 429);

    logTest('Rate Limiting', `Rate limiting active (${rapidRequestCount} rapid requests)`, rateLimited, rateLimited ? '' : 'No 429 responses detected');
  } catch (error) {
    logTest('Rate Limiting', 'Rate limiting test', false, error.message);
  }
}

async function testCORS() {
  console.log('\n🌐 Testing CORS Policy...');

  try {
    const res = await makeRequest(`${BASE_URL}/api/topics`, {
      headers: {
        'Origin': 'https://malicious-site.com',
      },
    });

    const allowedOrigin = res.headers['access-control-allow-origin'];
    const safe = !allowedOrigin || allowedOrigin !== '*';

    logTest('CORS', 'CORS policy restricts arbitrary origins', safe, allowedOrigin ? `Allowed origin: ${allowedOrigin}` : '');
  } catch (error) {
    logTest('CORS', 'CORS policy test', false, error.message);
  }
}

async function testErrorHandling() {
  console.log('\n⚠️  Testing Error Handling & Information Disclosure...');

  // Test 404 error
  try {
    const res = await makeRequest(`${BASE_URL}/nonexistent-endpoint-12345`);
    const noStackTrace = !res.body.includes('node_modules') && !res.body.includes('at ') && !res.body.includes('stack trace');
    logTest('Error Handling', '404 errors do not expose stack traces', noStackTrace);
  } catch (error) {
    logTest('Error Handling', '404 error test', false, error.message);
  }

  // Test API error
  try {
    const res = await makeRequest(`${BASE_URL}/api/start-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { invalid: 'data' },
    });

    const noInternalPaths = !res.body.includes('node_modules') && !res.body.includes('C:\\') && !res.body.includes('/home/');
    logTest('Error Handling', 'API errors do not expose internal paths', noInternalPaths);
  } catch (error) {
    logTest('Error Handling', 'API error test', false, error.message);
  }
}

async function testPathTraversal() {
  console.log('\n📁 Testing Path Traversal Protection...');

  const payloads = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\win.ini',
    '....//....//etc/passwd',
  ];

  for (const payload of payloads) {
    try {
      const res = await makeRequest(`${BASE_URL}/api/material-file/${encodeURIComponent(payload)}`);
      const blocked = res.statusCode !== 200 || (!res.body.includes('root:') && !res.body.includes('[extensions]'));
      logTest('Path Traversal', `Path traversal blocked: ${payload}`, blocked, `Status: ${res.statusCode}`);
    } catch (error) {
      logTest('Path Traversal', `Path traversal test: ${payload}`, false, error.message);
    }
  }
}

function printSummary() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('SECURITY TEST SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passed} (${((results.passed / results.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.failed} (${((results.failed / results.totalTests) * 100).toFixed(1)}%)`);
  console.log('');

  if (results.vulnerabilities.length > 0) {
    console.log('⚠️  VULNERABILITIES DETECTED:');
    console.log('');
    const byCategory = {};
    results.vulnerabilities.forEach((vuln) => {
      if (!byCategory[vuln.category]) {
        byCategory[vuln.category] = [];
      }
      byCategory[vuln.category].push(vuln);
    });

    Object.entries(byCategory).forEach(([category, vulns]) => {
      console.log(`  ${category}:`);
      vulns.forEach((v) => {
        console.log(`    - ${v.test}${v.details ? ' (' + v.details + ')' : ''}`);
      });
      console.log('');
    });
  } else {
    console.log('✅ NO VULNERABILITIES DETECTED');
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('');

  // Overall assessment
  const failureRate = (results.failed / results.totalTests) * 100;

  if (failureRate === 0) {
    console.log('🎉 EXCELLENT - All security tests passed!');
  } else if (failureRate < 10) {
    console.log('✓ GOOD - Most security tests passed, minor issues found');
  } else if (failureRate < 25) {
    console.log('⚠️  WARNING - Multiple security issues detected');
  } else {
    console.log('❌ CRITICAL - Significant security vulnerabilities found');
  }

  console.log('');
}

async function runSecurityTests() {
  console.log('='.repeat(70));
  console.log('AcademIQ Security Testing Suite');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('');

  try {
    await testSQLInjection();
    await testXSS();
    await testAuthenticationBypass();
    await testInputValidation();
    await testSecurityHeaders();
    await testRateLimiting();
    await testCORS();
    await testErrorHandling();
    await testPathTraversal();

    printSummary();
  } catch (error) {
    console.error('\n❌ Security test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runSecurityTests();
