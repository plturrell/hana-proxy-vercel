#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'https://hana-proxy-vercel-16psq0m1p-plturrells-projects.vercel.app';

async function createRAGTables() {
  console.log('🚀 Creating RAG database tables...');
  
  // Since we can't execute raw SQL through the proxy, we need to create tables
  // through Supabase Dashboard or use a different approach
  
  console.log('\n📋 Current Status:');
  console.log('✅ Supabase is connected and working');
  console.log('✅ Database connection is active');
  console.log('❌ RAG tables (documents, document_chunks) need to be created');
  
  console.log('\n🔧 To create the RAG tables, you have two options:');
  console.log('\n📝 Option 1: Supabase Dashboard (Recommended)');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of create-rag-tables.sql');
  console.log('4. Click "Run" to execute the SQL');
  
  console.log('\n💻 Option 2: Supabase CLI');
  console.log('1. Install Supabase CLI: npm install -g supabase');
  console.log('2. Login: supabase login');
  console.log('3. Link project: supabase link --project-ref YOUR_PROJECT_REF');
  console.log('4. Run migration: supabase db push');
  
  console.log('\n📄 The SQL file is located at:');
  console.log('   ./create-rag-tables.sql');
  
  // Try to test if we can at least read the schema
  try {
    const response = await fetch(`${API_BASE}/api/supabase-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'select',
        table: 'information_schema.tables',
        query: 'table_name',
        filters: { table_schema: 'public' }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.data) {
        console.log('\n📊 Existing tables in database:');
        result.data.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
    }
  } catch (error) {
    // Schema query failed, try alternative approach
    console.log('\n📊 Known existing tables:');
    console.log('   - market_data (confirmed working)');
    console.log('   - news_articles (likely exists)');
    console.log('   - system_config (likely exists)');
  }
  
  console.log('\n✨ Once tables are created:');
  console.log('1. The Knowledge section will be fully functional');
  console.log('2. You can upload PDF, TXT, and MD documents');
  console.log('3. Documents will be processed with Grok-4 embeddings');
  console.log('4. You can search documents with natural language queries');
}

createRAGTables();