import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGraphQLLocally() {
  console.log('🔍 TESTING GRAPHQL WITH LOCAL DATABASE CONNECTION');
  console.log('================================================\n');

  // Check environment variables
  console.log('1️⃣ Environment Variables Check:');
  console.log('  - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('  - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
  console.log('  - GROK_API_KEY:', process.env.GROK_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('  - XAI_API_KEY:', process.env.XAI_API_KEY ? '✅ Set' : '❌ Not set');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('\n❌ Missing Supabase credentials. Please check your .env file.');
    return;
  }

  // Initialize Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Test 2: Direct Database Query
  console.log('\n2️⃣ Testing Direct Database Queries:');
  
  // Test market_data
  try {
    const { data: marketData, error } = await supabase
      .from('market_data')
      .select('symbol, price, timestamp, source')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (error) {
      console.log('  ❌ Market Data Error:', error.message);
    } else {
      console.log('  ✅ Market Data Table:');
      console.log('     - Records found:', marketData?.length || 0);
      if (marketData && marketData.length > 0) {
        marketData.forEach(record => {
          console.log(`     - ${record.symbol}: $${record.price} (${record.source})`);
        });
      }
    }
  } catch (e) {
    console.log('  ❌ Market Data Exception:', e.message);
  }

  // Test news_articles
  try {
    const { data: newsData, error } = await supabase
      .from('news_articles')
      .select('title, sentiment_score, published_at')
      .order('published_at', { ascending: false })
      .limit(3);

    if (error) {
      console.log('  ❌ News Articles Error:', error.message);
    } else {
      console.log('  ✅ News Articles Table:');
      console.log('     - Records found:', newsData?.length || 0);
      if (newsData && newsData.length > 0) {
        newsData.forEach(article => {
          console.log(`     - ${article.title?.substring(0, 50)}... (sentiment: ${article.sentiment_score})`);
        });
      }
    }
  } catch (e) {
    console.log('  ❌ News Articles Exception:', e.message);
  }

  // Test 3: GraphQL Views
  console.log('\n3️⃣ Testing GraphQL Views:');
  
  try {
    const { data: gqlMarketData, error } = await supabase
      .from('gql_market_data')
      .select('*')
      .limit(3);

    if (error) {
      console.log('  ❌ gql_market_data Error:', error.message);
    } else {
      console.log('  ✅ gql_market_data View:');
      console.log('     - Records found:', gqlMarketData?.length || 0);
    }
  } catch (e) {
    console.log('  ❌ gql_market_data Exception:', e.message);
  }

  // Test 4: Simulate GraphQL Query
  console.log('\n4️⃣ Simulating GraphQL Query Logic:');
  
  const testSymbol = 'AAPL';
  
  try {
    // Get market data
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', testSymbol)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (marketError) {
      console.log(`  ❌ No market data for ${testSymbol}:`, marketError.message);
    } else {
      console.log(`  ✅ Market data for ${testSymbol}:`, {
        price: marketData?.price,
        timestamp: marketData?.timestamp
      });
    }

    // Get news data
    const { data: newsData, error: newsError } = await supabase
      .from('news_articles')
      .select('*')
      .or(`symbols.cs.{"${testSymbol}"},title.ilike.%${testSymbol}%,content.ilike.%${testSymbol}%`)
      .order('published_at', { ascending: false })
      .limit(10);

    if (newsError) {
      console.log(`  ❌ No news data for ${testSymbol}:`, newsError.message);
    } else {
      console.log(`  ✅ News articles for ${testSymbol}:`, newsData?.length || 0);
    }
  } catch (e) {
    console.log('  ❌ Query simulation error:', e.message);
  }

  console.log('\n📊 DIAGNOSIS:');
  console.log('============');
  console.log('The GraphQL endpoint needs:');
  console.log('1. Proper environment variables set in Vercel');
  console.log('2. Market data populated in the database');
  console.log('3. News articles with proper symbol tagging');
  console.log('4. AI API keys for agent analysis features');
}

testGraphQLLocally().catch(console.error);