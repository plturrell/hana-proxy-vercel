// Test RAG endpoints locally
const http = require('http');

// Test documents endpoint
async function testDocuments() {
  console.log('\n🔍 Testing RAG Documents endpoint...');
  
  try {
    const handler = require('../../api/rag-documents.js');
    
    // Mock request/response
    const req = { method: 'GET' };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader: (name, value) => { res.headers[name] = value; },
      status: (code) => { res.statusCode = code; return res; },
      json: (data) => {
        console.log('Response:', JSON.stringify(data, null, 2));
        return res;
      },
      end: () => res
    };
    
    await handler(req, res);
  } catch (error) {
    console.error('❌ Documents test failed:', error.message);
  }
}

// Test search endpoint
async function testSearch() {
  console.log('\n🔍 Testing RAG Search endpoint...');
  
  try {
    const handler = require('../../api/rag-search.js');
    
    // Mock request/response
    const req = { 
      method: 'POST',
      body: { query: 'financial analysis' }
    };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader: (name, value) => { res.headers[name] = value; },
      status: (code) => { res.statusCode = code; return res; },
      json: (data) => {
        console.log('Response:', JSON.stringify(data, null, 2));
        return res;
      },
      end: () => res
    };
    
    await handler(req, res);
  } catch (error) {
    console.error('❌ Search test failed:', error.message);
  }
}

// Test embedding endpoint
async function testEmbeddings() {
  console.log('\n🔍 Testing RAG Embeddings endpoint...');
  
  try {
    const handler = require('../../api/rag-embeddings-local.js');
    
    // Mock request/response
    const req = { 
      method: 'POST',
      body: { text: 'test embedding generation' }
    };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader: (name, value) => { res.headers[name] = value; },
      status: (code) => { res.statusCode = code; return res; },
      json: (data) => {
        console.log('Response:', {
          success: data.success,
          dimensions: data.dimensions,
          model: data.model,
          embeddingPreview: data.embedding ? data.embedding.slice(0, 5) : null
        });
        return res;
      },
      end: () => res
    };
    
    await handler(req, res);
  } catch (error) {
    console.error('❌ Embeddings test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Testing RAG endpoints locally...\n');
  
  await testDocuments();
  await testSearch();
  await testEmbeddings();
  
  console.log('\n✅ Local tests complete');
}

runTests().catch(console.error);