import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverTableSchemas() {
  console.log('🔍 DISCOVERING EXACT TABLE SCHEMAS');
  console.log('='.repeat(40));

  // Tables we need to properly populate
  const tablesToInvestigate = {
    'breaking_news_alerts': { 
      required: ['article_id', 'title'], 
      description: 'High-priority financial news alerts'
    },
    'news_article_symbols': { 
      required: ['article_id'], 
      description: 'Maps articles to financial symbols/tickers'
    },
    'news_hedge_analyses': { 
      required: ['event_id', 'analysis_data'], 
      description: 'Hedge fund strategy analysis from news'
    },
    'news_entity_mentions': { 
      required: ['article_id', 'entity_id'], 
      description: 'Tracks entity mentions across articles'
    }
  };

  console.log('\n📋 SCHEMA INVESTIGATION RESULTS:');
  console.log('-'.repeat(40));

  for (const [tableName, info] of Object.entries(tablesToInvestigate)) {
    console.log(`\n🔍 ${tableName.toUpperCase()}`);
    console.log(`Purpose: ${info.description}`);
    console.log(`Known requirements: ${info.required.join(', ')}`);
    
    // Try to understand the column types
    if (tableName === 'news_article_symbols') {
      // We know article_id caused bigint error, so it expects numeric ID
      console.log('⚠️  Note: article_id expects bigint, not string');
    }
    
    if (tableName === 'news_entity_mentions') {
      // Entity_id is required but we don't have an entities table
      console.log('⚠️  Note: Requires entity_id reference');
    }
  }

  // Check if we have an entities table
  console.log('\n🔍 CHECKING FOR ENTITIES TABLE:');
  try {
    const { count } = await supabase
      .from('entities')
      .select('*', { count: 'exact', head: true });
    console.log(`✅ Found entities table with ${count} records`);
  } catch (error) {
    console.log('❌ No entities table found');
    
    // Check financial_entities instead
    try {
      const { count } = await supabase
        .from('financial_entities')
        .select('*', { count: 'exact', head: true });
      console.log(`✅ Found financial_entities table with ${count} records`);
    } catch (err) {
      console.log('❌ No financial_entities table either');
    }
  }

  console.log('\n📊 UNDERSTANDING THE COMPLETE PIPELINE:');
  console.log('-'.repeat(40));
  console.log('1. News articles come in via news_articles_partitioned');
  console.log('2. Triggers should populate analysis tables automatically');
  console.log('3. But manual population is needed for initial setup');
  console.log('4. Some tables expect specific ID formats (bigint vs string)');
  console.log('5. Entity references need proper entity table population first');
}

discoverTableSchemas();