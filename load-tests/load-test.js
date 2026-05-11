import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '3m', target: 100 },  // Ramp up to 100 users over 3 minutes
    { duration: '3m', target: 200 },  // Ramp up to 200 users over 3 minutes
    { duration: '3m', target: 300 },  // Ramp up to 300 users over 3 minutes
    { duration: '4m', target: 500 },  // Ramp up to 500 users over 4 minutes
    { duration: '5m', target: 500 },  // Stay at 500 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'], // 95% of requests should be below 2s, 99% below 3s
    'http_req_failed': ['rate<0.05'], // Error rate should be less than 5%
    'errors': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Sample topics for testing
const topics = [
  'cardiovascular-system',
  'respiratory-system',
  'nervous-system',
  'skeletal-system',
  'muscular-system',
];

const questionTypes = ['MCQ', 'SHORT_ANSWER', 'THEORY', 'MIXED'];

export default function () {
  // Scenario 1: Homepage Load
  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`);

    const success = check(res, {
      'homepage status is 200': (r) => r.status === 200,
      'homepage loads in <2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    requestCount.add(1);

    sleep(1);
  });

  // Scenario 2: Topics Page Load
  group('Topics Page', () => {
    const res = http.get(`${BASE_URL}/topics`);

    const success = check(res, {
      'topics page status is 200': (r) => r.status === 200,
      'topics page loads in <2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    requestCount.add(1);

    sleep(1);
  });

  // Scenario 3: API - Get Topics
  group('API: Get Topics', () => {
    const res = http.get(`${BASE_URL}/api/topics`);

    const success = check(res, {
      'get topics status is 200': (r) => r.status === 200,
      'get topics response time <500ms': (r) => r.timings.duration < 500,
      'get topics returns data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.topics && data.topics.length > 0;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    requestCount.add(1);

    sleep(0.5);
  });

  // Scenario 4: Exam Page Load
  group('Exam Page', () => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const res = http.get(`${BASE_URL}/exam?topic=${randomTopic}`);

    const success = check(res, {
      'exam page status is 200': (r) => r.status === 200,
      'exam page loads in <3s': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    requestCount.add(1);

    sleep(1);
  });

  // Scenario 5: Start Exam API
  group('API: Start Exam', () => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const randomCount = Math.floor(Math.random() * 13) + 8; // 8-20 questions

    const payload = JSON.stringify({
      topicSlug: randomTopic,
      type: randomType,
      count: randomCount,
      durationMinutes: 30,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(`${BASE_URL}/api/start-exam`, payload, params);

    const success = check(res, {
      'start exam status is 200': (r) => r.status === 200,
      'start exam response time <3s': (r) => r.timings.duration < 3000,
      'start exam returns questions': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.questions && data.questions.length > 0;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    requestCount.add(1);

    sleep(2);
  });

  // Scenario 6: Health Check
  group('API: Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`);

    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time <200ms': (r) => r.timings.duration < 200,
      'health check returns status': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.status === 'ok';
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    requestCount.add(1);

    sleep(0.5);
  });

  // Scenario 7: Analytics API
  group('API: Analytics', () => {
    const res = http.get(`${BASE_URL}/api/analytics`);

    const success = check(res, {
      'analytics status is 200': (r) => r.status === 200,
      'analytics response time <1s': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    requestCount.add(1);

    sleep(1);
  });

  // Random sleep between 1-3 seconds to simulate real user behavior
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n' + indent + '=== Load Test Summary ===\n\n';

  // Test duration
  summary += indent + `Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n`;

  // HTTP metrics
  if (data.metrics.http_reqs) {
    summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
    summary += indent + `Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  }

  // Response time
  if (data.metrics.http_req_duration) {
    summary += indent + `\nResponse Time:\n`;
    summary += indent + `  avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += indent + `  min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
    summary += indent + `  max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
    summary += indent + `  p(95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += indent + `  p(99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  }

  // Error rate
  if (data.metrics.http_req_failed) {
    const errorRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += indent + `\nError Rate: ${errorRate}%\n`;
  }

  // Virtual users
  if (data.metrics.vus) {
    summary += indent + `\nVirtual Users:\n`;
    summary += indent + `  max: ${data.metrics.vus.values.max}\n`;
  }

  return summary;
}
