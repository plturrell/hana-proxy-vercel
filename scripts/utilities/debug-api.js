/**
 * Debug API Issues
 */

const BASE_URL = 'https://hana-proxy-vercel-4uxy5fskc-plturrells-projects.vercel.app';

async function debugAPI() {
  console.log('🔍 Debugging API Issues');
  console.log('=======================\n');

  try {
    // Test basic health check first
    console.log('Test 1: Basic Health Check');
    console.log('--------------------------');
    
    const healthResponse = await fetch(`${BASE_URL}/api/a2a-grok-autonomy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health_check' })
    });
    
    console.log('Status:', healthResponse.status);
    console.log('Headers:', Object.fromEntries(healthResponse.headers.entries()));
    
    const healthText = await healthResponse.text();
    console.log('Raw response:', healthText.substring(0, 200));
    
    try {
      const healthJson = JSON.parse(healthText);
      console.log('✅ Health check JSON:', healthJson);
    } catch (e) {
      console.log('❌ Not valid JSON');
      console.log('Response starts with:', healthText.substring(0, 50));
    }

    // Test initialize action
    console.log('\nTest 2: Initialize Action');
    console.log('-------------------------');
    
    const initResponse = await fetch(`${BASE_URL}/api/a2a-grok-autonomy`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ action: 'initialize' })
    });
    
    console.log('Initialize Status:', initResponse.status);
    const initText = await initResponse.text();
    console.log('Initialize Raw response:', initText.substring(0, 300));
    
    try {
      const initJson = JSON.parse(initText);
      console.log('✅ Initialize JSON:', initJson);
    } catch (e) {
      console.log('❌ Initialize not valid JSON');
      if (initText.includes('<!DOCTYPE') || initText.includes('<html')) {
        console.log('⚠️ Getting HTML instead of JSON - likely server error');
      }
    }

    // Test with a simpler action
    console.log('\nTest 3: Simple Blockchain Action');
    console.log('--------------------------------');
    
    const simpleResponse = await fetch(`${BASE_URL}/api/a2a-grok-autonomy`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        action: 'monitor_blockchain_events'
      })
    });
    
    console.log('Simple Status:', simpleResponse.status);
    const simpleText = await simpleResponse.text();
    console.log('Simple Raw response:', simpleText.substring(0, 300));

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
debugAPI();
