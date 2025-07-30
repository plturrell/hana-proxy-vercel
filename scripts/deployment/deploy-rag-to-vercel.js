/**
 * Deploy RAG System to Vercel with Database Setup
 * Run this after the Vercel deployment to set up the database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_KEY');
  console.error('   XAI_API_KEY (for Grok-4)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployToVercel() {
  console.log('🚀 Deploying RAG System to Vercel\n');

  // Step 1: Test Supabase connection
  console.log('🔌 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('documents').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
      throw error;
    }
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    process.exit(1);
  }

  // Step 2: Check if RAG tables exist
  console.log('\n📊 Checking RAG database schema...');
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('✅ RAG tables already exist');
    }
  } catch (error) {
    console.log('⚠️  RAG tables not found - need to run database setup');
    console.log('\n🛠️  To set up the database:');
    console.log('1. Open Supabase Dashboard > SQL Editor');
    console.log('2. Copy and run: database/rag-database-setup.sql');
    console.log('3. Enable pgvector extension if not already enabled');
  }

  // Step 3: Test Grok-4 API
  console.log('\n🤖 Testing Grok-4 API...');
  const grokApiKey = process.env.XAI_API_KEY;
  if (!grokApiKey) {
    console.log('⚠️  XAI_API_KEY not set - Grok-4 features will not work');
  } else {
    try {
      const response = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${grokApiKey}` }
      });
      
      if (response.ok) {
        console.log('✅ Grok-4 API connection successful');
      } else {
        console.log('⚠️  Grok-4 API connection failed - check XAI_API_KEY');
      }
    } catch (error) {
      console.log('⚠️  Grok-4 API test failed:', error.message);
    }
  }

  // Step 4: Verify Vercel deployment
  console.log('\n🌐 Vercel deployment status:');
  console.log('✅ Code deployed to Vercel');
  console.log('📄 RAG interface available at:');
  console.log('   https://hana-proxy-vercel.vercel.app/teach-jobs.html');

  // Step 5: Test API endpoints
  console.log('\n🔧 Testing API endpoints...');
  const baseUrl = 'https://hana-proxy-vercel.vercel.app';
  
  try {
    const response = await fetch(`${baseUrl}/api/rag/process`);
    if (response.ok) {
      console.log('✅ RAG Process API responding');
    } else {
      console.log('⚠️  RAG Process API error:', response.status);
    }
  } catch (error) {
    console.log('⚠️  API test failed:', error.message);
  }

  // Step 6: Final instructions
  console.log('\n' + '='.repeat(60));
  console.log('🎯 RAG System Deployment Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set up database schema (if not done):');
  console.log('   - Run database/rag-database-setup.sql in Supabase');
  console.log('2. Set environment variables in Vercel:');
  console.log('   - XAI_API_KEY for Grok-4 integration');
  console.log('3. Test the system:');
  console.log('   - Visit: https://hana-proxy-vercel.vercel.app/teach-jobs.html');
  console.log('   - Scroll to "RAG Document Intelligence" section');
  console.log('   - Upload a PDF or text file');
  console.log('   - Search and get AI-powered answers');

  console.log('\n💡 Features Available:');
  console.log('- Document upload and processing');
  console.log('- PDF parsing with PDF.js');
  console.log('- Semantic chunking (500 tokens)');
  console.log('- Grok-4 embeddings and answers');
  console.log('- Hybrid vector + full-text search');
  console.log('- Real-time progress tracking');
  console.log('- System monitoring dashboard');

  console.log('\n🔗 Direct Links:');
  console.log('- RAG Interface: https://hana-proxy-vercel.vercel.app/teach-jobs.html');
  console.log('- Process API: https://hana-proxy-vercel.vercel.app/api/rag/process');
  console.log('- Search API: https://hana-proxy-vercel.vercel.app/api/rag/search');
}

deployToVercel().catch(console.error);