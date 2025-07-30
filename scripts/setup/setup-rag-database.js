#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = process.env.VERCEL_URL ? 
  `https://${process.env.VERCEL_URL}` : 
  'https://hana-proxy-vercel-1z43xw6mc-plturrells-projects.vercel.app';

async function setupRAGDatabase() {
  try {
    console.log('🚀 Setting up RAG database tables...');
    
    // First, check if we can connect to Supabase
    console.log('🔍 Testing Supabase connection...');
    
    const testResponse = await fetch(`${API_BASE}/api/supabase-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'select',
        table: 'information_schema.tables',
        query: 'table_name',
        filters: { table_schema: 'public' }
      })
    });
    
    if (!testResponse.ok) {
      const error = await testResponse.text();
      console.error('❌ Supabase connection failed:', error);
      console.log('');
      console.log('Please check:');
      console.log('1. SUPABASE_URL is set in Vercel environment variables');
      console.log('2. SUPABASE_ANON_KEY is set in Vercel environment variables'); 
      console.log('3. Supabase project is active and accessible');
      return false;
    }
    
    const tables = await testResponse.json();
    console.log('✅ Supabase connection successful');
    console.log(`📋 Found ${tables.data?.length || 0} existing tables`);
    
    // Check if RAG tables already exist
    const ragTables = ['documents', 'document_chunks'];
    const existingTables = tables.data?.map(t => t.table_name) || [];
    const missingTables = ragTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log('✅ RAG tables already exist');
      
      // Test RAG functionality
      console.log('🧪 Testing RAG system...');
      
      // Test document creation
      const testDoc = {
        title: 'Test Document',
        source_url: 'test.txt',
        metadata: { test: true },
        created_at: new Date().toISOString()
      };
      
      const createResponse = await fetch(`${API_BASE}/api/supabase-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert',
          table: 'documents',
          data: testDoc
        })
      });
      
      if (createResponse.ok) {
        console.log('✅ Document creation test passed');
        
        // Clean up test document
        const created = await createResponse.json();
        if (created.data?.[0]?.id) {
          await fetch(`${API_BASE}/api/supabase-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete',
              table: 'documents',
              filters: { id: created.data[0].id }
            })
          });
          console.log('🧹 Cleaned up test document');
        }
      } else {
        const error = await createResponse.text();
        console.log('❌ Document creation test failed:', error);
      }
      
      return true;
    }
    
    console.log(`❌ Missing RAG tables: ${missingTables.join(', ')}`);
    console.log('');
    console.log('RAG database setup requires manual setup:');
    console.log('');
    console.log('1. Go to your Supabase dashboard > SQL Editor');
    console.log('2. Copy and paste the contents of create-rag-tables.sql');
    console.log('3. Run the SQL to create tables and functions');
    console.log('4. Enable Row Level Security policies');
    console.log('');
    console.log('Or use Supabase CLI:');
    console.log('  supabase db push');
    console.log('');
    
    return false;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Run the setup
setupRAGDatabase().then(success => {
  if (success) {
    console.log('🎉 RAG database is ready!');
    console.log('You can now use the Knowledge section to upload and search documents.');
  } else {
    console.log('⚠️  RAG database needs manual setup.');
    console.log('The Knowledge section will show demo data until database is configured.');
  }
});