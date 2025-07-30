/**
 * Database-Only Integration Test
 * Tests database storage without requiring API keys
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  storeMarketAnalysis,
  storeComplianceAnalysis,
  storeAnomalyDetection,
  storeNewsAnalysis
} from './lib/ai-to-database-mapper.js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testDatabaseSchema() {
  console.log('🗄️ Testing Database Schema...\n');
  
  try {
    // Test if AI tables exist by trying to query them
    const tables = [
      'ai_analysis_log',
      'market_predictions', 
      'compliance_predictions',
      'market_anomalies'
    ];
    
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          results[table] = { status: 'error', message: error.message };
        } else {
          results[table] = { status: 'available', count: data?.length || 0 };
        }
      } catch (err) {
        results[table] = { status: 'not_accessible', message: err.message };
      }
    }
    
    console.log('📊 Table Status:');
    Object.entries(results).forEach(([table, result]) => {
      const icon = result.status === 'available' ? '✅' : '❌';
      console.log(`   ${icon} ${table}: ${result.status}`);
      if (result.message) {
        console.log(`      ${result.message}`);
      }
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error.message);
    return { error: error.message };
  }
}

async function testStorageFunctions() {
  console.log('\n💾 Testing Storage Functions...\n');
  
  // Mock AI analysis data that matches our schemas
  const mockMarketAnalysis = {
    analysis: {
      sentiment: 'bullish',
      confidence: 0.75,
      keyFactors: ['positive_earnings', 'strong_guidance']
    },
    technicalIndicators: {
      rsi: 65,
      sma20: 180,
      sma50: 175,
      trend: 'uptrend'
    },
    prediction: {
      direction: 'up',
      confidence: 0.8,
      timeframe: '1d'
    },
    risks: [
      {
        type: 'market_volatility',
        severity: 'medium',
        description: 'General market uncertainty'
      }
    ],
    opportunities: [
      {
        type: 'earnings_momentum',
        potential: 'high',
        description: 'Continued earnings growth expected'
      }
    ]
  };
  
  const mockComplianceAnalysis = {
    predictions: [
      {
        issue: 'Missing input schema',
        field: 'inputSchema',
        severity: 'medium',
        likelihood: 0.9,
        impact: 'Reduced interoperability',
        preemptiveFix: { inputSchema: { type: 'object' } }
      }
    ],
    autoFixable: {
      inputSchema: { type: 'object', properties: {} }
    },
    riskScore: 45,
    readyForCreation: false,
    criticalIssues: 0,
    aiRecommendation: 'Add missing schema definitions'
  };
  
  const mockAnomalyDetection = {
    anomalies_detected: [
      {
        type: 'volume',
        severity: 'high',
        confidence: 0.85,
        description: 'Unusual volume spike detected',
        current_value: 1500000,
        expected_range: [500000, 1000000],
        z_score: 2.5,
        trading_implications: {
          direction: 'bullish',
          suggested_action: 'monitor',
          risk_level: 'medium'
        }
      }
    ],
    pattern_analysis: {
      chart_patterns: ['breakout'],
      trend_analysis: {
        current_trend: 'uptrend',
        trend_strength: 0.7
      }
    },
    volume_profile: {
      institutional_activity: 'accumulation'
    },
    risk_assessment: {
      overall_risk: 'medium',
      black_swan_probability: 0.05
    },
    ai_recommendations: [
      {
        action: 'increase_position',
        confidence: 0.7,
        reasoning: 'Strong volume indicates institutional interest'
      }
    ]
  };
  
  const mockNewsAnalysis = {
    sentiment: 'positive',
    keyThemes: ['earnings_beat', 'guidance_raise'],
    impactSummary: 'Strong quarterly results with positive outlook',
    confidence: 0.85
  };
  
  const mockNewsArticles = [
    {
      id: 'news-1',
      title: 'Company Reports Strong Q4',
      summary: 'Earnings exceeded expectations'
    }
  ];
  
  const results = {};
  
  // Test market analysis storage
  console.log('1. Testing market analysis storage...');
  try {
    const result = await storeMarketAnalysis('TEST', mockMarketAnalysis, 'agent-test');
    results.marketAnalysis = result;
    console.log(`   ${result.success ? '✅' : '❌'} Market analysis: ${result.success ? 'SUCCESS' : result.error}`);
  } catch (error) {
    results.marketAnalysis = { success: false, error: error.message };
    console.log(`   ❌ Market analysis: ${error.message}`);
  }
  
  // Test compliance analysis storage
  console.log('2. Testing compliance analysis storage...');
  try {
    const result = await storeComplianceAnalysis('test-resource', mockComplianceAnalysis, 'agent-test');
    results.complianceAnalysis = result;
    console.log(`   ${result.success ? '✅' : '❌'} Compliance analysis: ${result.success ? 'SUCCESS' : result.error}`);
  } catch (error) {
    results.complianceAnalysis = { success: false, error: error.message };
    console.log(`   ❌ Compliance analysis: ${error.message}`);
  }
  
  // Test anomaly detection storage
  console.log('3. Testing anomaly detection storage...');
  try {
    const result = await storeAnomalyDetection('TEST', mockAnomalyDetection, 'agent-test');
    results.anomalyDetection = result;
    console.log(`   ${result.success ? '✅' : '❌'} Anomaly detection: ${result.success ? 'SUCCESS' : result.error}`);
  } catch (error) {
    results.anomalyDetection = { success: false, error: error.message };
    console.log(`   ❌ Anomaly detection: ${error.message}`);
  }
  
  // Test news analysis storage
  console.log('4. Testing news analysis storage...');
  try {
    const result = await storeNewsAnalysis('TEST', mockNewsAnalysis, mockNewsArticles);
    results.newsAnalysis = result;
    console.log(`   ${result.success ? '✅' : '❌'} News analysis: ${result.success ? 'SUCCESS' : result.error}`);
  } catch (error) {
    results.newsAnalysis = { success: false, error: error.message };
    console.log(`   ❌ News analysis: ${error.message}`);
  }
  
  return results;
}

async function testDataRetrieval() {
  console.log('\n🔍 Testing Data Retrieval...\n');
  
  try {
    // Test querying stored data
    const { data: analysisLog, error: logError } = await supabase
      .from('ai_analysis_log')
      .select('*')
      .eq('entity_id', 'TEST')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (logError) {
      console.log('❌ Analysis log query failed:', logError.message);
    } else {
      console.log(`✅ Analysis log: Found ${analysisLog?.length || 0} records`);
      if (analysisLog && analysisLog.length > 0) {
        console.log('   Latest entry:', {
          type: analysisLog[0].analysis_type,
          agent: analysisLog[0].agent_id,
          created: analysisLog[0].created_at
        });
      }
    }
    
    // Test if we can query with views
    const { data: predictions, error: predError } = await supabase
      .from('latest_market_predictions')
      .select('*')
      .eq('symbol', 'TEST');
      
    if (predError) {
      console.log('❌ Predictions view query failed:', predError.message);
    } else {
      console.log(`✅ Predictions view: Found ${predictions?.length || 0} records`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Data retrieval failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...\n');
  
  try {
    // Clean up test records
    const cleanupOperations = [
      supabase.from('ai_analysis_log').delete().eq('entity_id', 'TEST'),
      supabase.from('ai_analysis_log').delete().eq('agent_id', 'agent-test')
    ];
    
    const results = await Promise.allSettled(cleanupOperations);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Cleanup completed: ${successCount}/${results.length} operations succeeded`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runDatabaseTests() {
  console.log('🧪 Database Integration Test Suite');
  console.log('===================================');
  
  const results = {};
  
  // Test database schema
  results.schema = await testDatabaseSchema();
  
  // Test storage functions
  results.storage = await testStorageFunctions();
  
  // Test data retrieval
  results.retrieval = await testDataRetrieval();
  
  // Cleanup test data
  await cleanupTestData();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Database Test Summary:');
  console.log('─'.repeat(30));
  
  const schemaOk = Object.values(results.schema).some(r => r.status === 'available');
  const storageOk = Object.values(results.storage).some(r => r.success);
  const retrievalOk = results.retrieval.success;
  
  console.log(`${schemaOk ? '✅' : '❌'} Database Schema`);
  console.log(`${storageOk ? '✅' : '❌'} Storage Functions`);
  console.log(`${retrievalOk ? '✅' : '❌'} Data Retrieval`);
  
  if (schemaOk && storageOk && retrievalOk) {
    console.log('\n🎉 Database integration is working!');
    console.log('   Your AI structured outputs can be stored and retrieved.');
  } else {
    console.log('\n⚠️  Some database operations failed.');
    console.log('\n🔧 Next steps:');
    console.log('   1. Run the SQL migration: ai-storage-tables-manual.sql');
    console.log('   2. Check Supabase permissions');
    console.log('   3. Verify table creation in Supabase dashboard');
  }
  
  return {
    schema: schemaOk,
    storage: storageOk,
    retrieval: retrievalOk
  };
}

// Run the tests
runDatabaseTests().catch(console.error);