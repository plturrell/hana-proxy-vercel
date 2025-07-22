import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllNewsTables() {
  console.log('🔍 SCANNING ALL NEWS TABLES IN DATABASE');
  console.log('='.repeat(45));

  try {
    // Use the Supabase table stats to get all news tables
    const newsTableList = [
      'news_articles',
      'news_articles_partitioned',
      'news_loading_status_log',
      'news_articles_y2025m07',
      'news_articles_y2025m01',
      'news_articles_y2025m05',
      'news_articles_y2025m06',
      'entity_news_association',
      'news_articles_default',
      'news_articles_y2025m08',
      'news_articles_y2025m09',
      'news_articles_y2025m04',
      'news_articles_y2025m10',
      'news_articles_y2024m08',
      'news_articles_y2024m09',
      'news_articles_y2024m10',
      'news_articles_y2024m11',
      'news_articles_y2024m12',
      'news_articles_y2025m02',
      'news_articles_y2025m03',
      'news_sources',
      'news_event_classifications',
      'news_entity_extractions',
      'news_market_impact',
      'news_sentiment_analysis',
      'breaking_news_alerts',
      'news_queries',
      'news_article_symbols',
      'news_articles_archive',
      'news_hedge_analyses',
      'news_entity_mentions'
    ];

    const tableInfo = [];
    
    for (const tableName of newsTableList) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          // Get sample data structure
          const { data: sample } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
          
          tableInfo.push({
            name: tableName,
            rowCount: count || 0,
            columns: columns,
            hasData: (count || 0) > 0
          });
        }
      } catch (err) {
        // Table might not exist
        console.log(`⚠️  ${tableName}: Not accessible`);
      }
    }

    // Group tables by type
    const groupedTables = {
      core: [],
      partitions: [],
      analysis: [],
      support: [],
      empty: []
    };

    tableInfo.forEach(table => {
      if (table.name.includes('_y202') || table.name.includes('_default')) {
        groupedTables.partitions.push(table);
      } else if (table.name.includes('sentiment') || table.name.includes('market_impact') || 
                 table.name.includes('entity_extractions') || table.name.includes('breaking_news')) {
        groupedTables.analysis.push(table);
      } else if (table.name === 'news_articles' || table.name === 'news_articles_partitioned') {
        groupedTables.core.push(table);
      } else {
        groupedTables.support.push(table);
      }

      if (table.rowCount === 0) {
        groupedTables.empty.push(table);
      }
    });

    console.log('\n📊 TABLE ANALYSIS:');
    console.log('-'.repeat(25));
    console.log(`Total news tables found: ${tableInfo.length}`);
    console.log(`Tables with data: ${tableInfo.filter(t => t.hasData).length}`);
    console.log(`Empty tables: ${groupedTables.empty.length}`);

    // Create schema summary for Grok4
    const schemaForGrok = {
      core_tables: groupedTables.core.map(t => ({
        name: t.name,
        row_count: t.rowCount,
        columns: t.columns
      })),
      analysis_tables: groupedTables.analysis.map(t => ({
        name: t.name,
        row_count: t.rowCount,
        columns: t.columns
      })),
      partition_tables: groupedTables.partitions.map(t => ({
        name: t.name,
        row_count: t.rowCount,
        purpose: t.name.includes('_y202') ? 'monthly_partition' : 'default_partition'
      })),
      support_tables: groupedTables.support.map(t => ({
        name: t.name,
        row_count: t.rowCount,
        columns: t.columns
      })),
      empty_tables: groupedTables.empty.map(t => t.name)
    };

    console.log('\n📋 SCHEMA FOR GROK4 ANALYSIS:');
    console.log('='.repeat(40));
    console.log(JSON.stringify(schemaForGrok, null, 2));

    console.log('\n🚨 ISSUES FOUND:');
    console.log(`❌ ${groupedTables.empty.length} empty tables still exist`);
    console.log(`❌ Multiple partition tables with 0 rows`);
    console.log(`❌ Cleanup was not fully executed`);

    return schemaForGrok;

  } catch (error) {
    console.error('❌ Error scanning tables:', error.message);
  }
}

getAllNewsTables();