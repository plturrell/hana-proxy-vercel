// Simple test to check if API is responding
const BASE_URL = 'https://hana-proxy-vercel-2kfq9rd3h-plturrells-projects.vercel.app';

async function testSimple() {
  try {
    console.log('Testing API...');
    
    const response = await fetch(`${BASE_URL}/api/a2a-blockchain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'get_registry_stats'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('Parsed data:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSimple();