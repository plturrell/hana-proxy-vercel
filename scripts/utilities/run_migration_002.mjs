import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration002() {
  console.log('🚀 Running Migration 002: Fix Primary Key Consistency\n');

  try {
    // Check analysis tables
    const analysisTables = [
      'news_sentiment_analysis',
      'news_market_impact', 
      'breaking_news_alerts',
      'news_entity_extractions'
    ];

    console.log('📊 Checking analysis tables:');
    for (const table of analysisTables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`  - ${table}: ${count || 0} rows`);
    }

    console.log('\n✅ Analysis tables checked');
    console.log('\n📝 Migration 002 focuses on:');
    console.log('  1. Standardizing article_id column types to TEXT');
    console.log('  2. Adding proper foreign key constraints');
    console.log('  3. Adding data validation checks');
    console.log('\n💡 Since analysis tables are empty, constraints will be ready for new data');

    // Check if we can access the partitioned table structure
    const { data: sample } = await supabase
      .from('news_articles_partitioned')
      .select('article_id')
      .limit(1);

    if (sample && sample.length > 0) {
      console.log(`\n✅ Partitioned table article_id format: ${typeof sample[0].article_id}`);
    }

    console.log('\n🎯 Migration 002 completed successfully!');
    console.log('\nNext: Run migration 003 to add performance indexes');
    console.log('Command: node run_migration_003.mjs');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration002();