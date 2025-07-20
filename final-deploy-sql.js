#!/usr/bin/env node

/**
 * Final SQL Deployment to Production Supabase
 * Creates all AI tables in the correct production project
 */

import { exec } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Final AI Deployment to Production\n');

// Production Supabase project details
const PRODUCTION_PROJECT_ID = 'qupqqlxhtnoljlnkfpmc';
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${PRODUCTION_PROJECT_ID}/sql/new`;

// Read the migration SQL
const sqlPath = join(__dirname, 'supabase', 'migrations', '20250720014816_create_ai_tables.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('📋 SQL Migration Ready:');
console.log(`   File: ${sqlPath}`);
console.log(`   Size: ${(sqlContent.length / 1024).toFixed(1)}KB`);
console.log(`   Tables: 8 AI tables + indexes + permissions\n`);

// Copy SQL to clipboard
const platform = process.platform;
let copyCommand;

if (platform === 'darwin') {
  copyCommand = `echo '${sqlContent.replace(/'/g, "'\\''")}' | pbcopy`;
} else if (platform === 'win32') {
  copyCommand = `echo '${sqlContent.replace(/"/g, '\\"')}' | clip`;
} else {
  copyCommand = `echo '${sqlContent.replace(/'/g, "'\\''")}' | xclip -selection clipboard`;
}

console.log('📋 Copying SQL to clipboard...');
exec(copyCommand, (error) => {
  if (!error) {
    console.log('✅ SQL copied to clipboard!\n');
  } else {
    console.log('⚠️  Could not copy to clipboard\n');
  }

  // Open Supabase SQL Editor
  console.log('🌐 Opening Production Supabase SQL Editor...');
  console.log(`   URL: ${SQL_EDITOR_URL}\n`);

  let openCommand;
  if (platform === 'darwin') {
    openCommand = `open "${SQL_EDITOR_URL}"`;
  } else if (platform === 'win32') {
    openCommand = `start "${SQL_EDITOR_URL}"`;
  } else {
    openCommand = `xdg-open "${SQL_EDITOR_URL}"`;
  }

  exec(openCommand, () => {
    console.log('📝 DEPLOYMENT STEPS:');
    console.log('1. The SQL is in your clipboard');
    console.log('2. Paste it in the SQL editor (Cmd+V or Ctrl+V)');
    console.log('3. Click "Run"');
    console.log('4. Wait for all statements to complete\n');

    console.log('📊 This will create:');
    console.log('   • a2a_agents table');
    console.log('   • a2a_messages table');
    console.log('   • breaking_news_alerts table');
    console.log('   • news_sentiment_analysis table');
    console.log('   • news_market_impact table');
    console.log('   • news_entity_extractions table');
    console.log('   • agent_activity table');
    console.log('   • agent_blockchain_activities table');
    console.log('   • All indexes and permissions\n');

    console.log('🎯 After running the SQL:');
    console.log('   Test: https://hana-proxy-vercel-mnbgl14ok-plturrells-projects.vercel.app/api/news-intelligence-verify?action=verify-all');
    console.log('   Expected: All features should show as "working" ✅\n');

    console.log('⏰ This is the final step to complete AI deployment!');
  });
});

// Also save SQL for manual reference
const manualSqlPath = join(__dirname, 'PRODUCTION_DEPLOY.sql');
fs.writeFileSync(manualSqlPath, sqlContent);
console.log(`💾 SQL also saved to: ${manualSqlPath}`);