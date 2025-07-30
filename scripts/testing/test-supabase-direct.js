#!/usr/bin/env node
/**
 * Direct Supabase Connection Test
 * Tests database connection without agent dependency
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

async function testSupabaseConnection() {
  console.log('🔌 Testing Direct Supabase Connection');
  console.log('='.repeat(50));
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    console.log('📋 Environment Check:');
    console.log(`   SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
    console.log(`   SUPABASE_SERVICE_KEY: ${supabaseKey ? 'SET (length: ' + supabaseKey.length + ')' : 'MISSING'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing required environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Simple table query
    console.log('\n📋 TEST 1: Basic Table Query');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (tablesError) {
      console.log('❌ Database connection failed:', tablesError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log(`   Found ${tables.length} tables`);
    
    // Test 2: Check for a2a_agents table
    console.log('\n📋 TEST 2: A2A Agents Table');
    const { data: agentsTable, error: agentsError } = await supabase
      .from('a2a_agents')
      .select('count')
      .limit(1);
    
    if (agentsError) {
      console.log('❌ a2a_agents table not found:', agentsError.message);
      console.log('💡 Run: supabase db push');
    } else {
      console.log('✅ a2a_agents table exists');
      
      // Test 3: Count agents
      const { data: agentCount, error: countError } = await supabase
        .from('a2a_agents')
        .select('agent_id')
        .limit(100);
      
      if (!countError) {
        console.log(`   Total agents: ${agentCount.length}`);
        
        // Check for news intelligence agent
        const newsAgent = agentCount.find(a => a.agent_id === 'finsight.data.news_intelligence');
        console.log(`   News Intelligence Agent: ${newsAgent ? 'FOUND' : 'NOT FOUND'}`);
        
        const marketAgent = agentCount.find(a => a.agent_id === 'finsight.data.market_data');
        console.log(`   Market Data Agent: ${marketAgent ? 'FOUND' : 'NOT FOUND'}`);
      }
    }
    
    // Test 4: Check ORD table
    console.log('\n📋 TEST 3: ORD Analytics Resources');
    const { data: ordTable, error: ordError } = await supabase
      .from('ord_analytics_resources')
      .select('count')
      .limit(1);
    
    if (ordError) {
      console.log('❌ ord_analytics_resources table not found:', ordError.message);
    } else {
      console.log('✅ ord_analytics_resources table exists');
    }
    
    // Test 5: Check news_articles table
    console.log('\n📋 TEST 4: News Articles Table');
    const { data: newsTable, error: newsError } = await supabase
      .from('news_articles')
      .select('count')
      .limit(1);
    
    if (newsError) {
      console.log('❌ news_articles table not found:', newsError.message);
    } else {
      console.log('✅ news_articles table exists');
    }
    
    // Test 6: Check market_data table
    console.log('\n📋 TEST 5: Market Data Table');
    const { data: marketTable, error: marketError } = await supabase
      .from('market_data')
      .select('count')
      .limit(1);
    
    if (marketError) {
      console.log('❌ market_data table not found:', marketError.message);
    } else {
      console.log('✅ market_data table exists');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 CONNECTION TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Execute test
testSupabaseConnection().then(() => {
  console.log('\n✅ Test execution completed.');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});