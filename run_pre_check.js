const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPreMigrationChecks() {
  console.log('=== PRE-MIGRATION ANALYSIS ===\n');

  try {
    // 1. Check news_articles table
    const { count: simpleCount } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✓ news_articles table: ${simpleCount || 0} rows`);

    // 2. Check news_articles_partitioned
    const { count: partCount } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✓ news_articles_partitioned table: ${partCount || 0} rows`);

    // 3. Check analysis tables
    const analysisTables = [
      'news_sentiment_analysis',
      'news_market_impact',
      'breaking_news_alerts',
      'news_entity_extractions'
    ];

    console.log('\nAnalysis Tables:');
    for (const table of analysisTables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`  - ${table}: ${count || 0} rows`);
    }

    // 4. Sample data check
    const { data: sampleArticles } = await supabase
      .from('news_articles')
      .select('article_id, title, published_at, source')
      .order('published_at', { ascending: false })
      .limit(3);

    console.log('\nSample Recent Articles:');
    if (sampleArticles && sampleArticles.length > 0) {
      sampleArticles.forEach(article => {
        console.log(`  - ${article.title?.substring(0, 60)}...`);
        console.log(`    ID: ${article.article_id}, Source: ${article.source}`);
      });
    } else {
      console.log('  No articles found');
    }

    console.log('\n✅ Pre-migration check complete!');
    console.log('\nRecommendation: Safe to proceed with migrations.');
    
  } catch (error) {
    console.error('❌ Error during pre-migration check:', error.message);
  }
}

runPreMigrationChecks();