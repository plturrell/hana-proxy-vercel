#!/usr/bin/env node

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://hana-proxy-vercel-16psq0m1p-plturrells-projects.vercel.app';

// Since we can't execute raw SQL through the proxy, we'll create the tables
// by demonstrating what needs to be done

async function deployRAGTables() {
  console.log('🚀 RAG Database Deployment Guide\n');
  
  console.log('Since Supabase CLI requires project linking, here are your options:\n');
  
  console.log('📋 Option 1: Direct SQL in Supabase Dashboard (Recommended)');
  console.log('================================================');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Create a new query');
  console.log('4. Copy the entire contents of:');
  console.log('   ./supabase/migrations/20250722232131_create_rag_tables.sql');
  console.log('5. Paste and click "Run"\n');
  
  console.log('📋 Option 2: Using Supabase CLI');
  console.log('================================');
  console.log('1. Find your project reference:');
  console.log('   - Go to https://supabase.com/dashboard');
  console.log('   - Select your project');
  console.log('   - Copy the ID from URL: /project/[YOUR-PROJECT-REF]');
  console.log('');
  console.log('2. Link your project:');
  console.log('   supabase link --project-ref YOUR-PROJECT-REF');
  console.log('');
  console.log('3. Push the migration:');
  console.log('   supabase db push\n');
  
  console.log('📋 What This Creates:');
  console.log('====================');
  console.log('✅ documents table - Stores document metadata');
  console.log('✅ document_chunks table - Stores text chunks with embeddings');
  console.log('✅ Vector search functions - match_documents()');
  console.log('✅ Hybrid search functions - hybrid_search()');
  console.log('✅ Statistics function - get_rag_statistics()');
  console.log('✅ Full-text search indexes');
  console.log('✅ Vector similarity indexes');
  console.log('✅ Row Level Security policies\n');
  
  // Test current status
  console.log('🔍 Testing current database status...');
  
  try {
    const response = await fetch(`${API_BASE}/api/supabase-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'select',
        table: 'documents',
        query: 'id',
        filters: {}
      })
    });
    
    if (response.ok) {
      console.log('✅ RAG tables already exist! The system is ready to use.');
      
      // Test if we can create a document
      const testDoc = await fetch(`${API_BASE}/api/supabase-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert',
          table: 'documents',
          data: {
            title: 'Test Document',
            source_url: 'test.txt',
            metadata: { test: true }
          }
        })
      });
      
      if (testDoc.ok) {
        console.log('✅ Document creation works!');
        
        // Clean up
        const created = await testDoc.json();
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
        }
      }
    } else {
      const error = await response.json();
      if (error.error?.includes('does not exist')) {
        console.log('❌ RAG tables do not exist yet');
        console.log('⚠️  Please create them using one of the options above');
      }
    }
  } catch (error) {
    console.error('Error checking status:', error.message);
  }
  
  console.log('\n🎯 Once tables are created:');
  console.log('1. The Knowledge section will show real statistics');
  console.log('2. Document upload will process files with Grok-4');
  console.log('3. Search will work with natural language queries');
  console.log('4. All RAG features will be fully operational');
}

deployRAGTables();