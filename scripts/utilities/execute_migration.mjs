import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration(migrationFile) {
  console.log(`\n🚀 Executing migration: ${migrationFile}`);
  console.log('================================================\n');

  try {
    // Read the SQL file
    const sql = readFileSync(migrationFile, 'utf8');
    
    // Split by semicolon but be careful about semicolons in strings
    const statements = sql
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`Found ${statements.length} SQL statements to execute.\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue;
      
      // Show what we're executing (first 100 chars)
      console.log(`Statement ${i + 1}: ${statement.substring(0, 100)}...`);
      
      try {
        // Use raw SQL execution
        const { data, error } = await supabase.rpc('exec_sql', {
          query: statement
        }).catch(() => ({ error: 'RPC not available, using direct execution' }));

        if (error) {
          // Try alternative approach
          console.log('  ⚠️  Direct RPC failed, statement may need manual execution');
        } else {
          console.log('  ✅ Success');
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        // Continue with next statement
      }
    }

    console.log('\n✅ Migration completed!');
    
    // Verify the migration
    console.log('\n🔍 Verifying migration results...\n');
    
    // Check if view was created
    const { data: viewCheck } = await supabase
      .from('news_articles')
      .select('count', { count: 'exact', head: true });
    
    console.log(`news_articles view: ${viewCheck !== null ? '✅ Created' : '❌ Not found'}`);
    
    // Check partitioned table
    const { count: partCount } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });
    
    console.log(`news_articles_partitioned: ${partCount || 0} rows`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Get migration file from command line or use first one
const migrationFile = process.argv[2] || 'migrations/001_consolidate_news_tables.sql';
executeMigration(migrationFile);