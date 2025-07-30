import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeEmptyTables() {
  console.log('📊 ANALYZING EMPTY NEWS TABLES FOR POPULATION');
  console.log('='.repeat(55));

  const newsTables = [
    'news_articles', 'news_articles_y2025m07', 'news_loading_status_log',
    'entity_news_association', 'news_sources', 'news_event_classifications',
    'breaking_news_alerts', 'news_sentiment_analysis', 'news_market_impact',
    'news_entity_extractions', 'news_queries', 'news_article_symbols',
    'news_articles_archive', 'news_hedge_analyses', 'news_entity_mentions'
  ];

  const emptyTables = [];
  const tablesWithData = [];

  console.log('\n🔍 SCANNING ALL NEWS TABLES:');
  console.log('-'.repeat(40));

  for (const tableName of newsTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: Error - ${error.message}`);
        continue;
      }

      if (count === 0) {
        // Get table structure for empty tables
        const { data: sample } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        // Since it's empty, we need to get column info differently
        emptyTables.push({
          name: tableName,
          count: 0,
          purpose: getTablePurpose(tableName)
        });
        console.log(`📭 ${tableName}: 0 rows (EMPTY - Ready for population)`);
      } else {
        tablesWithData.push({ name: tableName, count });
        console.log(`✅ ${tableName}: ${count} rows`);
      }
    } catch (err) {
      console.log(`⚠️  ${tableName}: Cannot access - ${err.message}`);
    }
  }

  console.log('\n📈 SUMMARY:');
  console.log(`✅ Tables with data: ${tablesWithData.length}`);
  console.log(`📭 Empty tables ready for population: ${emptyTables.length}`);

  console.log('\n🎯 EMPTY TABLES TO POPULATE:');
  console.log('-'.repeat(35));
  emptyTables.forEach(table => {
    console.log(`📋 ${table.name}`);
    console.log(`   Purpose: ${table.purpose}`);
    console.log(`   Status: Ready for real Perplexity data`);
    console.log('');
  });

  console.log('\n🔄 POPULATION STRATEGY:');
  console.log('-'.repeat(25));
  console.log('1. Fetch real Perplexity articles from past hour');
  console.log('2. Extract entities, sentiment, market impact');
  console.log('3. Populate analysis tables with AI-generated insights');
  console.log('4. Create breaking news alerts for high-impact stories');
  console.log('5. Generate hedge fund analysis and entity mentions');

  return { emptyTables, tablesWithData };
}

function getTablePurpose(tableName) {
  const purposes = {
    'breaking_news_alerts': 'Real-time alerts for high-impact financial news',
    'news_sentiment_analysis': 'AI sentiment analysis across multiple dimensions',
    'news_market_impact': 'Market impact assessment for different asset classes',
    'news_entity_extractions': 'Extracted companies, people, financial instruments',
    'news_queries': 'User search patterns and analytics',
    'news_article_symbols': 'Article-to-ticker mapping for financial symbols',
    'news_articles_archive': 'Long-term storage for historical articles',
    'news_hedge_analyses': 'Hedge fund strategy analysis from news',
    'news_entity_mentions': 'Entity frequency and sentiment tracking'
  };
  return purposes[tableName] || 'News processing support table';
}

analyzeEmptyTables();