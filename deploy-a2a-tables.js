/**
 * Deploy A2A Analytics Tables to Supabase
 * Executes SQL files to create all necessary tables and insert agents
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// SQL files to execute in order
const SQL_FILES = [
  'database/create-analytics-agents.sql',
  'database/create-analytics-agents-ord-a2a.sql'
];

async function executeSQLFile(filePath) {
  console.log(`\n📄 Executing ${path.basename(filePath)}...`);
  
  try {
    // Read SQL file
    const sql = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    
    // Split by semicolons but be careful with functions/procedures
    const statements = sql
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      // Skip comments and empty statements
      if (statement.match(/^\s*--/) || statement.match(/^\s*;?\s*$/)) {
        continue;
      }
      
      try {
        // Use Supabase's rpc to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          // If exec_sql doesn't exist, try alternative approach
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            // For now, we'll need to execute these manually
            console.log(`  ⚠️  Statement requires manual execution (no exec_sql function)`);
            errorCount++;
          } else {
            console.log(`  ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
          process.stdout.write('.');
        }
      } catch (err) {
        console.log(`  ❌ Statement error: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    
    return { successCount, errorCount };
  } catch (error) {
    console.error(`  💥 Failed to read file: ${error.message}`);
    return { successCount: 0, errorCount: 1 };
  }
}

async function deployTables() {
  console.log('🚀 Starting A2A Tables Deployment');
  console.log('📍 Target: Supabase');
  console.log('='.repeat(60));
  
  // Check if we have proper credentials
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
    
    // Generate SQL for manual execution
    console.log('\n📋 Manual Execution Instructions:');
    console.log('1. Go to your Supabase SQL Editor');
    console.log('2. Copy and execute the following SQL:\n');
    
    for (const sqlFile of SQL_FILES) {
      const sql = fs.readFileSync(path.join(__dirname, sqlFile), 'utf8');
      console.log(`-- ${sqlFile}`);
      console.log(sql);
      console.log('\n' + '-'.repeat(60) + '\n');
    }
    
    return;
  }
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  // Execute each SQL file
  for (const sqlFile of SQL_FILES) {
    const result = await executeSQLFile(sqlFile);
    totalSuccess += result.successCount;
    totalErrors += result.errorCount;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Deployment Summary:');
  console.log(`  ✅ Total Successful Statements: ${totalSuccess}`);
  console.log(`  ❌ Total Failed Statements: ${totalErrors}`);
  
  // Verify deployment
  console.log('\n🔍 Verifying deployment...');
  
  try {
    // Check if a2a_agents table exists and has data
    const { data: agents, error: agentsError } = await supabase
      .from('a2a_agents')
      .select('count')
      .eq('type', 'analytics');
    
    if (!agentsError) {
      console.log(`  ✅ a2a_agents table exists`);
      const { count } = await supabase
        .from('a2a_agents')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'analytics');
      console.log(`  📊 Analytics agents count: ${count || 0}`);
    } else {
      console.log(`  ❌ a2a_agents table check failed: ${agentsError.message}`);
    }
    
    // Check ORD resources
    const { error: ordError } = await supabase
      .from('ord_analytics_resources')
      .select('count')
      .limit(1);
    
    if (!ordError) {
      console.log(`  ✅ ord_analytics_resources table exists`);
    } else {
      console.log(`  ❌ ord_analytics_resources table check failed: ${ordError.message}`);
    }
    
    // Check PRDORD table
    const { error: prdordError } = await supabase
      .from('prdord_analytics')
      .select('count')
      .limit(1);
    
    if (!prdordError) {
      console.log(`  ✅ prdord_analytics table exists`);
    } else {
      console.log(`  ❌ prdord_analytics table check failed: ${prdordError.message}`);
    }
    
  } catch (error) {
    console.error('  ❌ Verification failed:', error.message);
  }
  
  // If tables don't exist, provide alternative approach
  if (totalErrors > 0) {
    console.log('\n⚠️  Some statements failed. This usually means:');
    console.log('  1. The exec_sql function is not available');
    console.log('  2. Or you need service role key for DDL operations');
    console.log('\n📋 Alternative: Use Supabase SQL Editor');
    console.log('  1. Go to: https://supabase.com/dashboard/project/_/sql/new');
    console.log('  2. Copy the SQL from the files above');
    console.log('  3. Execute in the SQL editor');
    
    // Generate combined SQL file
    const combinedSQL = SQL_FILES.map(sqlFile => {
      const sql = fs.readFileSync(path.join(__dirname, sqlFile), 'utf8');
      return `-- ${sqlFile}\n${sql}`;
    }).join('\n\n');
    
    const outputPath = path.join(__dirname, 'deploy-a2a-tables-combined.sql');
    fs.writeFileSync(outputPath, combinedSQL);
    console.log(`\n  📄 Combined SQL saved to: ${outputPath}`);
  }
  
  console.log('\n✨ Deployment process complete');
}

// Run deployment
deployTables()
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });