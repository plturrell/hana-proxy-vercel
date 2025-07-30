import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployFunctions() {
  console.log('🚀 Deploying functions to Supabase...\n');

  try {
    // Read all migration files
    const migrationDir = path.join(process.cwd(), 'supabase-migration');
    const files = [
      '01_core_analytics_functions.sql',
      '02_ml_rl_functions.sql', 
      '03_advanced_analytics_functions.sql'
    ];

    for (const file of files) {
      console.log(`📄 Deploying ${file}...`);
      
      const sqlContent = await fs.readFile(path.join(migrationDir, file), 'utf8');
      
      // Split by semicolons but be careful with functions
      const statements = sqlContent
        .split(/;\s*$/m)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.trim() === ';') {
          continue;
        }

        try {
          // Execute SQL statement
          const { error } = await supabase.rpc('exec_sql', {
            sql_query: statement
          }).single();

          if (error) {
            // Try direct execution if RPC fails
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({
                sql: statement
              })
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
          }

          successCount++;
          process.stdout.write('.');
        } catch (err) {
          errorCount++;
          console.error(`\n❌ Error executing statement: ${err.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }

      console.log(`\n✅ ${file}: ${successCount} successful, ${errorCount} errors\n`);
    }

    console.log('🎉 Deployment complete!');

    // Test a function
    console.log('\n🧪 Testing calculate_pearson_correlation function...');
    const { data, error } = await supabase.rpc('calculate_pearson_correlation', {
      x_values: [1, 2, 3, 4, 5],
      y_values: [2, 4, 6, 8, 10]
    });

    if (error) {
      console.error('❌ Test failed:', error.message);
    } else {
      console.log('✅ Test successful! Result:', data);
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution using admin API
async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

// Create a simpler deployment using Vercel API endpoint
async function deployViaVercelAPI() {
  console.log('🚀 Deploying functions via Vercel API...\n');

  const migrationFiles = [
    '01_core_analytics_functions.sql',
    '02_ml_rl_functions.sql',
    '03_advanced_analytics_functions.sql'
  ];

  for (const file of migrationFiles) {
    console.log(`📄 Reading ${file}...`);
    const sqlContent = await fs.readFile(
      path.join(process.cwd(), 'supabase-migration', file), 
      'utf8'
    );

    // Send to our API endpoint to execute
    const response = await fetch('https://hana-proxy-vercel-lfh5e5i6h-plturrells-projects.vercel.app/api/supabase-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'execute_migration',
        sql: sqlContent
      })
    });

    const result = await response.json();
    
    if (result.error) {
      console.error(`❌ Error deploying ${file}:`, result.error);
    } else {
      console.log(`✅ Successfully deployed ${file}`);
    }
  }
}

// Run deployment
if (process.argv.includes('--via-api')) {
  deployViaVercelAPI().catch(console.error);
} else {
  console.log('ℹ️  Note: This requires SUPABASE_SERVICE_KEY with admin privileges.');
  console.log('ℹ️  You can also deploy manually via Supabase Dashboard SQL Editor.\n');
  
  // For now, show instructions since we need service key
  console.log('📋 Manual deployment steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new');
  console.log('2. Copy contents of supabase-migration/00_complete_migration.sql');
  console.log('3. Paste and run in SQL Editor');
  console.log('4. Or run individual files in order: 01, 02, 03');
}