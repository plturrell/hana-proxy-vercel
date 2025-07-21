/**
 * Simple X.AI API Test
 */

import fetch from 'node-fetch';

const API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

async function testAPI() {
  console.log('Testing X.AI API...\n');
  console.log('API Key length:', API_KEY.length);
  console.log('API Key prefix:', API_KEY.substring(0, 4));
  console.log('Key configured:', !!API_KEY);

  const request = {
    model: 'grok-4-0709',  // Use the correct model name
    messages: [
      {
        role: 'user',
        content: 'Hello'
      }
    ],
    max_tokens: 10
  };

  try {
    // Try with different auth headers
    const tests = [
      { name: 'Bearer token', headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } },
      { name: 'X-API-Key', headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' } },
      { name: 'api-key header', headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' } }
    ];

    for (const test of tests) {
      console.log(`\nTrying ${test.name}...`);
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: test.headers,
        body: JSON.stringify(request)
      });

      console.log('Status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        console.log('Response:', data);
        return;
      } else {
        const error = await response.text();
        console.log('Error:', error);
      }
    }

    // Also try different endpoints
    console.log('\nTrying different endpoint...');
    const altResponse = await fetch('https://api.x.ai/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        prompt: 'Hello',
        max_tokens: 10
      })
    });

    console.log('Alt endpoint status:', altResponse.status);
    const altError = await altResponse.text();
    console.log('Alt endpoint response:', altError);

  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testAPI();