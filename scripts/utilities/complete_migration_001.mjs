import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeMigration001() {
  console.log('🔧 Completing Migration 001: Table Restructuring\n');

  try {
    // Verify data was migrated
    const { count: oldCount } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true });
    
    const { count: newCount } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Verification:`);
    console.log(`  - Original table: ${oldCount} rows`);
    console.log(`  - Partitioned table: ${newCount} rows`);

    if (oldCount !== newCount) {
      console.log('❌ Row counts don\'t match! Please check the migration.');
      return;
    }

    console.log('\n🎯 Migration 001 completed successfully!');
    console.log('\nNext steps:');
    console.log('1. ✅ Data migrated to partitioned table');
    console.log('2. 🔄 Run migration 002 to fix primary keys');
    console.log('3. 🚀 Run migration 003 to add indexes');
    console.log('\nTo continue with next migration, run:');
    console.log('node run_migration_002.mjs');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

completeMigration001();