import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration001() {
  console.log('🚀 Running Migration 001: Consolidate News Tables\n');

  try {
    // Step 1: Check current state
    console.log('📊 Current State:');
    const { count: articles } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true });
    console.log(`  - news_articles: ${articles} rows`);
    
    const { count: partitioned } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });
    console.log(`  - news_articles_partitioned: ${partitioned} rows\n`);

    // Step 2: Migrate data to partitioned table
    console.log('📋 Migrating data to partitioned table...');
    
    // Get all articles from simple table
    const { data: articlesToMigrate, error: fetchError } = await supabase
      .from('news_articles')
      .select('*');

    if (fetchError) {
      console.error('Error fetching articles:', fetchError);
      return;
    }

    if (articlesToMigrate && articlesToMigrate.length > 0) {
      // Transform and insert into partitioned table
      const transformedArticles = articlesToMigrate.map(article => ({
        article_id: article.article_id,
        title: article.title,
        content: article.content,
        url: article.url,
        source: article.source,
        published_at: article.published_at || article.created_at,
        sentiment_score: article.sentiment_score,
        entities: article.entities,
        relevance_score: article.relevance_score,
        created_at: article.created_at,
        metadata: {
          migrated_from: 'news_articles',
          migration_date: new Date().toISOString(),
          processed_at: article.processed_at
        }
      }));

      const { error: insertError } = await supabase
        .from('news_articles_partitioned')
        .insert(transformedArticles);

      if (insertError) {
        console.error('Error inserting into partitioned table:', insertError);
        return;
      }

      console.log(`✅ Migrated ${articlesToMigrate.length} articles successfully!\n`);
    }

    // Step 3: Verify migration
    console.log('🔍 Verifying migration:');
    const { count: newPartCount } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });
    console.log(`  - news_articles_partitioned now has: ${newPartCount} rows`);

    // Step 4: Check if we can create a view (informational)
    console.log('\n📝 Next steps:');
    console.log('  1. Rename news_articles to news_articles_old');
    console.log('  2. Create view news_articles pointing to news_articles_partitioned');
    console.log('  3. This requires direct SQL execution in Supabase dashboard\n');

    console.log('✅ Migration 001 data migration complete!');
    console.log('\n⚠️  IMPORTANT: Complete the migration by running this SQL in Supabase dashboard:');
    console.log('----------------------------------------');
    console.log(`
-- Rename original table
ALTER TABLE news_articles RENAME TO news_articles_old;

-- Create compatibility view
CREATE VIEW news_articles AS 
SELECT 
    article_id::uuid as article_id,
    title,
    content,
    url,
    source,
    published_at,
    sentiment_score,
    entities,
    relevance_score,
    (metadata->>'processed_at')::timestamptz as processed_at,
    created_at
FROM news_articles_partitioned;

-- Add comment
COMMENT ON VIEW news_articles IS 'Compatibility view for legacy news_articles table access';
    `);
    console.log('----------------------------------------\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration001();