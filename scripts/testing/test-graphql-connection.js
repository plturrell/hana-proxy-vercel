import fetch from 'node-fetch';

async function testGraphQLConnection() {
  console.log('🔍 TESTING GRAPHQL DATABASE CONNECTION');
  console.log('=====================================\n');

  const graphqlEndpoint = 'https://hana-proxy-vercel.vercel.app/api/graphql';
  
  // Test 1: Market Intelligence Query
  console.log('1️⃣ Testing Market Intelligence Query:');
  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetMarketIntelligence($symbol: String!) {
            marketIntelligence(symbol: $symbol) {
              symbol
              currentPrice
              sentiment {
                overall
                trajectory
                newsImpact {
                  articles {
                    id
                    title
                    sentiment
                  }
                }
              }
              predictions {
                consensus {
                  direction
                  confidence
                }
              }
            }
          }
        `,
        variables: {
          symbol: 'AAPL'
        }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.log('  ❌ GraphQL Errors:', data.errors);
    } else if (data.data?.marketIntelligence) {
      console.log('  ✅ Market Intelligence Retrieved:');
      console.log('     - Symbol:', data.data.marketIntelligence.symbol);
      console.log('     - Current Price:', data.data.marketIntelligence.currentPrice);
      console.log('     - Sentiment:', data.data.marketIntelligence.sentiment?.overall);
      console.log('     - News Articles:', data.data.marketIntelligence.sentiment?.newsImpact?.articles?.length || 0);
    } else {
      console.log('  ⚠️ No data returned');
    }
  } catch (error) {
    console.log('  ❌ Connection Error:', error.message);
  }

  // Test 2: Direct Database Connection Test
  console.log('\n2️⃣ Testing Direct Supabase Connection:');
  try {
    // Import supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      'https://fnsbxaywhsxqppncqksu.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYiLCJleHAiOjIwNjc5ODc5NTZ9.Gz5vrbSXxJkZGM4M0oL5baLJqMzPF5D2OJcK6aqrYQY'
    );

    // Test market_data table
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('symbol, price, timestamp')
      .eq('symbol', 'AAPL')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (marketError) {
      console.log('  ❌ Market Data Error:', marketError.message);
    } else if (marketData && marketData.length > 0) {
      console.log('  ✅ Market Data Connected:');
      console.log('     - Symbol:', marketData[0].symbol);
      console.log('     - Price:', marketData[0].price);
      console.log('     - Timestamp:', marketData[0].timestamp);
    } else {
      console.log('  ⚠️ No market data found for AAPL');
    }

    // Test news_articles table
    const { data: newsData, error: newsError } = await supabase
      .from('news_articles')
      .select('title, sentiment_score')
      .or(`symbols.cs.{"AAPL"},title.ilike.%AAPL%`)
      .order('published_at', { ascending: false })
      .limit(3);

    if (newsError) {
      console.log('  ❌ News Data Error:', newsError.message);
    } else if (newsData && newsData.length > 0) {
      console.log('  ✅ News Data Connected:');
      console.log('     - Articles found:', newsData.length);
      newsData.forEach((article, i) => {
        console.log(`     - Article ${i+1}: ${article.title?.substring(0, 50)}...`);
      });
    } else {
      console.log('  ⚠️ No news data found for AAPL');
    }

  } catch (error) {
    console.log('  ❌ Database Connection Error:', error.message);
  }

  // Test 3: Check GraphQL Views
  console.log('\n3️⃣ Testing GraphQL Views Access:');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      'https://fnsbxaywhsxqppncqksu.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYiLCJleHAiOjIwNjc5ODc5NTZ9.Gz5vrbSXxJkZGM4M0oL5baLJqMzPF5D2OJcK6aqrYQY'
    );

    const { data: gqlData, error: gqlError } = await supabase
      .from('gql_market_data')
      .select('*')
      .limit(1);

    if (gqlError) {
      console.log('  ❌ GraphQL View Error:', gqlError.message);
    } else {
      console.log('  ✅ GraphQL Views Accessible');
    }

  } catch (error) {
    console.log('  ❌ GraphQL Views Error:', error.message);
  }

  console.log('\n📊 CONNECTION SUMMARY:');
  console.log('====================');
  console.log('The GraphQL endpoint should be properly connected to:');
  console.log('- Supabase database tables (market_data, news_articles)');
  console.log('- GraphQL views (gql_* prefixed views)');
  console.log('- AI services (Grok/XAI for agent analysis)');
}

testGraphQLConnection().catch(console.error);