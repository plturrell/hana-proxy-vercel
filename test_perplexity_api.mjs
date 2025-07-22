import fetch from 'node-fetch';

async function testPerplexityAPI() {
  console.log('🔧 DEBUGGING PERPLEXITY API INTEGRATION');
  console.log('='.repeat(45));
  
  const apiKey = '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';
  const apiUrl = 'https://api.perplexity.ai/chat/completions';
  
  console.log(`\nAPI Key: ${apiKey.substring(0, 20)}...`);
  console.log(`API URL: ${apiUrl}`);
  
  // Test 1: Simple request
  console.log('\n📡 Test 1: Basic API Test');
  console.log('-'.repeat(25));
  
  try {
    const basicRequest = {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'user',
          content: 'What is the current time?'
        }
      ],
      max_tokens: 100
    };
    
    console.log('Request payload:', JSON.stringify(basicRequest, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(basicRequest)
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response status text: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response body:', responseText.substring(0, 500));
    
    if (response.ok) {
      console.log('✅ Basic API test passed!');
      
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed response:', data.choices[0]?.message?.content || 'No content');
      } catch (e) {
        console.log('❌ Failed to parse JSON response');
      }
    } else {
      console.log('❌ Basic API test failed');
      
      // Try to identify the issue
      if (response.status === 401) {
        console.log('💡 Issue: Invalid API key');
      } else if (response.status === 400) {
        console.log('💡 Issue: Invalid request format');
        try {
          const errorData = JSON.parse(responseText);
          console.log('Error details:', errorData);
        } catch (e) {
          console.log('Raw error:', responseText);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  // Test 2: News-specific request
  console.log('\n📰 Test 2: Financial News Request');
  console.log('-'.repeat(30));
  
  try {
    const newsRequest = {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a financial news analyst.'
        },
        {
          role: 'user',
          content: 'Find 2 latest financial news from the past hour. Format as JSON array with headline, source, summary.'
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    };
    
    const newsResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newsRequest)
    });
    
    console.log(`News response status: ${newsResponse.status}`);
    
    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      console.log('✅ News API test passed!');
      console.log('News content sample:', newsData.choices[0]?.message?.content?.substring(0, 200) + '...');
    } else {
      const errorText = await newsResponse.text();
      console.log('❌ News API test failed');
      console.log('Error:', errorText.substring(0, 300));
    }
    
  } catch (error) {
    console.log('❌ News request error:', error.message);
  }
  
  // Test 3: Check API key validity with different approach
  console.log('\n🔑 Test 3: API Key Validation');
  console.log('-'.repeat(25));
  
  try {
    // Try the simplest possible request
    const simpleResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });
    
    if (simpleResponse.status === 401) {
      console.log('❌ API key is invalid');
      console.log('💡 Need to get a new Perplexity API key');
    } else if (simpleResponse.status === 400) {
      const errorBody = await simpleResponse.text();
      console.log('❌ Request format issue');
      console.log('Error details:', errorBody);
    } else if (simpleResponse.ok) {
      console.log('✅ API key is valid');
    }
    
  } catch (error) {
    console.log('❌ Validation error:', error.message);
  }
  
  console.log('\n🎯 DIAGNOSIS & NEXT STEPS:');
  console.log('-'.repeat(30));
  console.log('Based on the test results above:');
  console.log('1. Check if API key is valid and active');
  console.log('2. Verify request format matches Perplexity requirements'); 
  console.log('3. Test with different model if needed');
  console.log('4. Consider fallback to mock data if API unavailable');
}

testPerplexityAPI();