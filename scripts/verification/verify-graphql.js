import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function verifyGraphQL() {
  console.log('🔍 VERIFYING GRAPHQL IMPLEMENTATION');
  console.log('===================================\n');

  // Check for expected GraphQL views from the migration
  const expectedViews = [
    'gql_users',
    'gql_market_data', 
    'gql_news_articles',
    'gql_portfolios',
    'gql_watchlists',
    'gql_price_alerts',
    'gql_trading_strategies',
    'gql_portfolio_holdings',
    'gql_transactions',
    'gql_user_connections'
  ];

  console.log('📊 Checking GraphQL Views:');
  for (const viewName of expectedViews) {
    try {
      const { count, error } = await supabase
        .from(viewName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`  ✅ ${viewName}: EXISTS (${count} records)`);
      } else {
        console.log(`  ❌ ${viewName}: ${error.message}`);
      }
    } catch (e) {
      console.log(`  ❌ ${viewName}: ERROR`);
    }
  }

  // Check for GraphQL functions
  console.log('\n⚡ Checking GraphQL Functions:');
  const expectedFunctions = [
    { name: 'gql_create_user', params: { p_username: 'test', p_email: 'test@example.com', p_full_name: 'Test' } },
    { name: 'gql_update_user', params: { p_user_id: '00000000-0000-0000-0000-000000000000', p_username: 'test' } },
    { name: 'gql_delete_user', params: { p_user_id: '00000000-0000-0000-0000-000000000000' } }
  ];

  for (const func of expectedFunctions) {
    try {
      // Just check if function exists by getting its definition
      const { data, error } = await supabase.rpc('sql_safe', {
        query_text: `SELECT proname FROM pg_proc WHERE proname = '${func.name}' AND pronamespace = 'public'::regnamespace`
      });
      
      if (!error && data?.[0]?.result?.length > 0) {
        console.log(`  ✅ ${func.name}: EXISTS`);
      } else {
        console.log(`  ❌ ${func.name}: NOT FOUND`);
      }
    } catch (e) {
      console.log(`  ❌ ${func.name}: ERROR`);
    }
  }

  // Check what we actually have
  console.log('\n📋 ACTUAL GRAPHQL OBJECTS:');
  
  // Get all gql_ views
  const { data: viewsData } = await supabase.rpc('sql_safe', {
    query_text: "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'gql_%' ORDER BY table_name"
  });
  
  if (viewsData?.[0]?.result) {
    console.log('\nViews found:');
    viewsData[0].result.forEach(v => console.log(`  • ${v.table_name}`));
  }

  // Get all gql_ functions
  const { data: funcsData } = await supabase.rpc('sql_safe', {
    query_text: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'gql_%' ORDER BY routine_name"
  });
  
  if (funcsData?.[0]?.result) {
    console.log('\nFunctions found:');
    funcsData[0].result.forEach(f => console.log(`  • ${f.routine_name}`));
  }
}

verifyGraphQL().catch(console.error);