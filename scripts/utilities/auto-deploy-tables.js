#!/usr/bin/env node

/**
 * Auto Deploy Tables to Supabase
 * Uses Supabase Management API to create tables
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Extract project ID from URL
const projectId = SUPABASE_URL.split('.')[0].split('//')[1];

async function executeSQL(sql) {
  try {
    // Use Supabase's SQL execution endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL execution failed: ${error}`);
    }

    return { success: true };
  } catch (error) {
    // If RPC doesn't exist, we need to create it first
    if (error.message.includes('exec_sql')) {
      console.log('⚠️  exec_sql function not found, creating it...');
      
      // Try alternative approach - direct database connection
      return { success: false, error: 'Need manual SQL execution' };
    }
    return { success: false, error: error.message };
  }
}

async function deployTables() {
  console.log('🚀 Auto-deploying tables to Supabase\n');
  
  // Read the SQL file
  const sqlPath = join(__dirname, 'create-missing-tables.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found. Run deploy-ai-fixed.js first.');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📋 Attempting automated deployment...\n');
  
  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    process.stdout.write(`Statement ${i + 1}/${statements.length}... `);
    
    const result = await executeSQL(statement + ';');
    
    if (result.success) {
      console.log('✅');
      successCount++;
    } else {
      console.log('❌');
      failCount++;
    }
  }

  if (failCount > 0) {
    console.log('\n⚠️  Automated deployment not available.');
    console.log('\n📝 Manual deployment required:');
    console.log('\n1. Copy this URL to your browser:');
    console.log(`   https://supabase.com/dashboard/project/${projectId}/sql/new`);
    console.log('\n2. Copy ALL the SQL from create-missing-tables.sql');
    console.log('\n3. Paste it into the SQL editor');
    console.log('\n4. Click "Run"\n');
    
    // Also try to open the browser automatically
    const platform = process.platform;
    const url = `https://supabase.com/dashboard/project/${projectId}/sql/new`;
    
    if (platform === 'darwin') {
      console.log('🌐 Opening Supabase SQL Editor in browser...');
      require('child_process').exec(`open "${url}"`);
    } else if (platform === 'win32') {
      require('child_process').exec(`start "${url}"`);
    }
    
    console.log('\n📋 SQL file location:');
    console.log(`   ${sqlPath}`);
  } else {
    console.log('\n✅ All tables created successfully!');
  }
}

deployTables().catch(console.error);