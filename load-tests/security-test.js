import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
  vus: 10, // 10 virtual users for security testing
  duration: '5m',
  thresholds: {
    'http_req_failed': ['rate<0.1'], // Allow some failed requests (we're testing edge cases)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Security test payloads
const sqlInjectionPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE users--",
  "' OR 1=1--",
  "admin'--",
  "' UNION SELECT NULL--",
];

const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<svg onload=alert("XSS")>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
];

const pathTraversalPayloads = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\win.ini',
  '....//....//....//etc/passwd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
];

export default function () {
  // Test 1: SQL Injection Protection
  group('SQL Injection Tests', () => {
    sqlInjectionPayloads.forEach((payload) => {
      // Test search endpoint
      const searchRes = http.get(`${BASE_URL}/api/topics?q=${encodeURIComponent(payload)}`);
      check(searchRes, {
        'SQL injection blocked or sanitized': (r) => {
          // Should not return 500 error or expose database errors
          return r.status !== 500 && !r.body.includes('SQL') && !r.body.includes('database');
        },
      });

      // Test exam start endpoint
      const examPayload = JSON.stringify({
        courseSlug: payload,
        topicSlug: 'test',
        type: 'MCQ',
        count: 10,
        durationMinutes: 30,
      });

      const examRes = http.post(`${BASE_URL}/api/start-exam`, examPayload, {
        headers: { 'Content-Type': 'application/json' },
      });

      check(examRes, {
        'SQL injection in exam blocked': (r) => r.status !== 500,
      });
    });
  });

  // Test 2: XSS Protection
  group('XSS Protection Tests', () => {
    xssPayloads.forEach((payload) => {
      const res = http.get(`${BASE_URL}/topics?q=${encodeURIComponent(payload)}`);

      check(res, {
        'XSS payload not executed': (r) => {
          // Should not contain unescaped script tags
          return !r.body.includes('<script>') && !r.body.includes('onerror=');
        },
        'Response has CSP header': (r) => {
          return r.headers['Content-Security-Policy'] !== undefined;
        },
      });
    });
  });

  // Test 3: Path Traversal Protection
  group('Path Traversal Tests', () => {
    pathTraversalPayloads.forEach((payload) => {
      const res = http.get(`${BASE_URL}/api/material-file/${payload}`);

      check(res, {
        'Path traversal blocked': (r) => {
          // Should return 400/403/404, not 200 with sensitive file content
          return r.status !== 200 || !r.body.includes('root:') && !r.body.includes('[extensions]');
        },
      });
    });
  });

  // Test 4: Authentication Bypass Attempts
  group('Authentication Security Tests', () => {
    // Test admin endpoints without auth
    const adminEndpoints = [
      '/api/admin-materials',
      '/api/admin-overview',
      '/api/upload-material',
      '/api/process-material',
    ];

    adminEndpoints.forEach((endpoint) => {
      const res = http.get(`${BASE_URL}${endpoint}`);

      check(res, {
        [`${endpoint} requires auth`]: (r) => r.status === 401 || r.status === 403,
      });
    });

    // Test with invalid admin key
    const invalidKeys = [
      'invalid-key',
      '12345',
      '',
      '../../../etc/passwd',
      '<script>alert("XSS")</script>',
    ];

    invalidKeys.forEach((key) => {
      const res = http.get(`${BASE_URL}/api/admin-materials`, {
        headers: { 'x-admin-upload-key': key },
      });

      check(res, {
        'Invalid admin key rejected': (r) => r.status === 401 || r.status === 403,
      });
    });
  });

  // Test 5: CSRF Protection
  group('CSRF Protection Tests', () => {
    // Attempt POST without proper headers
    const res = http.post(`${BASE_URL}/api/start-exam`, '{"test":"data"}');

    check(res, {
      'CSRF protection in place': (r) => {
        // Should require proper content-type or origin headers
        return r.status !== 200 || r.body.includes('error');
      },
    });
  });

  // Test 6: Rate Limiting
  group('Rate Limiting Tests', () => {
    const requests = [];
    // Fire 50 rapid requests
    for (let i = 0; i < 50; i++) {
      requests.push(http.get(`${BASE_URL}/api/health`));
    }

    const rateLimited = requests.some((r) => r.status === 429);

    check(rateLimited, {
      'Rate limiting is active': (limited) => limited === true,
    });
  });

  // Test 7: Input Validation
  group('Input Validation Tests', () => {
    // Test with invalid JSON
    const invalidJsonRes = http.post(
      `${BASE_URL}/api/start-exam`,
      'invalid json{',
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(invalidJsonRes, {
      'Invalid JSON rejected': (r) => r.status === 400,
    });

    // Test with missing required fields
    const missingFieldsRes = http.post(
      `${BASE_URL}/api/start-exam`,
      JSON.stringify({}),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(missingFieldsRes, {
      'Missing fields rejected': (r) => r.status === 400,
    });

    // Test with invalid data types
    const invalidTypesRes = http.post(
      `${BASE_URL}/api/start-exam`,
      JSON.stringify({
        courseSlug: 123, // Should be string
        topicSlug: true, // Should be string
        type: 'INVALID',
        count: 'ten', // Should be number
        durationMinutes: null,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(invalidTypesRes, {
      'Invalid data types rejected': (r) => r.status === 400,
    });
  });

  // Test 8: Header Injection
  group('Header Injection Tests', () => {
    const maliciousHeaders = {
      'X-Custom-Header': '\r\nX-Injected: malicious',
      'User-Agent': 'Mozilla/5.0\r\nX-Injected: test',
    };

    const res = http.get(`${BASE_URL}/api/health`, { headers: maliciousHeaders });

    check(res, {
      'Header injection blocked': (r) => {
        // Response should not contain injected headers
        return !r.headers['X-Injected'];
      },
    });
  });

  // Test 9: Sensitive Data Exposure
  group('Sensitive Data Exposure Tests', () => {
    const res = http.get(`${BASE_URL}/api/health`);

    check(res, {
      'No sensitive headers exposed': (r) => {
        const sensitiveHeaders = ['X-Powered-By', 'Server', 'X-AspNet-Version'];
        return !sensitiveHeaders.some((header) => r.headers[header]);
      },
      'Error messages do not expose internals': (r) => {
        // Check if error responses don't expose stack traces or internal paths
        return !r.body.includes('node_modules') && !r.body.includes('stack trace');
      },
    });
  });

  // Test 10: CORS Policy
  group('CORS Policy Tests', () => {
    const res = http.get(`${BASE_URL}/api/topics`, {
      headers: {
        'Origin': 'https://malicious-site.com',
      },
    });

    check(res, {
      'CORS policy restricts origins': (r) => {
        const allowedOrigin = r.headers['Access-Control-Allow-Origin'];
        // Should not allow arbitrary origins or use *
        return !allowedOrigin || allowedOrigin !== '*';
      },
    });
  });
}

export function handleSummary(data) {
  let vulnerabilities = [];
  let passed = 0;
  let failed = 0;

  // Analyze check results
  for (const [checkName, checkData] of Object.entries(data.metrics)) {
    if (checkName.startsWith('checks')) {
      const passes = checkData.values.passes || 0;
      const fails = checkData.values.fails || 0;
      passed += passes;
      failed += fails;

      if (fails > 0) {
        vulnerabilities.push({
          check: checkName,
          failures: fails,
          passes: passes,
        });
      }
    }
  }

  const report = {
    summary: {
      totalChecks: passed + failed,
      passed: passed,
      failed: failed,
      successRate: ((passed / (passed + failed)) * 100).toFixed(2) + '%',
    },
    vulnerabilities: vulnerabilities,
    timestamp: new Date().toISOString(),
  };

  return {
    'security-test-results.json': JSON.stringify(report, null, 2),
    stdout: formatSecurityReport(report),
  };
}

function formatSecurityReport(report) {
  let output = '\n=== Security Test Report ===\n\n';
  output += `Total Checks: ${report.summary.totalChecks}\n`;
  output += `Passed: ${report.summary.passed}\n`;
  output += `Failed: ${report.summary.failed}\n`;
  output += `Success Rate: ${report.summary.successRate}\n\n`;

  if (report.vulnerabilities.length > 0) {
    output += '⚠️  VULNERABILITIES DETECTED:\n\n';
    report.vulnerabilities.forEach((vuln) => {
      output += `  - ${vuln.check}\n`;
      output += `    Failures: ${vuln.failures}, Passes: ${vuln.passes}\n\n`;
    });
  } else {
    output += '✅ No vulnerabilities detected!\n\n';
  }

  output += `Report generated: ${report.timestamp}\n`;

  return output;
}
