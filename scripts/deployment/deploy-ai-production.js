#!/usr/bin/env node

/**
 * Deploy AI to Production
 * Creates all required database tables and sets up the system
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployAIProduction() {
  console.log('🚀 Deploying AI to Production\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('='.repeat(60));

  // Read the SQL file
  const sqlPath = join(__dirname, 'create-all-tables.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`\n📋 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip the final SELECT verification for now
    if (statement.includes('Tables created successfully!')) {
      continue;
    }

    process.stdout.write(`Statement ${i + 1}/${statements.length}... `);

    try {
      // Use the Supabase SQL function if available
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      }).catch(async (rpcError) => {
        // If RPC doesn't exist, try direct execution
        console.log('(using direct query)');
        return await supabase.from('_sql').select(statement);
      });

      if (error) {
        console.log('❌');
        errors.push(`Statement ${i + 1}: ${error.message}`);
        errorCount++;
      } else {
        console.log('✅');
        successCount++;
      }
    } catch (e) {
      console.log('❌');
      errors.push(`Statement ${i + 1}: ${e.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed\n`);

  if (errors.length > 0) {
    console.log('❌ Errors encountered:');
    errors.forEach(err => console.log(`   - ${err}`));
  }

  // Verify tables were created
  console.log('\n🔍 Verifying tables...\n');
  const tablesToCheck = [
    'a2a_agents',
    'a2a_messages', 
    'breaking_news_alerts',
    'news_sentiment_analysis',
    'news_market_impact',
    'news_entity_extractions'
  ];

  let tablesCreated = 0;
  for (const table of tablesToCheck) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✅ ${table} exists`);
      tablesCreated++;
    } else {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  
  if (tablesCreated === tablesToCheck.length) {
    console.log('\n✅ All tables created successfully!');
    console.log('\n🎉 AI Features are now ready for production!');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Add these to Vercel Environment Variables:');
    console.log(`   PERPLEXITY_API_KEY=${process.env.PERPLEXITY_API_KEY}`);
    console.log(`   GROK_API_KEY=${process.env.GROK_API_KEY}`);
    console.log(`   XAI_API_KEY=${process.env.GROK_API_KEY}`);
    console.log('\n2. Redeploy to Vercel: vercel --prod');
    console.log('\n3. Test the API:');
    console.log('   curl https://your-app.vercel.app/api/news-intelligence-verify?action=verify-all');
  } else {
    console.log('\n⚠️  Some tables are missing.');
    console.log('\n💡 Alternative: Copy the SQL from create-all-tables.sql');
    console.log('   and run it manually in Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}/sql/new`);
  }

  // Test API keys
  console.log('\n🔑 Testing API Keys...\n');
  
  // Test new Grok key
  if (process.env.GROK_API_KEY) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-2',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        console.log('✅ Grok API key is valid!');
      } else {
        const error = await response.text();
        console.log(`❌ Grok API key issue: ${response.status}`);
        console.log(`   ${error.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`❌ Grok API test failed: ${e.message}`);
    }
  }

  process.exit(0);
}

deployAIProduction().catch(console.error);