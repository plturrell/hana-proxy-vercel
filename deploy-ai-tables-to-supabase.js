/**
 * Deploy AI Storage Tables to Supabase
 * Automatically creates all required tables for structured outputs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deployTables() {
  console.log('🚀 Deploying AI Storage Tables to Supabase...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'ai-storage-tables-manual.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Extract table/view name for logging
      const tableMatch = statement.match(/CREATE\s+(?:TABLE|INDEX|VIEW|POLICY)\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:OR\s+REPLACE\s+)?["']?(\w+)["']?/i);
      const alterMatch = statement.match(/ALTER\s+TABLE\s+["']?(\w+)["']?/i);
      const grantMatch = statement.match(/GRANT\s+\w+\s+ON\s+(?:ALL\s+TABLES|["']?(\w+)["']?)/i);
      
      const objectName = tableMatch?.[1] || alterMatch?.[1] || (grantMatch ? 'permissions' : `Statement ${i + 1}`);

      try {
        // For RLS policies, we need to handle them differently
        if (statement.includes('CREATE POLICY')) {
          // Check if policy already exists
          const policyName = statement.match(/CREATE\s+POLICY\s+["']([^"']+)["']/i)?.[1];
          if (policyName) {
            console.log(`📝 Creating policy: ${policyName}`);
          }
        }

        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        }).single();

        if (error) {
          // Check if it's a "already exists" error
          if (error.message?.includes('already exists') || error.code === '42P07') {
            console.log(`⏭️  ${objectName}: Already exists (skipped)`);
            results.skipped.push(objectName);
          } else {
            console.error(`❌ ${objectName}: ${error.message}`);
            results.failed.push({ name: objectName, error: error.message });
          }
        } else {
          console.log(`✅ ${objectName}: Created successfully`);
          results.success.push(objectName);
        }
      } catch (err) {
        console.error(`❌ ${objectName}: ${err.message}`);
        results.failed.push({ name: objectName, error: err.message });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Deployment Summary:');
    console.log('─'.repeat(40));
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`⏭️  Skipped (already exists): ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\n❌ Failed operations:');
      results.failed.forEach(({ name, error }) => {
        console.log(`   - ${name}: ${error}`);
      });
    }

    // Test connection to verify tables
    console.log('\n🔍 Verifying table creation...\n');
    const tablesToCheck = [
      'ai_analysis_log',
      'market_predictions',
      'compliance_predictions',
      'market_anomalies'
    ];

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table}: Not accessible - ${error.message}`);
        } else {
          console.log(`✅ ${table}: Ready (${count || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Error - ${err.message}`);
      }
    }

    console.log('\n🎉 Deployment complete!');
    console.log('📝 Next steps:');
    console.log('   1. Run: node test-ai-database-integration.js');
    console.log('   2. Check Supabase dashboard for created tables');
    console.log('   3. Monitor ai_analysis_log for AI interactions');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution if RPC doesn't work
async function executeDirectSQL(statement) {
  try {
    // This is a fallback method using the Supabase REST API
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql_query: statement })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Check if exec_sql function exists
async function checkExecSQLFunction() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: 'SELECT 1' 
    });

    if (error) {
      console.log('⚠️  exec_sql function not found. Creating it...\n');
      
      // Create the exec_sql function
      const createFunction = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$;
      `;

      // We'll need to create this manually in Supabase
      console.log('📝 Please create the following function in Supabase SQL Editor:');
      console.log('─'.repeat(60));
      console.log(createFunction);
      console.log('─'.repeat(60));
      console.log('\n Then run this script again.');
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

// Run deployment
(async () => {
  console.log('🔧 AI Storage Tables Deployment Tool');
  console.log('=====================================\n');

  // Check if we have exec_sql function
  const hasExecSQL = await checkExecSQLFunction();
  
  if (!hasExecSQL) {
    console.log('\n💡 Alternative: Run ai-storage-tables-manual.sql directly in Supabase SQL Editor');
    process.exit(0);
  }

  await deployTables();
})().catch(console.error);