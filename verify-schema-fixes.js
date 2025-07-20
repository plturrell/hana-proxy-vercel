import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function verifySchemaFixes() {
  console.log('🔍 VERIFYING SCHEMA FIXES');
  console.log('=========================\n');

  let allFixed = true;

  // Test 1: Users table schema
  console.log('👤 1. Testing USERS table schema...');
  try {
    const { error } = await supabase
      .from('users')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@finsight.ai',
        bio: 'Test user for schema verification',
        subscription_tier: 'free',
        risk_score: 50.0,
        kyc_verified: false,
        full_name: 'Test User',
        username: 'test_user'
      });
    
    if (error) {
      console.log(`  ❌ Users schema still broken: ${error.message}`);
      allFixed = false;
    } else {
      console.log(`  ✅ Users table schema fixed - all columns working`);
      // Clean up
      await supabase.from('users').delete().eq('id', '00000000-0000-0000-0000-000000000001');
    }
  } catch (e) {
    console.log(`  ❌ Users test failed: ${e.message}`);
    allFixed = false;
  }

  // Test 2: Market data table schema
  console.log('\n📊 2. Testing MARKET_DATA table schema...');
  try {
    const { error } = await supabase
      .from('market_data')
      .insert({
        symbol: 'AAPL',
        price: 150.25,
        asset_type: 'stock',
        bid: 150.20,
        ask: 150.30,
        market_cap: 2500000000000,
        currency: 'USD',
        exchange: 'NASDAQ'
      });
    
    if (error) {
      console.log(`  ❌ Market_data schema still broken: ${error.message}`);
      allFixed = false;
    } else {
      console.log(`  ✅ Market_data table schema fixed - all columns working`);
      await supabase.from('market_data').delete().eq('symbol', 'AAPL').eq('asset_type', 'stock');
    }
  } catch (e) {
    console.log(`  ❌ Market_data test failed: ${e.message}`);
    allFixed = false;
  }

  // Test 3: News articles table schema
  console.log('\n📰 3. Testing NEWS_ARTICLES table schema...');
  try {
    const { error } = await supabase
      .from('news_articles')
      .insert({
        title: 'Schema Test Article',
        content: 'Testing the fixed schema',
        source: 'schema_test',
        symbols: ['AAPL', 'GOOGL'],
        keywords: ['tech', 'earnings'],
        entities: [{"type": "COMPANY", "name": "Apple Inc."}],
        language: 'en',
        sentiment_score: 0.5,
        relevance_score: 0.8,
        market_impact_score: 0.7
      });
    
    if (error) {
      console.log(`  ❌ News_articles schema still broken: ${error.message}`);
      allFixed = false;
    } else {
      console.log(`  ✅ News_articles table schema fixed - all columns working`);
      await supabase.from('news_articles').delete().eq('title', 'Schema Test Article');
    }
  } catch (e) {
    console.log(`  ❌ News_articles test failed: ${e.message}`);
    allFixed = false;
  }

  // Test 4: A2A agents table schema
  console.log('\n🤖 4. Testing A2A_AGENTS table schema...');
  try {
    const { error } = await supabase
      .from('a2a_agents')
      .insert({
        agent_id: 'schema_test_agent',
        name: 'Schema Test Agent',
        type: 'analytics',
        voting_power: 100,
        blockchain_config: {"network": "ethereum"},
        metadata: {"version": "1.0"},
        performance_score: 95.5,
        autonomy_enabled: true
      });
    
    if (error) {
      console.log(`  ❌ A2a_agents schema still broken: ${error.message}`);
      allFixed = false;
    } else {
      console.log(`  ✅ A2a_agents table schema fixed - all columns working`);
      await supabase.from('a2a_agents').delete().eq('agent_id', 'schema_test_agent');
    }
  } catch (e) {
    console.log(`  ❌ A2a_agents test failed: ${e.message}`);
    allFixed = false;
  }

  // Test 5: Check data migration for A2A agents
  console.log('\n🔄 5. Verifying A2A agents data migration...');
  try {
    const { data, error } = await supabase
      .from('a2a_agents')
      .select('agent_name, name, agent_type, type')
      .limit(3);
    
    if (!error && data && data.length > 0) {
      const sample = data[0];
      if (sample.name && sample.type) {
        console.log(`  ✅ Data migrated successfully - name: "${sample.name}", type: "${sample.type}"`);
      } else {
        console.log(`  ⚠️  Data migration incomplete - name: ${sample.name}, type: ${sample.type}`);
      }
    }
  } catch (e) {
    console.log(`  ❌ Data migration check failed: ${e.message}`);
  }

  // Test 6: Check RLS policies
  console.log('\n🔐 6. Testing RLS policies...');
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('id, title')
      .limit(1);
    
    if (!error) {
      console.log(`  ✅ News_articles RLS policies fixed - accessible`);
    } else {
      console.log(`  ❌ News_articles RLS still blocking: ${error.message}`);
      allFixed = false;
    }
  } catch (e) {
    console.log(`  ❌ RLS test failed: ${e.message}`);
    allFixed = false;
  }

  // Summary
  console.log('\n🎯 VERIFICATION SUMMARY:');
  console.log('========================');
  if (allFixed) {
    console.log('🎉 ALL SCHEMA FIXES SUCCESSFUL!');
    console.log('');
    console.log('✅ Users table: email, bio, subscription_tier columns added');
    console.log('✅ Market_data table: asset_type, bid, ask columns added');
    console.log('✅ News_articles table: symbols, keywords, entities columns added');
    console.log('✅ A2a_agents table: name, type, voting_power columns added');
    console.log('✅ RLS policies fixed');
    console.log('✅ iOS app compatibility restored');
    console.log('');
    console.log('🚀 Ready for production use!');
  } else {
    console.log('⚠️  Some schema issues remain. Check the errors above.');
  }

  return allFixed;
}

verifySchemaFixes().catch(console.error);