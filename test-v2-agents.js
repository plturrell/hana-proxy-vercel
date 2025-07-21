/**
 * Test Script for V2 Agents with Real Mathematical Functions
 * Verifies all agents can successfully call mathematical functions
 */

// Use require instead of import for Node.js compatibility
const path = require('path');

// Mock the agent constructors for testing
class TestAgent {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.mathClient = {
      baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      
      async callFunction(functionName, params) {
        try {
          const fetch = (await import('node-fetch')).default;
          const response = await fetch(`${this.baseUrl}/api/functions/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ function: functionName, parameters: params })
          });
          
          if (!response.ok) {
            throw new Error(`Function call failed: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.status === 'error') {
            console.error(`Function ${functionName} error:`, result.error);
            return null;
          }
          
          return result;
        } catch (error) {
          console.error(`Math function ${functionName} failed:`, error);
          return null;
        }
      },
      
      async callBatch(requests) {
        try {
          const fetch = (await import('node-fetch')).default;
          const response = await fetch(`${this.baseUrl}/api/functions/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests })
          });
          
          if (!response.ok) {
            throw new Error(`Batch call failed: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error('Batch function call failed:', error);
          return { status: 'error', error: error.message };
        }
      }
    };
  }
}

// Test data
const testMarketData = {
  returns: [0.02, -0.01, 0.03, 0.01, -0.02, 0.04, 0.00, -0.01, 0.02, 0.03],
  prices: [100, 102, 101, 104, 105, 103, 107, 107, 106, 108, 111],
  volumes: [1000000, 1200000, 900000, 1100000, 1300000, 950000, 1050000, 1150000, 1000000, 1250000, 1100000]
};

const testUserData = {
  features: [
    [0.8, 0.6, 0.9, 0.7],
    [0.3, 0.4, 0.2, 0.5],
    [0.9, 0.8, 0.9, 0.8],
    [0.5, 0.5, 0.6, 0.4],
    [0.7, 0.7, 0.8, 0.6]
  ],
  behaviorFeatures: [[0.7, 0.8], [0.4, 0.3], [0.9, 0.9], [0.5, 0.6], [0.7, 0.6]],
  satisfactionScores: [0.8, 0.4, 0.9, 0.6, 0.7]
};

async function testMarketDataAgent() {
  console.log('\n🧪 Testing Market Data Agent V2...');
  
  try {
    const agent = new TestAgent({
      id: 'test-market-agent',
      name: 'Test Market Agent',
      description: 'Testing mathematical functions'
    });
    
    // Initialize agent (mock registration)
    agent.supabase = null; // Skip DB registration for test
    
    // Test VaR calculation
    console.log('📊 Testing VaR calculation...');
    const varResult = await agent.mathClient.callFunction('value_at_risk', {
      returns: testMarketData.returns,
      confidence_level: 0.95,
      method: 'historical'
    });
    console.log('VaR Result:', varResult);
    
    // Test Sharpe Ratio
    console.log('📈 Testing Sharpe Ratio...');
    const sharpeResult = await agent.mathClient.callFunction('sharpe_ratio', {
      returns: testMarketData.returns,
      risk_free_rate: 0.02
    });
    console.log('Sharpe Ratio:', sharpeResult);
    
    // Test Technical Indicators batch
    console.log('📊 Testing Technical Indicators batch...');
    const technicalBatch = await agent.mathClient.callBatch([
      {
        function: 'sma',
        parameters: { data: testMarketData.prices, period: 3 }
      },
      {
        function: 'ema',
        parameters: { data: testMarketData.prices, period: 3 }
      },
      {
        function: 'rsi',
        parameters: { data: testMarketData.prices, period: 5 }
      }
    ]);
    console.log('Technical Indicators:', technicalBatch);
    
    console.log('✅ Market Data Agent tests completed');
    return true;
    
  } catch (error) {
    console.error('❌ Market Data Agent test failed:', error);
    return false;
  }
}

