/**
 * Test script for Function Orchestrator
 * Verifies that all mathematical functions are properly integrated
 */

import orchestrator from './api/functions/orchestrator.js';

async function testOrchestrator() {
  console.log('🧪 Testing Function Orchestrator...\n');

  // Test 1: Get available functions
  console.log('1️⃣ Available Functions:');
  const functions = orchestrator.getAvailableFunctions();
  const implemented = Object.entries(functions).filter(([_, info]) => info.implemented);
  const notImplemented = Object.entries(functions).filter(([_, info]) => !info.implemented);
  
  console.log(`✅ Implemented: ${implemented.length} functions`);
  console.log(`❌ Not Implemented: ${notImplemented.length} functions`);
  console.log('\nImplemented functions by category:');
  
  const categories = {};
  implemented.forEach(([name, info]) => {
    if (!categories[info.category]) categories[info.category] = [];
    categories[info.category].push(name);
  });
  
  Object.entries(categories).forEach(([cat, funcs]) => {
    console.log(`  ${cat}: ${funcs.join(', ')}`);
  });

  // Test 2: Test newly implemented functions
  console.log('\n\n2️⃣ Testing New Functions:');

  // Test Clustering
  console.log('\n📊 Testing Clustering:');
  const clusteringResult = await orchestrator.executeFunction('clustering', {
    data: [[1, 2], [1.5, 1.8], [5, 8], [8, 8], [1, 0.6], [9, 11]],
    method: 'kmeans',
    num_clusters: 2
  });
  console.log(`Status: ${clusteringResult.status}`);
  console.log(`Clusters found: ${clusteringResult.num_clusters || 'N/A'}`);
  console.log(`Execution time: ${clusteringResult.executionTime}ms`);

  // Test Time Series Analysis
  console.log('\n📈 Testing Time Series Analysis:');
  const timeSeriesResult = await orchestrator.executeFunction('time_series_analysis', {
    data: [100, 102, 101, 105, 110, 108, 115, 120, 118, 125, 130, 128],
    method: 'decomposition',
    frequency: 'monthly'
  });
  console.log(`Status: ${timeSeriesResult.status}`);
  console.log(`Trend detected: ${timeSeriesResult.interpretation || 'N/A'}`);

  // Test Outlier Detection
  console.log('\n🔍 Testing Outlier Detection:');
  const outlierResult = await orchestrator.executeFunction('outlier_detection', {
    data: [1, 2, 2, 3, 3, 3, 4, 4, 100, 4, 5],
    method: 'isolation_forest',
    contamination: 0.1
  });
  console.log(`Status: ${outlierResult.status}`);
  console.log(`Outliers found: ${outlierResult.num_outliers || 0}`);

  // Test Regression
  console.log('\n📐 Testing Regression:');
  const regressionResult = await orchestrator.executeFunction('regression', {
    features: [[1], [2], [3], [4], [5]],
    target: [2.1, 3.9, 6.1, 8.0, 10.2],
    model: 'linear'
  });
  console.log(`Status: ${regressionResult.status}`);
  console.log(`R² score: ${regressionResult.metrics?.r2?.toFixed(3) || 'N/A'}`);

  // Test 3: Test batch processing
  console.log('\n\n3️⃣ Testing Batch Processing:');
  const batchResult = await orchestrator.executeBatch([
    {
      function: 'sharpe_ratio',
      parameters: { returns: [0.01, 0.02, -0.01, 0.03, 0.01] }
    },
    {
      function: 'correlation_matrix',
      parameters: {
        data_matrix: [[1, 2], [2, 4], [3, 6]],
        asset_names: ['Asset1', 'Asset2']
      }
    }
  ]);
  console.log(`Batch status: ${batchResult.status}`);
  console.log(`Results processed: ${batchResult.results?.length || 0}`);

  // Test 4: Check caching
  console.log('\n\n4️⃣ Testing Cache Performance:');
  const testData = { returns: [0.01, 0.02, -0.01, 0.03, 0.01] };
  
  // First call (cache miss)
  const start1 = Date.now();
  await orchestrator.executeFunction('sharpe_ratio', testData);
  const time1 = Date.now() - start1;
  
  // Second call (cache hit)
  const start2 = Date.now();
  const cachedResult = await orchestrator.executeFunction('sharpe_ratio', testData);
  const time2 = Date.now() - start2;
  
  console.log(`First call: ${time1}ms (cache miss)`);
  console.log(`Second call: ${time2}ms (cache ${cachedResult.cached ? 'hit' : 'miss'})`);
  console.log(`Speed improvement: ${Math.round((time1 - time2) / time1 * 100)}%`);

  // Test 5: Get metrics
  console.log('\n\n5️⃣ Orchestrator Metrics:');
  const metrics = orchestrator.getMetrics();
  console.log(`Total calls: ${metrics.totalCalls}`);
  console.log(`Cache hit rate: ${metrics.cacheHitRate}`);
  console.log(`Error rate: ${metrics.errorRate}`);
  console.log(`Average execution time: ${metrics.averageExecutionTime.toFixed(2)}ms`);

  console.log('\n✅ All tests completed!');
}

// Run tests
testOrchestrator().catch(console.error);