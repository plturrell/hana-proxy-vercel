#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployQASchema() {
  console.log('🚀 Deploying Agent QA System Database Schema...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./supabase-migration/agent_qa_system.sql', 'utf8');
    
    // Split into individual statements (basic approach)
    const statements = sql
      .split(/;\s*\n/)
      .filter(stmt => {
        const trimmed = stmt.trim();
        return trimmed && 
               !trimmed.startsWith('--') && 
               !trimmed.startsWith('/*') && 
               trimmed !== '';
      })
      .map(stmt => stmt.trim() + ';');
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use RPC to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_statement: statement 
        });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Deployment Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Warnings/Errors: ${errorCount}`);
    console.log(`   📄 Total: ${statements.length}`);
    
    // Test if tables were created
    console.log(`\n🔍 Verifying table creation...`);
    
    const tables = ['agent_versions', 'agent_evaluations', 'agent_recommendations', 'agent_enhancement_backlog', 'agent_audit_logs'];
    let tablesCreated = 0;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          console.log(`   ✅ Table ${table} exists`);
          tablesCreated++;
        } else {
          console.log(`   ❌ Table ${table} not found: ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ Table ${table} check failed: ${err.message}`);
      }
    }
    
    console.log(`\n🎯 Tables created: ${tablesCreated}/${tables.length}`);
    
    if (tablesCreated === tables.length) {
      console.log(`\n🎉 Agent QA System deployed successfully!`);
      console.log(`\nNext steps:`);
      console.log(`1. Set OPENAI_API_KEY in Vercel environment`);
      console.log(`2. Deploy to Vercel: vercel --prod`);
      console.log(`3. Visit /agent-qa-dashboard.html to start monitoring`);
    } else {
      console.log(`\n⚠️  Deployment incomplete. Some tables were not created.`);
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployQASchema();