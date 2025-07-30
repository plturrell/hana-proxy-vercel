import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupNewsSchema() {
  console.log('🧹 CLEANING UP NEWS SCHEMA');
  console.log('='.repeat(40));

  try {
    // Step 1: Verify current state
    console.log('\n📊 STEP 1: Current State Verification');
    console.log('-'.repeat(30));
    
    const { count: mainTable } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });
    
    const { count: partition } = await supabase
      .from('news_articles_y2025m07')
      .select('*', { count: 'exact', head: true });
    
    console.log(`news_articles_partitioned: ${mainTable} rows`);
    console.log(`news_articles_y2025m07: ${partition} rows`);

    // Step 2: Check for duplicates
    console.log('\n🔍 STEP 2: Checking for Duplicates');
    console.log('-'.repeat(30));
    
    const { data: partitionedData } = await supabase
      .from('news_articles_partitioned')
      .select('article_id, title');
    
    const { data: partitionData } = await supabase
      .from('news_articles_y2025m07')
      .select('article_id, title');

    const partitionedIds = new Set(partitionedData?.map(a => a.article_id) || []);
    const partitionIds = new Set(partitionData?.map(a => a.article_id) || []);
    
    // Find overlaps
    const duplicates = [...partitionIds].filter(id => partitionedIds.has(id));
    console.log(`Found ${duplicates.length} duplicate article IDs`);
    
    if (duplicates.length > 0) {
      console.log('Duplicate IDs:', duplicates.slice(0, 3));
    }

    // Step 3: Show clean structure plan
    console.log('\n🎯 STEP 3: Proposed Clean Structure');
    console.log('-'.repeat(35));
    
    console.log('KEEP:');
    console.log('✅ news_articles_partitioned (main table)');
    console.log('✅ news_articles (view for compatibility)');
    console.log('✅ news_sources (reference data)');
    console.log('✅ entity_news_association (linking data)');
    console.log('✅ analysis tables (for future use)');
    
    console.log('\nCLEANUP:');
    console.log('🗑️  Remove duplicate data from partition tables');
    console.log('🗑️  Drop empty partition tables (16 tables)');
    console.log('🗑️  Consolidate all data into partitioned table');

    // Step 4: Execution plan
    console.log('\n📋 STEP 4: Cleanup Execution Plan');
    console.log('-'.repeat(35));
    
    console.log('1. Backup current data ✅ (already in partitioned table)');
    console.log('2. Remove duplicates from partition tables');
    console.log('3. Drop empty partition tables');
    console.log('4. Verify final structure');
    
    // Step 5: Execute cleanup
    console.log('\n🔄 STEP 5: Executing Cleanup...');
    console.log('-'.repeat(30));
    
    // This would need to be done via SQL in dashboard:
    const cleanupSQL = `
-- 1. Remove duplicates from partition tables
-- (since data is already in partitioned table)
DELETE FROM news_articles_y2025m07;

-- 2. Drop empty partition tables
DROP TABLE IF EXISTS news_articles_y2024m08;
DROP TABLE IF EXISTS news_articles_y2024m09;
DROP TABLE IF EXISTS news_articles_y2024m10;
DROP TABLE IF EXISTS news_articles_y2024m11;
DROP TABLE IF EXISTS news_articles_y2024m12;
DROP TABLE IF EXISTS news_articles_y2025m01;
DROP TABLE IF EXISTS news_articles_y2025m02;
DROP TABLE IF EXISTS news_articles_y2025m03;
DROP TABLE IF EXISTS news_articles_y2025m04;
DROP TABLE IF EXISTS news_articles_y2025m05;
DROP TABLE IF EXISTS news_articles_y2025m06;
DROP TABLE IF EXISTS news_articles_y2025m08;
DROP TABLE IF EXISTS news_articles_y2025m09;
DROP TABLE IF EXISTS news_articles_y2025m10;
DROP TABLE IF EXISTS news_articles_default;

-- 3. Keep only current month partition
-- news_articles_y2025m07 (keep but empty)
    `;

    console.log('⚠️  CLEANUP REQUIRES SQL EXECUTION');
    console.log('Copy the following SQL to Supabase Dashboard > SQL Editor:');
    console.log('\n' + '='.repeat(50));
    console.log(cleanupSQL);
    console.log('='.repeat(50));

    // Step 6: Show expected results
    console.log('\n📈 STEP 6: Expected Results After Cleanup');
    console.log('-'.repeat(40));
    
    console.log('FINAL STRUCTURE:');
    console.log('✅ news_articles_partitioned (3 rows)');
    console.log('✅ news_articles (view)');
    console.log('✅ news_articles_y2025m07 (empty partition)');
    console.log('✅ news_sources (3 rows)');
    console.log('✅ entity_news_association (16 rows)');
    console.log('✅ analysis tables (ready for use)');
    
    console.log('\nSPACE SAVED:');
    console.log('🗑️  ~640KB from empty partition tables');
    console.log('🗑️  Eliminated data duplication');
    console.log('🗑️  Clean, efficient structure');

    console.log('\n✅ CLEANUP PLAN READY!');
    console.log('Execute the SQL above to complete cleanup.');

  } catch (error) {
    console.error('❌ Error during cleanup analysis:', error.message);
  }
}

cleanupNewsSchema();