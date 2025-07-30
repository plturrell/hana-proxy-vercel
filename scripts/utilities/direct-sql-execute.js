#!/usr/bin/env node
/**
 * Direct SQL Execution using pg client
 * Executes the cleanup migration directly
 */

import pg from 'pg';
import fs from 'fs/promises';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config();

async function executeMigration() {
  console.log('🤖 DIRECT SQL MIGRATION EXECUTION');
  console.log('='.repeat(60));
  
  // Read the migration file
  const migrationSQL = await fs.readFile(
    './supabase/migrations/20250118000000_cleanup_a2a_registry.sql', 
    'utf-8'
  );
  
  console.log('📋 Migration loaded: 20250118000000_cleanup_a2a_registry.sql');
  console.log('\n📊 This will:');
  console.log('   1. Create backup of current a2a_agents table');
  console.log('   2. Delete all computational functions');
  console.log('   3. Keep only 9 true autonomous agents');
  console.log('   4. Log the migration results');
  
  // Try to find database URL from various sources
  let connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL ||
                        process.env.POSTGRES_URL_NON_POOLING;
  
  if (!connectionString) {
    // Try to construct from .env.local
    try {
      const envLocal = await fs.readFile('.env.local', 'utf-8');
      const match = envLocal.match(/POSTGRES_URL[^=]*=["']?([^"'\n]+)/);
      if (match) {
        connectionString = match[1];
      }
    } catch (e) {
      // Ignore if .env.local doesn't exist
    }
  }
  
  if (!connectionString) {
    console.error('\n❌ No database connection found.');
    console.log('\n📝 Manual execution required:');
    console.log('1. Copy the migration file contents');
    console.log('2. Go to: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new');
    console.log('3. Paste and execute');
    return;
  }
  
  console.log('\n🔗 Database connection found');
  console.log('\n⚠️  WARNING: This will modify your production database!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const client = new Client({ connectionString });
  
  try {
    console.log('\n📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    console.log('\n🚀 Executing migration...');
    
    // Execute the migration
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully!');
    
    // Get final count
    const countResult = await client.query('SELECT COUNT(*) FROM a2a_agents');
    const finalCount = parseInt(countResult.rows[0].count);
    
    console.log(`\n📊 Final results:`);
    console.log(`   Remaining agents: ${finalCount}`);
    console.log(`   Status: ${finalCount === 9 ? '✅ SUCCESS' : '⚠️  WARNING'}`);
    
    // Show remaining agents
    const agentsResult = await client.query(
      'SELECT agent_id FROM a2a_agents ORDER BY agent_id'
    );
    
    console.log('\n🤖 Remaining agents:');
    agentsResult.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.agent_id}`);
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\nPlease execute manually in Supabase Dashboard.');
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed.');
  }
}

// Execute
executeMigration().catch(console.error);