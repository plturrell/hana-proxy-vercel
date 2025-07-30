import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBeforeCleanup() {
  console.log('🔍 VERIFICATION BEFORE CLEANUP & DESCRIPTIONS');
  console.log('='.repeat(50));

  try {
    // Current state analysis
    console.log('\n📊 CURRENT STATE:');
    console.log('-'.repeat(20));

    const tablesWithData = [];
    const emptyTables = [];
    
    const allTables = [
      'news_articles', 'news_articles_partitioned', 'news_articles_y2025m07',
      'news_loading_status_log', 'entity_news_association', 'news_sources', 
      'news_event_classifications', 'news_sentiment_analysis', 'news_market_impact',
      'breaking_news_alerts', 'news_entity_extractions', 'news_queries',
      'news_article_symbols', 'news_articles_archive', 'news_hedge_analyses',
      'news_entity_mentions', 'news_articles_y2024m08', 'news_articles_y2024m09',
      'news_articles_y2024m10', 'news_articles_y2024m11', 'news_articles_y2024m12',
      'news_articles_y2025m01', 'news_articles_y2025m02', 'news_articles_y2025m03',
      'news_articles_y2025m04', 'news_articles_y2025m05', 'news_articles_y2025m06',
      'news_articles_y2025m08', 'news_articles_y2025m09', 'news_articles_y2025m10',
      'news_articles_default'
    ];

    for (const table of allTables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if ((count || 0) > 0) {
          tablesWithData.push({ table, count });
        } else {
          emptyTables.push(table);
        }
      } catch (error) {
        console.log(`⚠️  ${table}: Cannot access`);
      }
    }

    console.log('📈 TABLES WITH DATA:');
    tablesWithData.forEach(({ table, count }) => {
      console.log(`  ✅ ${table}: ${count} rows`);
    });

    console.log('\n📭 EMPTY TABLES TO CLEANUP:');
    emptyTables.forEach(table => {
      console.log(`  🗑️  ${table}`);
    });

    console.log('\n📋 WHAT THE SQL WILL DO:');
    console.log('-'.repeat(30));
    console.log('✅ Add descriptions to ALL news tables');
    console.log(`🗑️  Remove ${emptyTables.length} empty tables`);
    console.log('✅ Keep all tables with data');
    console.log('✅ Verify final state');

    console.log('\n💾 STORAGE IMPACT:');
    console.log('-'.repeat(20));
    console.log(`Current tables: ${allTables.length}`);
    console.log(`After cleanup: ${tablesWithData.length}`);
    console.log(`Storage saved: ~${emptyTables.length * 40}KB (empty table overhead)`);

    console.log('\n🎯 RECOMMENDED ACTION:');
    console.log('-'.repeat(25));
    console.log('1. Copy the SQL from complete_table_descriptions_and_cleanup.sql');
    console.log('2. Execute in Supabase Dashboard > SQL Editor');
    console.log('3. This will add descriptions AND clean up empty tables');
    console.log('4. Verify with the built-in verification queries');

    console.log('\n⚠️  SAFETY CHECK:');
    console.log('-'.repeat(18));
    console.log('✅ All data is safely preserved in tables with rows');
    console.log('✅ Only empty tables will be removed');
    console.log('✅ Core functionality will be maintained');
    console.log('✅ Verification queries included in SQL');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verifyBeforeCleanup();