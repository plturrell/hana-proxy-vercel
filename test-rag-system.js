#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://hana-proxy-vercel-jencez0fz-plturrells-projects.vercel.app';

async function testRAGSystem() {
  console.log('🧪 Testing RAG System...\n');

  // Test 1: Check API health
  console.log('1️⃣ Testing API health...');
  try {
    const healthResponse = await fetch(`${API_URL}/api/supabase-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health' })
    });
    
    const healthData = await healthResponse.json();
    console.log('✅ API health:', healthData);
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
  }

  // Test 2: Check if RAG tables exist
  console.log('\n2️⃣ Checking RAG tables...');
  try {
    const tablesResponse = await fetch(`${API_URL}/api/supabase-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'select',
        table: 'documents',
        query: 'count'
      })
    });
    
    if (tablesResponse.ok) {
      const data = await tablesResponse.json();
      console.log('✅ Documents table exists');
    } else {
      const error = await tablesResponse.json();
      console.log('❌ Documents table missing:', error);
      
      // Provide instructions to create tables
      console.log('\n📝 To fix this, run the following SQL in Supabase Dashboard:');
      console.log('URL: https://supabase.com/dashboard/project/qupqqlxhtnoljlnkfpmc/sql/new');
      console.log('\nSQL to execute:');
      console.log(`
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_document_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Documents are viewable by everyone" 
ON documents FOR SELECT 
USING (true);

CREATE POLICY "Chunks are viewable by everyone" 
ON document_chunks FOR SELECT 
USING (true);
      `);
    }
  } catch (error) {
    console.error('❌ Table check failed:', error.message);
  }

  // Test 3: Check RAG process endpoint
  console.log('\n3️⃣ Testing RAG process endpoint...');
  try {
    const ragResponse = await fetch(`${API_URL}/api/rag/process`);
    const ragData = await ragResponse.json();
    console.log('✅ RAG endpoint response:', ragData);
  } catch (error) {
    console.error('❌ RAG endpoint failed:', error.message);
  }
}

// Run the test
testRAGSystem().catch(console.error);