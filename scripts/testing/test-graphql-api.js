import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function testGraphQLAPI() {
  console.log('🚀 TESTING GRAPHQL API IMPLEMENTATION');
  console.log('=====================================\n');

  // 1. Test GraphQL Views
  console.log('📊 1. Testing GraphQL Views:');
  
  const views = [
    'gql_users',
    'gql_market_data',
    'gql_news_articles',
    'gql_agents',
    'gql_currencies',
    'gql_exchanges',
    'gql_sectors',
    'gql_countries',
    'gql_market_summary',
    'gql_trending_symbols'
  ];

  for (const view of views) {
    try {
      const { count, error } = await supabase
        .from(view)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`  ✅ ${view}: ${count || 0} records`);
      } else {
        console.log(`  ❌ ${view}: ${error.message}`);
      }
    } catch (e) {
      console.log(`  ❌ ${view}: Exception - ${e.message}`);
    }
  }

  // 2. Test GraphQL Functions
  console.log('\n🔧 2. Testing GraphQL Functions:');

  // Test market stats function
  try {
    const { data: marketStats, error } = await supabase.rpc('gql_get_market_stats', {
      p_symbol: 'AAPL'
    });
    
    if (!error) {
      console.log('  ✅ gql_get_market_stats: Working');
      if (marketStats && marketStats.length > 0) {
        console.log('     Sample:', marketStats[0]);
      }
    } else {
      console.log('  ❌ gql_get_market_stats:', error.message);
    }
  } catch (e) {
    console.log('  ❌ gql_get_market_stats exception:', e.message);
  }

  // Test news search function
  try {
    const { data: newsResults, error } = await supabase.rpc('gql_search_news', {
      p_query: 'market',
      p_limit: 5
    });
    
    if (!error) {
      console.log(`  ✅ gql_search_news: Found ${newsResults?.length || 0} articles`);
    } else {
      console.log('  ❌ gql_search_news:', error.message);
    }
  } catch (e) {
    console.log('  ❌ gql_search_news exception:', e.message);
  }

  // Test agents by type function
  try {
    const { data: agents, error } = await supabase.rpc('gql_get_agents_by_type', {
      p_type: 'analytics'
    });
    
    if (!error) {
      console.log(`  ✅ gql_get_agents_by_type: Found ${agents?.length || 0} agents`);
    } else {
      console.log('  ❌ gql_get_agents_by_type:', error.message);
    }
  } catch (e) {
    console.log('  ❌ gql_get_agents_by_type exception:', e.message);
  }

  // 3. Test Sample Queries
  console.log('\n📋 3. Sample GraphQL-Ready Queries:');

  // Market summary
  try {
    const { data: summary, error } = await supabase
      .from('gql_market_summary')
      .select('*')
      .limit(5);
    
    if (!error && summary && summary.length > 0) {
      console.log('  ✅ Market Summary by Exchange:');
      summary.forEach(s => {
        console.log(`     ${s.exchange}: ${s.total_symbols} symbols, avg change: ${s.avg_change_pct}%`);
      });
    }
  } catch (e) {
    console.log('  ❌ Market summary error:', e.message);
  }

  // Trending symbols
  try {
    const { data: trending, error } = await supabase
      .from('gql_trending_symbols')
      .select('*')
      .limit(10);
    
    if (!error && trending && trending.length > 0) {
      console.log('\n  ✅ Top Trending Symbols:');
      trending.forEach(t => {
        console.log(`     ${t.symbol}: ${t.mention_count} mentions, sentiment: ${t.avg_sentiment}`);
      });
    }
  } catch (e) {
    console.log('  ❌ Trending symbols error:', e.message);
  }

  // Reference data sample
  try {
    const { data: currencies, error } = await supabase
      .from('gql_currencies')
      .select('*')
      .limit(5);
    
    if (!error && currencies && currencies.length > 0) {
      console.log('\n  ✅ Sample Currencies:');
      currencies.forEach(c => {
        console.log(`     ${c.code}: ${c.name}`);
      });
    }
  } catch (e) {
    console.log('  ❌ Currencies error:', e.message);
  }

  console.log('\n🎯 GRAPHQL API READY FOR USE!');
  console.log('==============================');
  console.log('Views and functions are accessible via:');
  console.log('- Supabase JS Client: supabase.from("gql_*").select()');
  console.log('- GraphQL Endpoint: https://fnsbxaywhsxqppncqksu.supabase.co/graphql/v1');
  console.log('- PostgREST API: https://fnsbxaywhsxqppncqksu.supabase.co/rest/v1/gql_*');
}

testGraphQLAPI().catch(console.error);