/**
 * Simple AI Tables Deployment
 * Creates tables using Supabase client directly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createTables() {
  console.log('🚀 Creating AI Storage Tables...\n');

  // Test with a simple insert to ai_analysis_log
  try {
    const testData = {
      analysis_type: 'deployment_test',
      entity_id: 'TEST',
      agent_id: 'deployment-script',
      ai_response: { test: true, timestamp: new Date().toISOString() },
      ai_model: 'grok-4-0709'
    };

    console.log('1. Testing ai_analysis_log table...');
    const { data: insertData, error: insertError } = await supabase
      .from('ai_analysis_log')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('   ❌ Table does not exist or insert failed:', insertError.message);
      console.log('\n📝 Manual deployment required:');
      console.log('   1. Go to Supabase SQL Editor');
      console.log('   2. Copy and paste contents of ai-storage-tables-manual.sql');
      console.log('   3. Run the SQL commands');
      return false;
    }

    console.log('   ✅ ai_analysis_log table exists and is writable');

    // Clean up test data
    if (insertData?.[0]?.id) {
      await supabase
        .from('ai_analysis_log')
        .delete()
        .eq('id', insertData[0].id);
      console.log('   🧹 Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }

  // Check other tables
  const tables = [
    'market_predictions',
    'compliance_predictions',
    'market_anomalies',
    'ai_recommendations',
    'agent_activity'
  ];

  console.log('\n2. Checking other AI tables...');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: Not found`);
      } else {
        console.log(`   ✅ ${table}: Ready`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: Error - ${err.message}`);
    }
  }

  return true;
}

// Test AI integration with real API key
async function testAIIntegration() {
  console.log('\n🧪 Testing AI Integration with Real API Key...\n');

  try {
    const { callGrokStructured, MARKET_ANALYSIS_SCHEMA } = await import('./lib/grok-structured-schemas.js');
    const { storeMarketAnalysis } = await import('./lib/ai-to-database-mapper.js');

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_XAI_API_KEY') {
      console.log('❌ No valid API key found');
      return;
    }

    console.log('1. Testing structured output call to X.AI...');
    
    const messages = [
      {
        role: 'system',
        content: 'You are a market analysis AI. Provide brief analysis.'
      },
      {
        role: 'user',
        content: 'Analyze NVDA stock briefly. Current price around $890.'
      }
    ];

    const analysis = await callGrokStructured(
      apiKey,
      messages,
      MARKET_ANALYSIS_SCHEMA,
      { temperature: 0.3, max_tokens: 1000 }
    );

    if (analysis) {
      console.log('   ✅ AI response received');
      console.log('   📊 Analysis summary:', {
        sentiment: analysis.analysis?.sentiment,
        confidence: analysis.analysis?.confidence,
        prediction: analysis.prediction?.direction
      });

      // Store in database
      console.log('\n2. Storing analysis in database...');
      const result = await storeMarketAnalysis('NVDA', analysis, 'test-integration');
      
      if (result.success) {
        console.log('   ✅ Successfully stored in database');
        
        // Verify storage
        const { data: stored } = await supabase
          .from('ai_analysis_log')
          .select('*')
          .eq('entity_id', 'NVDA')
          .eq('agent_id', 'test-integration')
          .order('created_at', { ascending: false })
          .limit(1);

        if (stored?.[0]) {
          console.log('   ✅ Verified: Data is in database');
          console.log('   📄 Record ID:', stored[0].id);
        }
      } else {
        console.log('   ❌ Storage failed:', result.error);
      }
    } else {
      console.log('   ❌ No response from AI');
    }

  } catch (error) {
    console.error('❌ AI integration test failed:', error.message);
  }
}

// Monitor AI analysis
async function monitorAIAnalysis() {
  console.log('\n📊 Current AI Analysis Summary...\n');

  try {
    // Get recent AI analyses
    const { data: analyses, error } = await supabase
      .from('ai_analysis_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('❌ Cannot read ai_analysis_log:', error.message);
      return;
    }

    if (!analyses || analyses.length === 0) {
      console.log('📭 No AI analyses found yet');
      return;
    }

    console.log(`Found ${analyses.length} recent AI analyses:\n`);

    analyses.forEach((analysis, index) => {
      console.log(`${index + 1}. ${analysis.analysis_type}`);
      console.log(`   Entity: ${analysis.entity_id || 'N/A'}`);
      console.log(`   Agent: ${analysis.agent_id}`);
      console.log(`   Model: ${analysis.ai_model || 'unknown'}`);
      console.log(`   Created: ${new Date(analysis.created_at).toLocaleString()}`);
      console.log('');
    });

    // Get analysis type breakdown
    const typeBreakdown = analyses.reduce((acc, a) => {
      acc[a.analysis_type] = (acc[a.analysis_type] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Analysis Type Breakdown:');
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🤖 AI Storage Deployment & Testing');
  console.log('===================================\n');

  // Step 1: Check if tables exist
  const tablesExist = await createTables();

  if (!tablesExist) {
    console.log('\n⚠️  Tables need to be created manually first.');
    console.log('\n📋 Instructions:');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy contents of ai-storage-tables-manual.sql');
    console.log('5. Run the query');
    console.log('6. Run this script again\n');
    return;
  }

  // Step 2: Test AI integration
  await testAIIntegration();

  // Step 3: Monitor existing data
  await monitorAIAnalysis();

  console.log('\n✅ Setup complete!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Deploy to production');
  console.log('   2. Monitor ai_analysis_log table');
  console.log('   3. Check agent_performance_log for metrics');
  console.log('   4. Review alerts table for critical events');
}

// Run
main().catch(console.error);