import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSchema() {
  console.log('🔍 ANALYZING CURRENT NEWS SCHEMA');
  console.log('='.repeat(50));

  const tables = [
    // Core tables
    'news_articles',
    'news_articles_partitioned', 
    'news_articles_y2025m07', // This seems to have data!
    
    // Analysis tables
    'news_sentiment_analysis',
    'news_market_impact',
    'breaking_news_alerts',
    'news_entity_extractions',
    
    // Supporting tables
    'news_sources',
    'news_queries',
    'news_articles_archive',
    'entity_news_association'
  ];

  console.log('\n📊 TABLE ANALYSIS:');
  console.log('-'.repeat(40));

  let totalRows = 0;
  let tablesWithData = [];
  let emptyTables = [];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
        continue;
      }

      const rowCount = count || 0;
      totalRows += rowCount;

      if (rowCount > 0) {
        tablesWithData.push({ table, count: rowCount });
        console.log(`✅ ${table}: ${rowCount} rows`);
      } else {
        emptyTables.push(table);
        console.log(`⚪ ${table}: 0 rows (EMPTY)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n📈 SUMMARY:');
  console.log(`Total rows across all tables: ${totalRows}`);
  console.log(`Tables with data: ${tablesWithData.length}`);
  console.log(`Empty tables: ${emptyTables.length}`);

  console.log('\n🎯 TABLES WITH DATA:');
  tablesWithData.forEach(t => {
    console.log(`  - ${t.table}: ${t.count} rows`);
  });

  console.log('\n⚪ EMPTY TABLES (candidates for cleanup):');
  emptyTables.forEach(t => {
    console.log(`  - ${t}`);
  });

  // Check where the actual data is
  console.log('\n🔍 PARTITION INVESTIGATION:');
  console.log('-'.repeat(30));
  
  try {
    // Check if news_articles_y2025m07 has our data
    const { data: partitionData } = await supabase
      .from('news_articles_y2025m07')
      .select('title, source')
      .limit(3);

    if (partitionData && partitionData.length > 0) {
      console.log('🎯 Found data in news_articles_y2025m07:');
      partitionData.forEach((article, i) => {
        console.log(`  ${i+1}. ${article.title?.substring(0, 50)}... (${article.source})`);
      });
    }

    // Check partitioned table
    const { count: partCount } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\nnews_articles_partitioned: ${partCount} rows`);

  } catch (error) {
    console.log(`Error checking partitions: ${error.message}`);
  }

  console.log('\n🚨 ISSUES IDENTIFIED:');
  console.log('1. Data ended up in wrong partition (y2025m07 instead of partitioned)');
  console.log('2. Multiple empty partition tables wasting space');
  console.log('3. Empty analysis tables not being used');
  
  console.log('\n🔧 CLEANUP RECOMMENDATIONS:');
  console.log('1. Move data from y2025m07 to news_articles_partitioned');
  console.log('2. Drop empty partition tables');
  console.log('3. Keep analysis tables (they\'ll be used when you add analysis)');
  console.log('4. Consolidate into clean, efficient structure');
}

analyzeSchema();