import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function analyzeSchemas() {
  console.log('🔍 DETAILED SCHEMA ANALYSIS');
  console.log('============================\n');

  // 1. Analyze users table schema
  console.log('👤 USERS TABLE:');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (!error) {
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`  Current columns: ${columns.join(', ')}`);
        
        const expectedUserCols = ['email', 'bio', 'subscription_tier', 'risk_score', 'kyc_verified'];
        const missing = expectedUserCols.filter(col => !columns.includes(col));
        if (missing.length > 0) {
          console.log(`  ❌ Missing: ${missing.join(', ')}`);
        } else {
          console.log(`  ✅ All expected columns present`);
        }
      } else {
        console.log(`  ⚠️ Table exists but empty - trying to get schema info`);
        // Try to insert sample data to test schema
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            email: 'test@example.com',
            bio: 'test bio'
          });
        
        if (insertError) {
          console.log(`  Schema test failed: ${insertError.message}`);
        } else {
          console.log(`  ✅ Schema supports email and bio`);
          // Clean up
          await supabase.from('users').delete().eq('email', 'test@example.com');
        }
      }
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }

  // 2. Analyze market_data table schema
  console.log('\n📊 MARKET_DATA TABLE:');
  try {
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .limit(1);
    
    if (!error) {
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`  Current columns: ${columns.join(', ')}`);
        
        const expectedMarketCols = ['asset_type', 'bid', 'ask', 'market_cap', 'currency'];
        const missing = expectedMarketCols.filter(col => !columns.includes(col));
        if (missing.length > 0) {
          console.log(`  ❌ Missing: ${missing.join(', ')}`);
        } else {
          console.log(`  ✅ All expected columns present`);
        }
      } else {
        console.log(`  ⚠️ Table exists but empty - trying schema test`);
        const { error: insertError } = await supabase
          .from('market_data')
          .insert({
            symbol: 'TEST',
            price: 100.00,
            asset_type: 'stock'
          });
        
        if (insertError) {
          console.log(`  Schema test failed: ${insertError.message}`);
        } else {
          console.log(`  ✅ Schema supports basic market data`);
          await supabase.from('market_data').delete().eq('symbol', 'TEST');
        }
      }
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }

  // 3. Analyze news_articles schema
  console.log('\n📰 NEWS_ARTICLES TABLE:');
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .limit(1);
    
    if (!error && data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`  Current columns: ${columns.join(', ')}`);
      
      const expectedNewsCols = ['symbols', 'keywords', 'entities', 'language'];
      const missing = expectedNewsCols.filter(col => !columns.includes(col));
      if (missing.length > 0) {
        console.log(`  ❌ Missing: ${missing.join(', ')}`);
      } else {
        console.log(`  ✅ All expected columns present`);
      }
      
      // Test RLS
      console.log(`  Sample data: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }

  // 4. Analyze a2a_agents schema  
  console.log('\n🤖 A2A_AGENTS TABLE:');
  try {
    const { data, error } = await supabase
      .from('a2a_agents')
      .select('*')
      .limit(1);
    
    if (!error && data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`  Current columns: ${columns.join(', ')}`);
      
      const expectedA2ACols = ['name', 'type', 'voting_power', 'blockchain_config', 'metadata'];
      const missing = expectedA2ACols.filter(col => !columns.includes(col));
      if (missing.length > 0) {
        console.log(`  ❌ Missing: ${missing.join(', ')}`);
      } else {
        console.log(`  ✅ All expected columns present`);
      }
      
      console.log(`  Sample record: ${JSON.stringify(data[0], null, 2).substring(0, 300)}...`);
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }

  // 5. Check if tables have data but wrong structure
  console.log('\n📈 DATA VERIFICATION:');
  const tablesToCheck = ['users', 'market_data', 'news_articles', 'a2a_agents'];
  
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`  ${table}: ${count || 0} records`);
      }
    } catch (e) {
      console.log(`  ${table}: Error getting count`);
    }
  }
}

analyzeSchemas().catch(console.error);