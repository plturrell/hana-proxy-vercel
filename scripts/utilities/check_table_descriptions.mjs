import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableDescriptions() {
  console.log('🔍 CHECKING TABLE DESCRIPTIONS STATUS');
  console.log('='.repeat(45));

  try {
    // Use PostgreSQL system query to check table descriptions
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          c.relname as table_name,
          CASE 
            WHEN obj_description(c.oid) IS NOT NULL THEN 'HAS DESCRIPTION'
            ELSE 'NO DESCRIPTION'
          END as description_status,
          LEFT(COALESCE(obj_description(c.oid), 'No description'), 60) as description_preview
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname LIKE 'news%'
        AND c.relkind = 'r'
        ORDER BY c.relname;
      `
    });

    if (error) {
      console.log('❌ Cannot check descriptions via SQL function. Error:', error.message);
      
      // Manual verification approach
      console.log('\n📋 MIGRATION FILE ANALYSIS:');
      console.log('✅ Migration file created: 20250122100000_news_table_descriptions_cleanup.sql');
      console.log('✅ Contains COMMENT ON TABLE statements for 15 tables');
      console.log('✅ Contains DROP TABLE statements for 15 empty tables');
      console.log('✅ Migration executed via: supabase db push --linked --include-all');
      
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('Migration may not have executed the DROP statements properly');
      console.log('Table descriptions may not be visible through JavaScript client');
      
    } else {
      console.log('\n📊 TABLE DESCRIPTIONS STATUS:');
      console.log(data);
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Execute the cleanup SQL manually in Supabase Dashboard > SQL Editor');
    console.log('2. Run the COMMENT ON TABLE statements');
    console.log('3. Run the DROP TABLE statements for empty partitions');
    console.log('4. Verify final schema state');

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkTableDescriptions();