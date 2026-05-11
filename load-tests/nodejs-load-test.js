const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MAX_CONCURRENT_USERS = 500;

// Test configuration
const stages = [
  { duration: 30, targetUsers: 50, name: 'Ramp to 50 users' },
  { duration: 30, targetUsers: 100, name: 'Ramp to 100 users' },
  { duration: 30, targetUsers: 200, name: 'Ramp to 200 users' },
  { duration: 30, targetUsers: 300, name: 'Ramp to 300 users' },
  { duration: 60, targetUsers: 500, name: 'Ramp to 500 users' },
  { duration: 60, targetUsers: 500, name: 'Sustain 500 users' },
];

const topics = [
  'cardiovascular-system',
  'respiratory-system',
  'nervous-system',
  'skeletal-system',
  'muscular-system',
];

const questionTypes = ['MCQ', 'SHORT_ANSWER', 'THEORY', 'MIXED'];

// Metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: Date.now(),
  requestsByEndpoint: {},
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
      ...options,
    };

    const startTime = Date.now();

    const req = client.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        metrics.responseTimes.push(responseTime);
        metrics.totalRequests++;

        if (res.statusCode >= 200 && res.statusCode < 400) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
          metrics.errors.push({
            url,
            statusCode: res.statusCode,
            responseTime,
          });
        }

        const endpoint = urlObj.pathname;
        metrics.requestsByEndpoint[endpoint] = (metrics.requestsByEndpoint[endpoint] || 0) + 1;

        resolve({
          statusCode: res.statusCode,
          data,
          responseTime,
        });
      });
    });

    req.on('error', (error) => {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.errors.push({
        url,
        error: error.message,
      });
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();

    // Timeout after 10 seconds
    setTimeout(() => {
      req.destroy();
      reject(new Error('Request timeout'));
    }, 10000);
  });
}

async function simulateUser() {
  const scenarios = [
    // Homepage
    async () => {
      await makeRequest(`${BASE_URL}/`);
    },
    // Topics page
    async () => {
      await makeRequest(`${BASE_URL}/topics`);
    },
    // API: Get topics
    async () => {
      await makeRequest(`${BASE_URL}/api/topics`);
    },
    // Exam page
    async () => {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      await makeRequest(`${BASE_URL}/exam?topic=${topic}`);
    },
    // API: Start exam
    async () => {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const count = Math.floor(Math.random() * 13) + 8;

      await makeRequest(`${BASE_URL}/api/start-exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          topicSlug: topic,
          type,
          count,
          durationMinutes: 30,
        },
      });
    },
    // API: Health check
    async () => {
      await makeRequest(`${BASE_URL}/api/health`);
    },
    // API: Analytics
    async () => {
      await makeRequest(`${BASE_URL}/api/analytics`);
    },
  ];

  // Pick random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  try {
    await scenario();
    // Random delay between requests (0.5-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1500 + 500));
  } catch (error) {
    // Error already recorded in metrics
  }
}

async function runStage(stage) {
  console.log(`\n🚀 Starting: ${stage.name}`);
  console.log(`   Duration: ${stage.duration}s, Target: ${stage.targetUsers} users`);

  const stageStartTime = Date.now();
  const stageDuration = stage.duration * 1000;
  const promises = [];

  // Simulate users making requests throughout the stage
  const requestsPerUser = Math.ceil(stage.duration / 2); // One request every 2 seconds per user
  const totalRequests = stage.targetUsers * requestsPerUser;
  const delayBetweenRequests = stageDuration / totalRequests;

  for (let i = 0; i < totalRequests; i++) {
    const delay = i * delayBetweenRequests;
    promises.push(
      new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await simulateUser();
          } catch (error) {
            // Error already tracked
          }
          resolve();
        }, delay);
      })
    );
  }

  await Promise.all(promises);

  console.log(`   ✓ Completed: ${stage.name}`);
}

function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function printReport() {
  const duration = (Date.now() - metrics.startTime) / 1000;

  console.log('\n');
  console.log('='.repeat(60));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Test Duration: ${duration.toFixed(2)}s`);
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful: ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Request Rate: ${(metrics.totalRequests / duration).toFixed(2)} req/s`);
  console.log('');
  console.log('Response Times:');
  console.log(`  Min: ${Math.min(...metrics.responseTimes).toFixed(2)}ms`);
  console.log(`  Max: ${Math.max(...metrics.responseTimes).toFixed(2)}ms`);
  console.log(`  Avg: ${(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length).toFixed(2)}ms`);
  console.log(`  p50: ${calculatePercentile(metrics.responseTimes, 50).toFixed(2)}ms`);
  console.log(`  p95: ${calculatePercentile(metrics.responseTimes, 95).toFixed(2)}ms`);
  console.log(`  p99: ${calculatePercentile(metrics.responseTimes, 99).toFixed(2)}ms`);
  console.log('');
  console.log('Requests by Endpoint:');
  Object.entries(metrics.requestsByEndpoint)
    .sort((a, b) => b[1] - a[1])
    .forEach(([endpoint, count]) => {
      console.log(`  ${endpoint}: ${count}`);
    });

  if (metrics.errors.length > 0) {
    console.log('');
    console.log(`⚠️  Errors (showing first 10 of ${metrics.errors.length}):`);
    metrics.errors.slice(0, 10).forEach((error) => {
      console.log(`  ${error.url || 'Unknown'}: ${error.statusCode || error.error}`);
    });
  }

  console.log('');
  console.log('='.repeat(60));

  // Performance assessment
  const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
  const p95 = calculatePercentile(metrics.responseTimes, 95);
  const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;

  console.log('');
  console.log('ASSESSMENT:');

  if (avgResponseTime < 500 && p95 < 2000 && errorRate < 5) {
    console.log('✅ EXCELLENT - System performs well under load');
  } else if (avgResponseTime < 1000 && p95 < 3000 && errorRate < 10) {
    console.log('✓ GOOD - System handles load acceptably');
  } else if (avgResponseTime < 2000 && p95 < 5000 && errorRate < 15) {
    console.log('⚠️  FAIR - Performance degrades under load');
  } else {
    console.log('❌ POOR - System struggles under load');
  }

  console.log('');
}

async function runLoadTests() {
  console.log('='.repeat(60));
  console.log('AnatomiQ Load Testing Suite');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Max Concurrent Users: ${MAX_CONCURRENT_USERS}`);
  console.log('');

  try {
    for (const stage of stages) {
      await runStage(stage);
    }

    printReport();
  } catch (error) {
    console.error('Load test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runLoadTests();
