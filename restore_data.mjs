import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreData() {
  console.log('🔄 RESTORING DATA TO PARTITIONED TABLE');
  console.log('='.repeat(40));

  try {
    // Step 1: Get source data
    console.log('\n📋 STEP 1: Reading source data...');
    const { data: sourceData, error: fetchError } = await supabase
      .from('news_articles')
      .select('*');

    if (fetchError) {
      console.log(`❌ Error reading source: ${fetchError.message}`);
      return;
    }

    if (!sourceData || sourceData.length === 0) {
      console.log('❌ No source data found');
      return;
    }

    console.log(`✅ Found ${sourceData.length} articles to restore`);
    sourceData.forEach((article, i) => {
      console.log(`  ${i+1}. ${article.title?.substring(0, 50)}... (${article.source})`);
    });

    // Step 2: Transform data for partitioned table
    console.log('\n🔄 STEP 2: Transforming data...');
    const transformedData = sourceData.map(article => ({
      article_id: article.article_id,
      title: article.title,
      content: article.content,
      url: article.url,
      source: article.source,
      published_at: article.published_at || article.created_at,
      sentiment_score: article.sentiment_score,
      entities: article.entities || {},
      relevance_score: article.relevance_score,
      created_at: article.created_at,
      updated_at: new Date().toISOString(),
      metadata: {
        migrated_from: 'news_articles',
        migration_date: new Date().toISOString(),
        processed_at: article.processed_at,
        restoration_reason: 'cleanup_recovery'
      }
    }));

    console.log('✅ Data transformed for partitioned table');

    // Step 3: Insert into partitioned table
    console.log('\n💾 STEP 3: Inserting into partitioned table...');
    const { error: insertError } = await supabase
      .from('news_articles_partitioned')
      .insert(transformedData);

    if (insertError) {
      console.log(`❌ Insert failed: ${insertError.message}`);
      return;
    }

    console.log('✅ Data successfully inserted!');

    // Step 4: Verify restoration
    console.log('\n🔍 STEP 4: Verifying restoration...');
    const { count: restoredCount } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Partitioned table now has: ${restoredCount} articles`);

    // Step 5: Test queries
    console.log('\n🎯 STEP 5: Testing restored data...');
    const { data: sampleData } = await supabase
      .from('news_articles_partitioned')
      .select('article_id, title, source, sentiment_score')
      .limit(3);

    if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample restored data:');
      sampleData.forEach((article, i) => {
        console.log(`  ${i+1}. ${article.title?.substring(0, 50)}...`);
        console.log(`      Source: ${article.source}, Sentiment: ${article.sentiment_score}`);
      });
    }

    // Step 6: Final status
    console.log('\n✅ RESTORATION COMPLETE!');
    console.log('='.repeat(30));
    
    const { count: finalMain } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalPartitioned } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });

    console.log(`news_articles (original): ${finalMain} articles`);
    console.log(`news_articles_partitioned: ${finalPartitioned} articles`);
    console.log('');
    console.log('🎯 STATUS: Data successfully restored!');
    console.log('🔄 NEXT: Continue with cleanup of empty partition tables');

  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  }
}

restoreData();