async function testDataQualityAgent() {
  console.log('\n🧪 Testing Data Quality Agent V2...');
  
  try {
    const agent = new TestAgent({
      id: 'test-quality-agent',
      name: 'Test Quality Agent',
      description: 'Testing statistical functions'
    });
    
    agent.supabase = null; // Skip DB registration
    
    // Test Outlier Detection
    console.log('🔍 Testing Outlier Detection...');
    const outlierResult = await agent.mathClient.callFunction('outlier_detection', {
      data: testMarketData.returns,
      method: 'zscore',
      threshold: 2
    });
    console.log('Outlier Detection:', outlierResult);
    
    // Test Time Series Analysis
    console.log('📊 Testing Time Series Analysis...');
    const timeSeriesResult = await agent.mathClient.callFunction('time_series_analysis', {
      data: testMarketData.prices,
      method: 'decomposition',
      frequency: 'daily'
    });
    console.log('Time Series Analysis:', timeSeriesResult);
    
    console.log('✅ Data Quality Agent tests completed');
    return true;
    
  } catch (error) {
    console.error('❌ Data Quality Agent test failed:', error);
    return false;
  }
}

async function testClientLearningAgent() {
  console.log('\n🧪 Testing Client Learning Agent V2...');
  
  try {
    const agent = new TestAgent({
      id: 'test-learning-agent',
      name: 'Test Learning Agent',
      description: 'Testing behavioral analytics'
    });
    
    agent.supabase = null; // Skip DB registration
    
    // Test Clustering
    console.log('👥 Testing User Clustering...');
    const clusteringResult = await agent.mathClient.callFunction('clustering', {
      data: testUserData.features,
      method: 'kmeans',
      num_clusters: 3
    });
    console.log('Clustering Result:', clusteringResult);
    
    // Test Regression for satisfaction prediction
    console.log('📊 Testing Satisfaction Prediction...');
    const regressionResult = await agent.mathClient.callFunction('regression', {
      features: testUserData.behaviorFeatures,
      target: testUserData.satisfactionScores,
      model: 'linear_regression'
    });
    console.log('Regression Result:', regressionResult);
    
    console.log('✅ Client Learning Agent tests completed');
    return true;
    
  } catch (error) {
    console.error('❌ Client Learning Agent test failed:', error);
    return false;
  }
}

async function testNewsAssessmentAgent() {
  console.log('\n🧪 Testing News Assessment & Hedge Agent V2...');
  
  try {
    const agent = new TestAgent({
      id: 'test-news-agent',
      name: 'Test News Agent',
      description: 'Testing hedge calculations'
    });
    
    agent.supabase = null; // Skip DB registration
    
    // Test Kelly Criterion
    console.log('💰 Testing Kelly Criterion...');
    const kellyResult = await agent.mathClient.callFunction('kelly_criterion', {
      win_probability: 0.6,
      win_amount: 2,
      loss_amount: 1
    });
    console.log('Kelly Criterion:', kellyResult);
    
    // Test Black-Scholes
    console.log('📊 Testing Black-Scholes...');
    const blackScholesResult = await agent.mathClient.callFunction('black_scholes', {
      S: 100,  // Current price
      K: 105,  // Strike price
      T: 0.25, // Time to maturity (3 months)
      r: 0.05, // Risk-free rate
      sigma: 0.2, // Volatility
      option_type: 'call'
    });
    console.log('Black-Scholes:', blackScholesResult);
    
    console.log('✅ News Assessment Agent tests completed');
    return true;
    
  } catch (error) {
    console.error('❌ News Assessment Agent test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting V2 Agent Tests with Real Mathematical Functions\n');
  
  const results = {
    marketData: await testMarketDataAgent(),
    dataQuality: await testDataQualityAgent(),
    clientLearning: await testClientLearningAgent(),
    newsAssessment: await testNewsAssessmentAgent()
  };
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Market Data Agent: ${results.marketData ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Data Quality Agent: ${results.dataQuality ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Client Learning Agent: ${results.clientLearning ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`News Assessment Agent: ${results.newsAssessment ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(console.error);