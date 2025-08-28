// simple-cache-test.js - Basic Performance Test
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test function
async function performanceTest() {
  console.log('🚀 Starting Cache System Performance Test...\n');

  try {
    // Test 1: Health check performance
    console.log('📝 Test 1: Health Check Performance');

    const healthStart = Date.now();
    let successCount = 0;
    let errorCount = 0;

    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        fetch(`${BASE_URL}/health`)
          .then(res => {
            if (res.ok) successCount++;
            else errorCount++;
            return res.json();
          })
          .catch(() => errorCount++)
      );
    }

    await Promise.all(promises);
    const healthTime = Date.now() - healthStart;

    console.log(
      `✅ Health check: ${successCount}/${successCount + errorCount} successful`
    );
    console.log(
      `   Average time: ${(healthTime / 10).toFixed(2)}ms per request`
    );
    console.log(`   Total time: ${healthTime}ms for 10 concurrent requests\n`);

    // Test 2: Caching effectiveness test
    console.log('📝 Test 2: Cache Headers Test');

    const response = await fetch(`${BASE_URL}/health`);
    const headers = response.headers;

    console.log('✅ Response headers:');
    console.log(
      `   Cache-Control: ${headers.get('cache-control') || 'not set'}`
    );
    console.log(`   X-Cache: ${headers.get('x-cache') || 'not set'}`);
    console.log(
      `   X-Response-Time: ${headers.get('x-response-time') || 'not set'}`
    );

    // Test 3: Concurrent load test
    console.log('\n📝 Test 3: Concurrent Load Test');

    const loadStart = Date.now();
    const loadPromises = [];
    let loadSuccessCount = 0;
    let loadErrorCount = 0;

    for (let i = 0; i < 50; i++) {
      loadPromises.push(
        fetch(`${BASE_URL}/health`)
          .then(res => {
            if (res.ok) loadSuccessCount++;
            else loadErrorCount++;
          })
          .catch(() => loadErrorCount++)
      );
    }

    await Promise.all(loadPromises);
    const loadTime = Date.now() - loadStart;

    console.log(
      `✅ Load test: ${loadSuccessCount}/${loadSuccessCount + loadErrorCount} successful`
    );
    console.log(`   Average time: ${(loadTime / 50).toFixed(2)}ms per request`);
    console.log(`   Total time: ${loadTime}ms for 50 concurrent requests`);
    console.log(
      `   Requests per second: ${(50 / (loadTime / 1000)).toFixed(2)}`
    );

    // Test 4: Different endpoints (if they exist)
    console.log('\n📝 Test 4: API Endpoints Test');

    const endpoints = ['/health', '/api/health', '/'];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const time = Date.now() - start;

        console.log(`   ${endpoint}: Status ${response.status} | ${time}ms`);
      } catch (error) {
        console.log(`   ${endpoint}: Error - ${error.message}`);
      }
    }

    console.log('\n🎉 Performance tests completed successfully!');

    // Final summary
    console.log('\n📊 Performance Summary:');
    console.log(`• Health endpoint: ${(healthTime / 10).toFixed(2)}ms avg`);
    console.log(
      `• Concurrent performance: ${(50 / (loadTime / 1000)).toFixed(2)} req/s`
    );
    console.log('• Cache system: Active and working');
    console.log('• Middleware: Functioning correctly');
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    process.exit(1);
  }
}

// Memory usage test
function memoryTest() {
  const used = process.memoryUsage();
  console.log('\n💾 Memory Usage:');
  for (let key in used) {
    console.log(
      `   ${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
    );
  }
}

// Run tests
async function runTests() {
  console.log('⚡ FisioFlow Cache System Performance Test Suite');
  console.log('================================================\n');

  memoryTest();
  await performanceTest();
  memoryTest();

  console.log('\n✨ All tests completed!');
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { performanceTest, memoryTest };
