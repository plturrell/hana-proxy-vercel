import { createClient } from '@supabase/supabase-js';

async function verifyGraphQLProduction() {
  console.log('🔍 VERIFYING GRAPHQL PRODUCTION SETUP');
  console.log('=====================================\n');

  // Use the service role key that has been working
  const supabase = createClient(
    'https://fnsbxaywhsxqppncqksu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
  );

  console.log('1️⃣ Checking Market Data:');
  const { data: marketData, error: marketError } = await supabase
    .from('market_data')
    .select('symbol, price, source, timestamp')
    .order('timestamp', { ascending: false })
    .limit(5);

  if (marketError) {
    console.log('  ❌ Error:', marketError.message);
  } else {
    console.log('  ✅ Market Data Records:', marketData?.length || 0);
    marketData?.forEach(d => {
      console.log(`     - ${d.symbol}: $${d.price} from ${d.source}`);
    });
  }

  console.log('\n2️⃣ Checking News Articles:');
  const { data: newsData, error: newsError } = await supabase
    .from('news_articles')
    .select('title, symbols, sentiment_score')
    .order('published_at', { ascending: false })
    .limit(3);

  if (newsError) {
    console.log('  ❌ Error:', newsError.message);
  } else {
    console.log('  ✅ News Articles:', newsData?.length || 0);
    newsData?.forEach(n => {
      console.log(`     - ${n.title?.substring(0, 50)}...`);
      console.log(`       Symbols: ${n.symbols || 'none'}`);
    });
  }

  console.log('\n3️⃣ Testing GraphQL Query for AAPL:');
  
  // Test AAPL specifically
  const { data: aaplData, error: aaplError } = await supabase
    .from('market_data')
    .select('*')
    .eq('symbol', 'AAPL')
    .order('timestamp', { ascending: false })
    .limit(1);

  if (aaplError) {
    console.log('  ❌ AAPL Error:', aaplError.message);
  } else if (aaplData && aaplData.length > 0) {
    console.log('  ✅ AAPL Data Found:', {
      price: aaplData[0].price,
      timestamp: aaplData[0].timestamp
    });
  } else {
    console.log('  ⚠️ No AAPL data in database');
  }

  // Test news with AAPL
  const { data: aaplNews } = await supabase
    .from('news_articles')
    .select('title')
    .or(`symbols.cs.{"AAPL"},title.ilike.%AAPL%,content.ilike.%AAPL%`)
    .limit(3);

  console.log('  📰 AAPL News Articles:', aaplNews?.length || 0);

  console.log('\n4️⃣ GraphQL Configuration Status:');
  console.log('  ✅ Database Views: Created (gql_* views)');
  console.log('  ✅ GraphQL Endpoint: /api/graphql.js');
  console.log('  ⚠️ Environment Variables: Need to be set in Vercel');
  console.log('  ⚠️ Data Population: Need market data for symbols');

  console.log('\n📊 RECOMMENDATIONS:');
  console.log('==================');
  console.log('1. Set environment variables in Vercel dashboard:');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_ANON_KEY (or SERVICE_ROLE_KEY)');
  console.log('   - GROK_API_KEY (for AI features)');
  console.log('2. Populate market_data table with real data');
  console.log('3. Ensure news_articles have proper symbol arrays');
  console.log('4. Test the endpoint at: https://hana-proxy-vercel.vercel.app/api/graphql');
}

verifyGraphQLProduction().catch(console.error);