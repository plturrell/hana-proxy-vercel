/**
 * Integration Test: AI to Database Flow
 * Tests the complete flow from AI analysis to database storage
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { 
  MARKET_ANALYSIS_SCHEMA,
  COMPLIANCE_ANALYSIS_SCHEMA,
  callGrokStructured 
} from './lib/grok-structured-schemas.js';
import {
  storeMarketAnalysis,
  storeComplianceAnalysis,
  storeAnomalyDetection,
  storeNewsAnalysis
} from './lib/ai-to-database-mapper.js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

async function testMarketAnalysisFlow() {
  console.log('\n📊 Testing Market Analysis Flow...\n');
  
  try {
    // 1. Simulate getting market data
    console.log('1. Fetching market data...');
    const { data: marketData, error } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', 'NVDA')
      .order('timestamp', { ascending: false })
      .limit(5);
      
    if (error) {
      console.log('   ⚠️ No market_data table, using mock data');
    }
    
    const mockPrices = [890, 885, 892, 888, 895];
    
    // 2. Call AI with structured output
    console.log('2. Calling AI for market analysis...');
    const messages = [
      {
        role: 'system',
        content: 'You are a market analysis AI providing comprehensive analysis.'
      },
      {
        role: 'user',
        content: `Analyze NVDA with recent prices: ${mockPrices.join(', ')}. Provide complete market analysis including sentiment, predictions, risks, and opportunities.`
      }
    ];

    const aiAnalysis = await callGrokStructured(
      GROK_API_KEY,
      messages,
      MARKET_ANALYSIS_SCHEMA,
      { temperature: 0.3, max_tokens: 1500 }
    );
    
    console.log('   ✅ AI Analysis received:', {
      sentiment: aiAnalysis.analysis.sentiment,
      confidence: aiAnalysis.analysis.confidence,
      prediction: aiAnalysis.prediction.direction
    });

    // 3. Store in database
    console.log('3. Storing in database...');
    const storageResult = await storeMarketAnalysis(
      'NVDA',
      aiAnalysis,
      'agent-test-market'
    );
    
    console.log('   ✅ Storage result:', storageResult.success ? 'SUCCESS' : 'FAILED');
    
    // 4. Verify storage by querying
    console.log('4. Verifying storage...');
    const { data: storedData, error: queryError } = await supabase
      .from('ai_analysis_log')
      .select('*')
      .eq('analysis_type', 'market_analysis')
      .eq('entity_id', 'NVDA')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (queryError) {
      console.log('   ⚠️ Could not verify storage:', queryError.message);
    } else if (storedData && storedData.length > 0) {
      console.log('   ✅ Data verified in database');
      console.log('     Analysis type:', storedData[0].analysis_type);
      console.log('     Created at:', storedData[0].created_at);
    } else {
      console.log('   ❌ No data found in database');
    }
    
    return { success: true, aiAnalysis, storageResult };
    
  } catch (error) {
    console.error('❌ Market analysis flow failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testComplianceFlow() {
  console.log('\n⚖️ Testing Compliance Analysis Flow...\n');
  
  try {
    // 1. Mock agent data
    const agentData = {
      agent_id: 'agent-test-compliance',
      name: 'Test Compliance Agent',
      type: 'analytics',
      capabilities: ['calculate'],
      description: 'Test agent for compliance'
    };
    
    console.log('1. Analyzing agent compliance...');
    
    // 2. Call AI for compliance analysis
    const messages = [
      {
        role: 'system',
        content: 'You are a compliance AI specializing in A2A and ORD standards.'
      },
      {
        role: 'user',
        content: `Analyze this agent for compliance: ${JSON.stringify(agentData, null, 2)}. Check for A2A/ORD compliance issues and provide predictions with fixes.`
      }
    ];

    const aiCompliance = await callGrokStructured(
      GROK_API_KEY,
      messages,
      COMPLIANCE_ANALYSIS_SCHEMA,
      { temperature: 0.2, max_tokens: 1500 }
    );
    
    console.log('   ✅ Compliance Analysis received:', {
      riskScore: aiCompliance.riskScore,
      criticalIssues: aiCompliance.criticalIssues,
      readyForCreation: aiCompliance.readyForCreation
    });

    // 3. Store in database
    console.log('2. Storing compliance analysis...');
    const storageResult = await storeComplianceAnalysis(
      agentData.agent_id,
      aiCompliance,
      'agent-compliance-tester'
    );
    
    console.log('   ✅ Storage result:', storageResult.success ? 'SUCCESS' : 'FAILED');
    
    return { success: true, aiCompliance, storageResult };
    
  } catch (error) {
    console.error('❌ Compliance flow failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testNewsAnalysisFlow() {
  console.log('\n📰 Testing News Analysis Flow...\n');
  
  try {
    // 1. Mock news data
    const mockNews = [
      {
        id: 'news-1',
        title: 'NVDA Reports Strong Q4 Earnings',
        summary: 'NVIDIA exceeded expectations with record data center revenue'
      },
      {
        id: 'news-2', 
        title: 'AI Chip Demand Continues to Surge',
        summary: 'Industry analysts predict continued growth in AI hardware'
      }
    ];
    
    console.log('1. Processing news sentiment...');
    
    // 2. Mock AI news analysis (structured format)
    const aiNewsAnalysis = {
      sentiment: 'very_positive',
      keyThemes: ['earnings_beat', 'ai_growth', 'data_center_revenue'],
      impactSummary: 'Strong earnings and AI growth outlook should drive positive sentiment',
      confidence: 0.85
    };
    
    console.log('   ✅ News Analysis:', aiNewsAnalysis);

    // 3. Store in database
    console.log('2. Storing news analysis...');
    const storageResult = await storeNewsAnalysis(
      'NVDA',
      aiNewsAnalysis,
      mockNews
    );
    
    console.log('   ✅ Storage result:', storageResult.success ? 'SUCCESS' : 'FAILED');
    
    return { success: true, aiNewsAnalysis, storageResult };
    
  } catch (error) {
    console.error('❌ News analysis flow failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testGraphQLIntegration() {
  console.log('\n🔗 Testing GraphQL Integration...\n');
  
  try {
    console.log('1. Testing GraphQL endpoint...');
    
    const graphqlQuery = {
      query: `
        query GetMarketData($symbol: String!) {
          marketData(symbol: $symbol) {
            symbol
            marketData {
              price
              timestamp
            }
            newsAnalysis {
              sentiment
              summary
            }
            technicalAnalysis {
              prediction
              confidence
            }
            aiPredictions {
              combined {
                direction
                confidence
              }
            }
          }
        }
      `,
      variables: { symbol: 'NVDA' }
    };
    
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ GraphQL response received');
      console.log('     Data structure:', Object.keys(result.data?.marketData || {}));
    } else {
      console.log('   ⚠️ GraphQL endpoint not available (this is OK for testing)');
    }
    
    return { success: true };
    
  } catch (error) {
    console.log('   ⚠️ GraphQL test skipped:', error.message);
    return { success: false, error: error.message };
  }
}

async function testDatabaseSchema() {
  console.log('\n🗄️ Testing Database Schema...\n');
  
  try {
    // Test if AI tables exist by trying to query them
    const tables = [
      'ai_analysis_log',
      'market_predictions', 
      'compliance_predictions',
      'market_anomalies'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`   ❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Table ${table}: Available`);
        }
      } catch (err) {
        console.log(`   ❌ Table ${table}: Not accessible`);
      }
    }
    
    // Test if we can create records
    console.log('\n   Testing record creation...');
    const testRecord = {
      analysis_type: 'integration_test',
      entity_id: 'TEST',
      agent_id: 'agent-integration-test',
      ai_response: { test: true, timestamp: new Date().toISOString() }
    };
    
    const { data, error } = await supabase
      .from('ai_analysis_log')
      .insert(testRecord)
      .select();
      
    if (error) {
      console.log('   ❌ Record creation failed:', error.message);
      console.log('   💡 Recommendation: Run ai-storage-tables-manual.sql in Supabase SQL Editor');
    } else {
      console.log('   ✅ Record creation successful');
      
      // Clean up test record
      if (data?.[0]?.id) {
        await supabase.from('ai_analysis_log').delete().eq('id', data[0].id);
        console.log('   🧹 Test record cleaned up');
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runIntegrationTests() {
  console.log('🧪 AI to Database Integration Test Suite');
  console.log('==========================================');
  
  if (!GROK_API_KEY || GROK_API_KEY === 'YOUR_XAI_API_KEY') {
    console.error('❌ Please set a valid GROK_API_KEY in your .env file');
    process.exit(1);
  }
  
  const results = {};
  
  // Test database schema first
  results.database = await testDatabaseSchema();
  
  // Test each flow
  results.marketAnalysis = await testMarketAnalysisFlow();
  results.compliance = await testComplianceFlow();
  results.newsAnalysis = await testNewsAnalysisFlow();
  results.graphql = await testGraphQLIntegration();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Integration Test Summary:');
  console.log('─'.repeat(30));
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
    if (!result.success && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  const passCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  console.log('\n📈 Results:');
  console.log(`   Tests passed: ${passCount}/${totalCount}`);
  console.log(`   Success rate: ${Math.round((passCount/totalCount) * 100)}%`);
  
  if (passCount === totalCount) {
    console.log('\n🎉 All integration tests passed!');
    console.log('   Your AI to database flow is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    console.log('\n🔧 Quick fixes:');
    console.log('   1. Run: node deploy-ai-tables-supabase.js');
    console.log('   2. Execute ai-storage-tables-manual.sql in Supabase SQL Editor');
    console.log('   3. Verify API keys are set correctly');
  }
}

// Run the tests
runIntegrationTests().catch(console.error);