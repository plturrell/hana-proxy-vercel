/**
 * Test Knowledge Base functionality on live Vercel deployment
 */

import fetch from 'node-fetch';

const VERCEL_URL = 'https://hana-proxy-vercel.vercel.app';
const TEST_ENDPOINTS = {
  documents: '/api/rag/documents',
  process: '/api/rag/process',
  search: '/api/rag/search'
};

async function testEndpoint(name, endpoint, options = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  try {
    const response = await fetch(`${VERCEL_URL}${endpoint}`, options);
    const contentType = response.headers.get('content-type');
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`📊 Response:`, JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log(`📝 Response: ${text.substring(0, 200)}...`);
      return { success: response.ok, text };
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testKnowledgeBase() {
  console.log('🚀 Testing Knowledge Base on Vercel Deployment');
  console.log(`📍 URL: ${VERCEL_URL}`);
  console.log('='.repeat(50));

  // Test 1: Check if documents endpoint returns list
  const docsResult = await testEndpoint('Document List', TEST_ENDPOINTS.documents, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  // Test 2: Check process endpoint status
  const processResult = await testEndpoint('Process Status', TEST_ENDPOINTS.process, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  // Test 3: Test search endpoint
  const searchResult = await testEndpoint('Search', TEST_ENDPOINTS.search, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      query: 'test query',
      limit: 5
    })
  });

  // Test 4: Check teach page
  const teachPageResult = await testEndpoint('Teach Page', '/teach-jobs.html', {
    method: 'GET'
  });

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('='.repeat(50));
  console.log(`Documents API: ${docsResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Process API: ${processResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Search API: ${searchResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Teach Page: ${teachPageResult.success ? '✅ Accessible' : '❌ Not Found'}`);

  // Check if documents are being returned
  if (docsResult.success && docsResult.data) {
    console.log(`\n📚 Documents in system: ${docsResult.data.documents ? docsResult.data.documents.length : 0}`);
  }

  // Check RAG statistics
  if (processResult.success && processResult.data && processResult.data.statistics) {
    console.log('\n📈 RAG Statistics:');
    console.log(`   Total Documents: ${processResult.data.statistics.totalDocuments || 0}`);
    console.log(`   Total Chunks: ${processResult.data.statistics.totalChunks || 0}`);
    console.log(`   Storage Used: ${processResult.data.statistics.storageUsedMB || 0} MB`);
  }
}

// Run tests
testKnowledgeBase().catch(console.error);