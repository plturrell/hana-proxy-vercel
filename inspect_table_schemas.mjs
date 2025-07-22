import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTableSchemas() {
  console.log('🔍 INSPECTING EMPTY TABLE SCHEMAS');
  console.log('='.repeat(40));

  const emptyTables = [
    'breaking_news_alerts',
    'news_sentiment_analysis', 
    'news_market_impact',
    'news_entity_extractions',
    'news_queries',
    'news_article_symbols',
    'news_articles_archive',
    'news_hedge_analyses',
    'news_entity_mentions'
  ];

  for (const tableName of emptyTables) {
    console.log(`\\n📋 ${tableName.toUpperCase()}`);
    console.log('-'.repeat(tableName.length + 4));
    
    try {
      // Try to get table structure by attempting an insert with empty data
      const { error } = await supabase
        .from(tableName)
        .insert({})
        .select();
      
      if (error) {
        // Parse the error message to extract column information
        console.log(`Structure info from error: ${error.message}`);
        
        // Extract column names from error messages
        if (error.message.includes('violates not-null constraint')) {
          const match = error.message.match(/column "([^"]+)"/);
          if (match) {
            console.log(`Required column found: ${match[1]}`);
          }
        }
      }
      
      // Alternative: Try to select with limit 0 to get column info
      const { data, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (!selectError && data !== null) {
        console.log('✅ Table accessible for SELECT operations');
      }
      
    } catch (err) {
      console.log(`❌ Cannot access table: ${err.message}`);
    }
  }
  
  console.log('\\n🎯 RECOMMENDATIONS:');
  console.log('1. Check table definitions in Supabase Dashboard');
  console.log('2. Use minimal data insertion to discover schemas');
  console.log('3. Create sample records with basic required fields');
}

inspectTableSchemas();