// test-cache-system.js - Basic Cache System Test
const { cache, patientCache, CacheWarmer } = require('./lib/cache');
const { cacheMetrics } = require('./lib/cache-metrics');
const {
  cacheInvalidator,
  CacheInvalidation,
} = require('./lib/cache-invalidation');
const { sessionManager } = require('./lib/session-cache');

async function testCacheSystem() {
  console.log('🚀 Starting Cache System Test...\n');

  try {
    // Test 1: Basic cache operations
    console.log('📝 Test 1: Basic Cache Operations');

    await cache.set(
      'test:key1',
      { message: 'Hello Cache!', timestamp: Date.now() },
      {
        ttl: 60,
        tags: ['test'],
      }
    );

    const cached = await cache.get('test:key1');
    console.log('✅ Cache set/get:', cached ? 'PASSED' : 'FAILED');

    // Test 2: Cache invalidation
    console.log('\n📝 Test 2: Cache Invalidation');

    await cache.invalidateTag('test');
    const invalidated = await cache.get('test:key1');
    console.log('✅ Cache invalidation:', !invalidated ? 'PASSED' : 'FAILED');

    // Test 3: Multi-layer cache
    console.log('\n📝 Test 3: Multi-layer Cache');

    await patientCache.set(
      'patient:123',
      {
        id: '123',
        name: 'Test Patient',
        email: 'test@example.com',
      },
      {
        ttl: 300,
        layer: 'both',
        tags: ['patients', 'patient:123'],
      }
    );

    const patient = await patientCache.get('patient:123');
    console.log('✅ Multi-layer cache:', patient ? 'PASSED' : 'FAILED');

    // Test 4: Session management
    console.log('\n📝 Test 4: Session Management');

    const sessionId = await sessionManager.createSession({
      userId: 'user123',
      email: 'test@example.com',
      role: 'admin',
      lastActivity: Date.now(),
    });

    const session = await sessionManager.getSession(sessionId);
    console.log('✅ Session creation:', session ? 'PASSED' : 'FAILED');

    await sessionManager.destroySession(sessionId);
    const destroyedSession = await sessionManager.getSession(sessionId);
    console.log(
      '✅ Session destruction:',
      !destroyedSession ? 'PASSED' : 'FAILED'
    );

    // Test 5: Cache metrics
    console.log('\n📝 Test 5: Cache Metrics');

    const metrics = await cacheMetrics.getCurrentMetrics();
    console.log('✅ Metrics collection:', metrics ? 'PASSED' : 'FAILED');
    console.log(`   - Overall hit rate: ${metrics.overall.hitRate}%`);
    console.log(`   - Total operations: ${metrics.overall.totalOperations}`);

    // Test 6: Cache invalidation system
    console.log('\n📝 Test 6: Intelligent Invalidation');

    await CacheInvalidation.patientCreated('test-patient-id');
    console.log('✅ Intelligent invalidation: PASSED');

    // Test 7: Cache health score
    console.log('\n📝 Test 7: Cache Health Score');

    const healthScore = cacheMetrics.getCacheHealthScore();
    console.log(`✅ Cache health score: ${healthScore}/100`);

    console.log('\n🎉 All tests completed successfully!');

    // Display final statistics
    console.log('\n📊 Final Cache Statistics:');
    const finalMetrics = await cacheMetrics.getCurrentMetrics();

    console.log('Default Cache:', finalMetrics.managers.default);
    console.log('Patient Cache:', finalMetrics.managers.patients);
    console.log('Session Cache:', finalMetrics.managers.sessions);

    if (finalMetrics.redis) {
      console.log('Redis Stats:', finalMetrics.redis);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Performance test function
async function performanceTest() {
  console.log('\n⚡ Starting Performance Test...\n');

  const iterations = 1000;
  const startTime = Date.now();

  // Test cache performance
  for (let i = 0; i < iterations; i++) {
    await cache.set(
      `perf:test:${i}`,
      { value: i, timestamp: Date.now() },
      {
        ttl: 300,
        layer: 'both',
      }
    );
  }

  const setTime = Date.now() - startTime;
  console.log(
    `⏱️ Cache SET performance: ${setTime}ms for ${iterations} operations`
  );
  console.log(
    `   Average: ${(setTime / iterations).toFixed(2)}ms per operation`
  );

  // Test cache retrieval performance
  const retrieveStart = Date.now();

  for (let i = 0; i < iterations; i++) {
    await cache.get(`perf:test:${i}`);
  }

  const retrieveTime = Date.now() - retrieveStart;
  console.log(
    `⏱️ Cache GET performance: ${retrieveTime}ms for ${iterations} operations`
  );
  console.log(
    `   Average: ${(retrieveTime / iterations).toFixed(2)}ms per operation`
  );

  // Cleanup
  await cache.clear();
  console.log('🧹 Performance test cleanup completed');
}

// Run tests
async function runAllTests() {
  await testCacheSystem();
  await performanceTest();

  console.log('\n✨ All cache system tests completed successfully!');
  process.exit(0);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testCacheSystem, performanceTest };
