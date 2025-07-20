#!/usr/bin/env node

/**
 * Test if AI is ready for production
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config();

async function testAIReady() {
  console.log('🧪 Testing AI Production Readiness\n');
  
  // Test the news intelligence verification endpoint
  const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
  
  try {
    console.log('Testing news intelligence API...');
    const response = await fetch(`${baseUrl}/api/news-intelligence-verify?action=verify-all`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.summary?.production_ready) {
        console.log('\n🎉 AI Features are READY for production!');
      } else {
        console.log('\n⚠️  Some features need attention:');
        if (data.summary) {
          console.log(`   - Working: ${data.summary.working}`);
          console.log(`   - Degraded: ${data.summary.degraded}`);
          console.log(`   - Failed: ${data.summary.failed}`);
          console.log(`   - Health Score: ${data.summary.health_score}%`);
        }
      }
    } else {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      const error = await response.text();
      console.log(error);
    }
  } catch (error) {
    console.log(`❌ Failed to reach API: ${error.message}`);
    console.log('\nMake sure the server is running:');
    console.log('   npm run dev');
  }
  
  // Test Perplexity API directly
  console.log('\n🧪 Testing Perplexity API...');
  if (process.env.PERPLEXITY_API_KEY) {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        console.log('✅ Perplexity API is working!');
      } else {
        console.log(`❌ Perplexity API error: ${response.status}`);
      }
    } catch (e) {
      console.log(`❌ Perplexity test failed: ${e.message}`);
    }
  }
  
  // Test Grok API
  console.log('\n🧪 Testing Grok API...');
  if (process.env.GROK_API_KEY) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-2',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        console.log('✅ Grok API is working!');
      } else {
        console.log(`❌ Grok API error: ${response.status}`);
      }
    } catch (e) {
      console.log(`❌ Grok test failed: ${e.message}`);
    }
  }
  
  console.log('\n📝 Summary:');
  console.log('1. If server is not running, start it with: npm run dev');
  console.log('2. Deploy to Vercel with environment variables:');
  console.log('   vercel env add PERPLEXITY_API_KEY production');
  console.log('   vercel env add GROK_API_KEY production'); 
  console.log('   vercel env add XAI_API_KEY production');
  console.log('   vercel --prod');
}

testAIReady().catch(console.error);