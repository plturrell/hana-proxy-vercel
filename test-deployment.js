#!/usr/bin/env node

/**
 * A2A Blockchain Deployment Test Suite
 * Tests all endpoints and verifies the system is fully operational
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://hana-proxy-vercel-42n5xfxkv-plturrells-projects.vercel.app';
const endpoints = {
  healthCheck: '/api/a2a-grok-autonomy',
  blockchainStatus: '/api/a2a-blockchain-bridge',
  messageProcessor: '/api/a2a-blockchain-message-processor',
  escrowManager: '/api/a2a-blockchain-escrow',
  agentIntegration: '/api/blockchain-agent-integration',
  unified: '/api/unified'
};

// Test results
let passedTests = 0;
let failedTests = 0;

// Helper function to make API requests
function makeRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await makeRequest(endpoints.healthCheck, { action: 'health_check' });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Health Check: PASSED');
      console.log(`   - Status: ${response.data.status}`);
      console.log(`   - Blockchain Integrated: ${response.data.blockchain_integrated || false}`);
      passedTests++;
    } else {
      console.log('❌ Health Check: FAILED');
      console.log(`   - Status Code: ${response.status}`);
      console.log(`   - Response: ${JSON.stringify(response.data)}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Health Check: ERROR');
    console.log(`   - ${error.message}`);
    failedTests++;
  }
}

async function testBlockchainStatus() {
  console.log('\n🔍 Testing Blockchain Status...');
  try {
    const response = await makeRequest(endpoints.blockchainStatus, { action: 'get_blockchain_status' });
    
    if (response.status === 200) {
      console.log('✅ Blockchain Status: PASSED');
      console.log(`   - Active Agents: ${response.data.active_agents || 0}`);
      console.log(`   - Deployed Contracts: ${response.data.deployed_contracts || 0}`);
      passedTests++;
    } else {
      console.log('❌ Blockchain Status: FAILED');
      console.log(`   - Status Code: ${response.status}`);
      console.log(`   - Response: ${JSON.stringify(response.data)}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Blockchain Status: ERROR');
    console.log(`   - ${error.message}`);
    failedTests++;
  }
}

async function testMessageProcessor() {
  console.log('\n🔍 Testing Message Processor...');
  try {
    const response = await makeRequest(endpoints.messageProcessor, { 
      action: 'verify_agent',
      agentId: 'test-agent-001'
    });
    
    if (response.status === 200 || response.status === 404) {
      console.log('✅ Message Processor: PASSED');
      console.log(`   - Endpoint responding correctly`);
      passedTests++;
    } else {
      console.log('❌ Message Processor: FAILED');
      console.log(`   - Status Code: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Message Processor: ERROR');
    console.log(`   - ${error.message}`);
    failedTests++;
  }
}

async function testEscrowManager() {
  console.log('\n🔍 Testing Escrow Manager...');
  try {
    const response = await makeRequest(endpoints.escrowManager, { 
      action: 'get_escrows',
      status: 'ACTIVE'
    });
    
    if (response.status === 200) {
      console.log('✅ Escrow Manager: PASSED');
      console.log(`   - Active Escrows: ${response.data.escrows?.length || 0}`);
      passedTests++;
    } else {
      console.log('❌ Escrow Manager: FAILED');
      console.log(`   - Status Code: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Escrow Manager: ERROR');
    console.log(`   - ${error.message}`);
    failedTests++;
  }
}

async function testAgentIntegration() {
  console.log('\n🔍 Testing Agent Integration...');
  try {
    const response = await makeRequest(endpoints.agentIntegration, { 
      action: 'monitor_blockchain_events'
    });
    
    if (response.status === 200) {
      console.log('✅ Agent Integration: PASSED');
      console.log(`   - Recent Events: ${response.data.events?.length || 0}`);
      console.log(`   - Recent Activities: ${response.data.activities?.length || 0}`);
      passedTests++;
    } else {
      console.log('❌ Agent Integration: FAILED');
      console.log(`   - Status Code: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Agent Integration: ERROR');
    console.log(`   - ${error.message}`);
    failedTests++;
  }
}

async function testUnifiedAPI() {
  console.log('\n🔍 Testing Unified API...');
  try {
    const response = await makeRequest(endpoints.unified + '?action=a2a_agents', {});
    
    if (response.status === 200) {
      console.log('✅ Unified API: PASSED');
      console.log(`   - Total Agents: ${response.data.count || 0}`);
      passedTests++;
    } else {
      console.log('❌ Unified API: FAILED');
      console.log(`   - Status Code: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Unified API: ERROR');
    console.log(`   - ${error.message}`);
    failedTests++;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 A2A Blockchain Deployment Test Suite');
  console.log('=====================================');
  console.log(`Testing: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Run all tests
  await testHealthCheck();
  await testBlockchainStatus();
  await testMessageProcessor();
  await testEscrowManager();
  await testAgentIntegration();
  await testUnifiedAPI();
  
  // Summary
  console.log('\n=====================================');
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! The system is operational.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check:');
    console.log('   1. Environment variables are set in Vercel');
    console.log('   2. Database schemas are deployed');
    console.log('   3. Edge functions are deployed');
    console.log('   4. API keys are stored in vault');
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);