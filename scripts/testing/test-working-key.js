import { createClient } from '@supabase/supabase-js';

// Use the working key from root .env
const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function testWithWorkingKey() {
  console.log('🔍 TESTING WITH WORKING KEY');
  console.log('============================\n');

  // Test basic connection
  console.log('📡 Testing connection...');
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Connection works - users table found`);
    }
  } catch (e) {
    console.log(`  ❌ Failed: ${e.message}`);
  }

  // Check all tables from the previous verification
  console.log('\n📋 CHECKING ALL TABLES:');
  const expectedTables = [
    'users', 'agents', 'a2a_agents', 'agent_interactions',
    'market_data', 'news_articles', 'news_queries', 
    'knowledge_graph_entities', 'rdf_triples',
    'portfolio_holdings', 'bond_data', 'forex_rates',
    'economic_indicators', 'yield_curve', 'volatility_surface',
    'correlation_matrix', 'user_tasks', 'session_states',
    'price_alerts', 'notifications', 'process_executions',
    'calculation_results', 'risk_parameters', 'audit_logs',
    'security_events', 'api_usage', 'ord_analytics_resources',
    'a2a_analytics_communications', 'prdord_analytics'
  ];

  let existingTables = [];
  let missingTables = [];
  
  for (const table of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`  ✅ ${table} (${count || 0} records)`);
        existingTables.push({ name: table, count: count || 0 });
      } else {
        console.log(`  ❌ ${table} MISSING - ${error.message}`);
        missingTables.push(table);
      }
    } catch (e) {
      console.log(`  ❌ ${table} ERROR - ${e.message}`);
      missingTables.push(table);
    }
  }

  // Check schemas of existing tables
  console.log('\n📊 SCHEMA ANALYSIS:');
  
  for (const table of existingTables) {
    if (table.count > 0) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`  ${table.name}: ${columns.join(', ')}`);
        }
      } catch (e) {
        console.log(`  ${table.name}: Schema check failed`);
      }
    }
  }

  console.log('\n🎯 SUMMARY:');
  console.log(`Existing tables: ${existingTables.length}/${expectedTables.length}`);
  console.log(`Missing tables: ${missingTables.length}`);
  if (missingTables.length > 0) {
    console.log(`Missing: ${missingTables.slice(0, 5).join(', ')}${missingTables.length > 5 ? '...' : ''}`);
  }
}

testWithWorkingKey().catch(console.error);