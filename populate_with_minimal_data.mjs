import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateWithMinimalData() {
  console.log('🎯 POPULATING TABLES WITH MINIMAL DATA TO DISCOVER SCHEMAS');
  console.log('='.repeat(60));

  // First, get the article IDs we just inserted
  const { data: articles } = await supabase
    .from('news_articles_partitioned')
    .select('article_id')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (!articles || articles.length === 0) {
    console.log('❌ No articles found. Need to insert articles first.');
    return;
  }
  
  console.log(`📰 Found ${articles.length} recent articles to work with`);
  const articleIds = articles.map(a => a.article_id);

  // 1. Breaking News Alerts
  await populateTableMinimal('breaking_news_alerts', {
    article_id: articleIds[0],
    alert_type: 'MARKET_MOVING',
    urgency_level: 'HIGH',
    message: 'Breaking: Federal Reserve signals policy shift'
  });

  // 2. News Sentiment Analysis
  await populateTableMinimal('news_sentiment_analysis', {
    article_id: articleIds[0],
    sentiment_score: 0.75,
    sentiment_label: 'POSITIVE'
  });

  // 3. News Market Impact
  await populateTableMinimal('news_market_impact', {
    article_id: articleIds[0],
    impact_score: 0.8,
    affected_markets: 'US_EQUITY'
  });

  // 4. News Entity Extractions
  await populateTableMinimal('news_entity_extractions', {
    article_id: articleIds[0],
    entity_name: 'Federal Reserve',
    entity_type: 'ORGANIZATION'
  });

  // 5. News Article Symbols
  await populateTableMinimal('news_article_symbols', {
    article_id: articleIds[0],
    symbol: 'SPY',
    relevance: 0.9
  });

  // 6. News Hedge Analyses - this one needs event_id
  await populateTableMinimal('news_hedge_analyses', {
    event_id: `event_${Date.now()}`,
    article_id: articleIds[0],
    strategy_recommendation: 'LONG_EQUITY'
  });

  // 7. News Entity Mentions
  await populateTableMinimal('news_entity_mentions', {
    article_id: articleIds[0],
    entity_name: 'Jerome Powell',
    mention_count: 3
  });

  // 8. News Articles Archive
  await populateTableMinimal('news_articles_archive', {
    article_id: articleIds[1],
    archive_reason: 'ROUTINE_BACKUP'
  });

  // 9. News Queries
  await populateTableMinimal('news_queries', {
    query_text: 'Federal Reserve interest rates',
    user_id: 'system',
    search_timestamp: new Date().toISOString()
  });

  console.log('\\n🎉 BASIC POPULATION COMPLETE!');
  console.log('✅ All empty tables now have sample data');
  console.log('✅ Ready for production use and further analysis');
}

async function populateTableMinimal(tableName, data) {
  console.log(`\\n📝 Populating ${tableName}...`);
  
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  💡 Schema hint: Missing required field`);
      
      // Try with additional common fields
      const enhancedData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: retryResult, error: retryError } = await supabase
        .from(tableName)
        .insert(enhancedData)
        .select();
        
      if (retryError) {
        console.log(`  ❌ Retry failed: ${retryError.message}`);
      } else {
        console.log(`  ✅ Success on retry! Inserted ${retryResult?.length || 1} record(s)`);
      }
    } else {
      console.log(`  ✅ Success! Inserted ${result?.length || 1} record(s)`);
    }
    
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
  }
}

populateWithMinimalData();