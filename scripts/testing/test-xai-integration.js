/**
 * Test X.AI Integration with Structured Outputs
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

async function testBasicGrokCall() {
  console.log('🧪 Testing X.AI Grok API...\n');

  // Simple test without structured output first
  const simpleRequest = {
    model: 'grok-4-0709',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Say "Hello World" and nothing else.'
      }
    ],
    temperature: 0.1,
    max_tokens: 10
  };

  try {
    console.log('1. Testing basic API call...');
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(simpleRequest)
    });

    console.log('   Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('   Error response:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('   ✅ Basic call successful!');
    console.log('   Response:', data.choices[0]?.message?.content);

    // Now test structured output
    console.log('\n2. Testing structured output...');
    
    const structuredRequest = {
      model: 'grok-4-0709',
      messages: [
        {
          role: 'system',
          content: 'You are a market analysis assistant.'
        },
        {
          role: 'user',
          content: 'Analyze this: NVDA price is $890, up 5% today.'
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'simple_analysis',
          schema: {
            type: 'object',
            properties: {
              sentiment: {
                type: 'string',
                enum: ['positive', 'negative', 'neutral']
              },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 1
              },
              summary: {
                type: 'string'
              }
            },
            required: ['sentiment', 'confidence', 'summary'],
            additionalProperties: false
          }
        }
      }
    };

    const structuredResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(structuredRequest)
    });

    console.log('   Response status:', structuredResponse.status, structuredResponse.statusText);

    if (!structuredResponse.ok) {
      const errorText = await structuredResponse.text();
      console.log('   Error response:', errorText);
      return false;
    }

    const structuredData = await structuredResponse.json();
    console.log('   ✅ Structured output successful!');
    console.log('   Response:', structuredData.choices[0]?.message?.content);

    return true;

  } catch (error) {
    console.error('❌ API call failed:', error.message);
    return false;
  }
}

async function testWithSupabase() {
  console.log('\n3. Testing Supabase integration...');

  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    // Use the correct Supabase URL and key
    const supabase = createClient(
      'https://fnsbxaywhsxqppncqksu.supabase.co',
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test insert
    const testData = {
      analysis_type: 'xai_integration_test',
      entity_id: 'TEST',
      agent_id: 'test-script',
      ai_model: 'grok-4-0709',
      ai_response: { 
        test: true, 
        timestamp: new Date().toISOString(),
        message: 'X.AI integration successful'
      }
    };

    const { data, error } = await supabase
      .from('ai_analysis_log')
      .insert(testData)
      .select();

    if (error) {
      console.log('   ❌ Supabase insert failed:', error.message);
      return false;
    }

    console.log('   ✅ Supabase insert successful!');
    console.log('   Record ID:', data[0].id);

    // Clean up
    await supabase
      .from('ai_analysis_log')
      .delete()
      .eq('id', data[0].id);
    console.log('   🧹 Test data cleaned up');

    return true;

  } catch (error) {
    console.error('   ❌ Supabase test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🤖 X.AI Integration Test');
  console.log('========================\n');

  if (!GROK_API_KEY || GROK_API_KEY === 'YOUR_XAI_API_KEY') {
    console.error('❌ No valid API key found');
    console.log('   Set GROK_API_KEY or XAI_API_KEY in .env file');
    return;
  }

  console.log('API Key:', GROK_API_KEY.substring(0, 10) + '...' + GROK_API_KEY.slice(-4));

  // Test basic Grok API
  const apiSuccess = await testBasicGrokCall();

  // Test Supabase
  const supabaseSuccess = await testWithSupabase();

  // Summary
  console.log('\n' + '='.repeat(40));
  console.log('📊 Test Summary:');
  console.log(`   X.AI API: ${apiSuccess ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Supabase: ${supabaseSuccess ? '✅ Working' : '❌ Failed'}`);

  if (apiSuccess && supabaseSuccess) {
    console.log('\n🎉 All systems operational!');
    console.log('   Your structured outputs integration is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

main().catch(console.error);