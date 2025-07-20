import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function debugTables() {
  console.log('🐞 DEBUGGING TABLE STRUCTURES');
  console.log('==============================\n');

  // Test users table with minimal data
  console.log('👤 1. Testing USERS table...');
  try {
    const { error } = await supabase
      .from('users')
      .insert({
        email: 'debug@test.com'
      });
    
    if (error) {
      console.log(`  ❌ Users error: ${error.message}`);
      console.log(`  🔍 This tells us about the users table structure`);
    } else {
      console.log(`  ✅ Users insertion worked`);
      await supabase.from('users').delete().eq('email', 'debug@test.com');
    }
  } catch (e) {
    console.log(`  ❌ Users exception: ${e.message}`);
  }

  // Test market_data table
  console.log('\n📊 2. Testing MARKET_DATA table...');
  try {
    const { error } = await supabase
      .from('market_data')
      .insert({
        symbol: 'DEBUG_TEST'
      });
    
    if (error) {
      console.log(`  ❌ Market_data error: ${error.message}`);
      console.log(`  🔍 This tells us about required columns`);
    } else {
      console.log(`  ✅ Market_data insertion worked`);
      await supabase.from('market_data').delete().eq('symbol', 'DEBUG_TEST');
    }
  } catch (e) {
    console.log(`  ❌ Market_data exception: ${e.message}`);
  }

  // Test news_articles table  
  console.log('\n📰 3. Testing NEWS_ARTICLES table...');
  try {
    const { error } = await supabase
      .from('news_articles')
      .insert({
        title: 'Debug Test'
      });
    
    if (error) {
      console.log(`  ❌ News_articles error: ${error.message}`);
      console.log(`  🔍 This tells us about required columns`);
    } else {
      console.log(`  ✅ News_articles insertion worked`);
      await supabase.from('news_articles').delete().eq('title', 'Debug Test');
    }
  } catch (e) {
    console.log(`  ❌ News_articles exception: ${e.message}`);
  }

  // Get actual table descriptions using SQL
  console.log('\n🏗️  4. Getting table structures via SQL...');
  try {
    // Try to get column info for users table
    const { data: usersCols, error: usersError } = await supabase.rpc('get_columns', { table_name: 'users' });
    if (usersError) {
      console.log(`  Users columns query failed: ${usersError.message}`);
    } else if (usersCols) {
      console.log(`  Users columns: ${usersCols.map(c => c.column_name).join(', ')}`);
    }
  } catch (e) {
    console.log(`  SQL query failed: ${e.message}`);
  }

  // Check if we can see any sample data from existing tables
  console.log('\n📋 5. Checking existing data...');
  
  // Check a2a_agents which we know has data
  try {
    const { data } = await supabase
      .from('a2a_agents')
      .select('agent_id, name, type, voting_power')
      .limit(1);
    
    if (data && data.length > 0) {
      console.log(`  ✅ A2A agents sample:`, data[0]);
    }
  } catch (e) {
    console.log(`  A2A agents check failed: ${e.message}`);
  }

  // Check news_articles which we know has data
  try {
    const { data } = await supabase
      .from('news_articles')
      .select('id, title, symbols, keywords')
      .limit(1);
    
    if (data && data.length > 0) {
      console.log(`  ✅ News articles sample:`, data[0]);
    }
  } catch (e) {
    console.log(`  News articles check failed: ${e.message}`);
  }
}

debugTables().catch(console.error);