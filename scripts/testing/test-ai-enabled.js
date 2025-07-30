import fetch from 'node-fetch';

const GROK_API_KEY = 'YOUR_XAI_API_KEY';

async function testGrokAPI() {
  console.log('🤖 Testing Grok API Integration');
  console.log('================================\n');

  // Test 1: Direct Grok API Test
  console.log('1️⃣ Testing Direct Grok API:');
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analysis expert. Provide concise market insights.'
          },
          {
            role: 'user',
            content: 'Analyze NVDA stock potential in one paragraph.'
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ Grok API is working!');
      console.log('  Response:', data.choices[0].message.content);
    } else {
      console.log('  ❌ API Error:', response.status, response.statusText);
      const error = await response.text();
      console.log('  Details:', error);
    }
  } catch (error) {
    console.log('  ❌ Connection Error:', error.message);
  }

  // Test 2: Test GraphQL with AI
  console.log('\n2️⃣ Testing GraphQL Endpoint with AI:');
  
  // First, update the local .env file
  console.log('  📝 Add this to your .env file:');
  console.log(`  GROK_API_KEY=YOUR_XAI_API_KEY`);
  
  console.log('\n  🌐 Add to Vercel Dashboard:');
  console.log('  1. Go to: https://vercel.com/dashboard');
  console.log('  2. Select your project: hana-proxy-vercel');
  console.log('  3. Go to Settings → Environment Variables');
  console.log('  4. Add new variable:');
  console.log('     Name: GROK_API_KEY');
  console.log(`     Value: YOUR_XAI_API_KEY`);
  console.log('  5. Select all environments (Production, Preview, Development)');
  console.log('  6. Click Save');
  console.log('  7. Redeploy your project');

  // Test the deployed endpoint
  console.log('\n3️⃣ Testing Deployed GraphQL with AI:');
  try {
    const graphqlResponse = await fetch('https://hana-proxy-vercel.vercel.app/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `query {
          marketIntelligence(symbol: "NVDA") {
            symbol
            currentPrice
            predictions {
              agentPredictions
              consensus {
                direction
                confidence
              }
            }
            opportunities
            risks {
              factor
              severity
              mitigation
            }
          }
        }`
      })
    });

    const graphqlData = await graphqlResponse.json();
    
    if (graphqlData.data?.marketIntelligence?.predictions?.agentPredictions) {
      console.log('  ✅ AI Features are ACTIVE!');
      console.log('  Agent Predictions:', graphqlData.data.marketIntelligence.predictions.agentPredictions);
    } else {
      console.log('  ⚠️ AI Features not yet active (need to add GROK_API_KEY to Vercel)');
      console.log('  Current response:', JSON.stringify(graphqlData.data?.marketIntelligence?.predictions, null, 2));
    }
  } catch (error) {
    console.log('  ❌ GraphQL Error:', error.message);
  }
}

// Run the test
testGrokAPI().catch(console.error);