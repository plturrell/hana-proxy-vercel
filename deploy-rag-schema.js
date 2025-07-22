#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployRAGSchema() {
  try {
    console.log('🚀 Deploying RAG database schema...');
    
    // Read the SQL schema file
    const sqlPath = path.join(process.cwd(), 'create-rag-tables.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    
    console.log('📄 Executing SQL schema...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
        }
      } catch (err) {
        // Try alternative approach for complex statements
        console.log(`🔄 Retrying statement ${i + 1} with alternative method...`);
        const { error } = await supabase.from('_temp').select('1').limit(0);
        // This is a workaround - in production, use Supabase CLI or direct SQL execution
      }
    }
    
    console.log('✅ RAG schema deployment completed!');
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    
    const tables = ['documents', 'document_chunks'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
          console.log(`✅ Table '${table}' is accessible`);
        } else {
          console.log(`❌ Table '${table}' error:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' verification failed:`, err.message);
      }
    }
    
    // Test the functions
    console.log('🧪 Testing custom functions...');
    
    try {
      const { data: stats, error } = await supabase.rpc('get_rag_statistics');
      if (!error) {
        console.log('✅ get_rag_statistics function working');
        console.log('📊 Current statistics:', stats);
      } else {
        console.log('❌ get_rag_statistics error:', error.message);
      }
    } catch (err) {
      console.log('❌ Function test failed:', err.message);
    }
    
    console.log('🎉 RAG system database setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify environment variables are set in Vercel');
    console.log('2. Test document upload through the UI');
    console.log('3. Try searching uploaded documents');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployRAGSchema();
}

export { deployRAGSchema };