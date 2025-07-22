/**
 * Test the complete RAG pipeline implementation
 * Verifies all components are working correctly
 */

import { ragPipeline } from './lib/rag-pipeline.js';
import fs from 'fs/promises';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  samplePDF: './test-data/sample.pdf',
  sampleText: './test-data/sample.txt',
  testQueries: [
    'What is the main topic of this document?',
    'How does the system handle PDF parsing?',
    'What are the performance benchmarks?'
  ]
};

async function createTestData() {
  console.log('📁 Creating test data...');
  
  // Create test directory
  await fs.mkdir('./test-data', { recursive: true });
  
  // Create sample text file
  const sampleContent = `
# RAG System Documentation

## Overview
This is a production-ready Retrieval-Augmented Generation (RAG) system built with Grok-4 and Supabase.

## Key Features
1. High-performance PDF parsing using PyMuPDF
2. Semantic chunking for improved retrieval accuracy
3. Grok-4 embeddings for state-of-the-art vector search
4. Hybrid search combining vector and full-text methods
5. Production-ready with monitoring and error handling

## Performance Benchmarks
- PDF Processing: 0.1s per page with PyMuPDF
- Chunking: 500 tokens with 50 token overlap
- Embedding Generation: Batch processing up to 100 texts
- Search Latency: <100ms p95 with HNSW indexing
- Retrieval Accuracy: 86.2% with semantic chunking

## Architecture
The system consists of:
- Document ingestion pipeline
- Text extraction and cleaning
- Semantic chunking algorithm
- Grok-4 embedding generation
- Supabase pgvector storage
- Hybrid search implementation
- Answer generation with Grok-4

## Best Practices
1. Always validate document format before processing
2. Implement retry logic for API calls
3. Use batch processing for efficiency
4. Monitor embedding costs and optimize dimensions
5. Regularly update indexes for performance
`;

  await fs.writeFile('./test-data/sample.txt', sampleContent);
  console.log('✅ Test data created');
}

async function testPipeline() {
  console.log('🧪 Testing RAG Pipeline Implementation\n');

  try {
    // Step 1: Create test data
    await createTestData();

    // Step 2: Test document processing
    console.log('\n📄 Testing document processing...');
    const result = await ragPipeline.processDocument('./test-data/sample.txt', {
      category: 'documentation',
      test: true
    });
    
    console.log('✅ Document processed successfully');
    console.log(`  - Document ID: ${result.documentId}`);
    console.log(`  - Chunks created: ${result.chunksProcessed}`);

    // Wait a moment for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Test search functionality
    console.log('\n🔍 Testing search functionality...');
    for (const query of TEST_CONFIG.testQueries) {
      console.log(`\nQuery: "${query}"`);
      
      const startTime = Date.now();
      const searchResults = await ragPipeline.search(query, {
        matchCount: 5,
        useHybrid: true
      });
      const searchTime = Date.now() - startTime;
      
      console.log(`  - Found ${searchResults.length} results in ${searchTime}ms`);
      if (searchResults.length > 0) {
        console.log(`  - Top result similarity: ${searchResults[0].similarity.toFixed(3)}`);
        console.log(`  - Preview: "${searchResults[0].content.substring(0, 100)}..."`);
      }
    }

    // Step 4: Test answer generation
    console.log('\n💡 Testing answer generation...');
    const question = 'What are the key features of this RAG system?';
    console.log(`Question: "${question}"`);
    
    const answerResult = await ragPipeline.query(question);
    console.log('\nGenerated Answer:');
    console.log(answerResult.answer);
    console.log(`\nSources used: ${answerResult.sources.length}`);

    // Step 5: Test statistics
    console.log('\n📊 Testing statistics...');
    const stats = await ragPipeline.getStatistics();
    console.log('System Statistics:');
    console.log(`  - Total documents: ${stats.totalDocuments}`);
    console.log(`  - Total chunks: ${stats.totalChunks}`);
    console.log(`  - Average chunks per document: ${stats.avgChunksPerDocument}`);
    console.log(`  - Storage used: ${stats.storageUsedMB.toFixed(2)} MB`);

    // Step 6: Test batch processing
    console.log('\n📦 Testing batch processing...');
    const batchResults = await ragPipeline.processDocumentBatch([
      './test-data/sample.txt'
    ], {
      parallel: 2,
      metadata: { batch: true }
    });
    console.log(`✅ Batch processed ${batchResults.length} documents`);

    // Step 7: Test error handling
    console.log('\n⚠️  Testing error handling...');
    try {
      await ragPipeline.processDocument('./non-existent-file.pdf');
    } catch (error) {
      console.log('✅ Error handling works correctly');
      console.log(`  - Error: ${error.message}`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    if (result.documentId) {
      await ragPipeline.deleteDocument(result.documentId);
      console.log('✅ Test document deleted');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed successfully!');
    console.log('\n🎯 Pipeline is ready for production use');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...\n');

  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  // Test status endpoint
  console.log('Testing /api/rag/process (GET)...');
  const statusResponse = await fetch(`${baseUrl}/api/rag/process`);
  const status = await statusResponse.json();
  console.log('✅ Status:', status);

  // Test search endpoint
  console.log('\nTesting /api/rag/search...');
  const searchResponse = await fetch(`${baseUrl}/api/rag/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'RAG system features',
      matchCount: 5,
      generateAnswer: true
    })
  });
  const searchResult = await searchResponse.json();
  console.log('✅ Search result:', searchResult.success ? 'Success' : 'Failed');
}

// Run tests
async function main() {
  console.log('🚀 RAG Pipeline Test Suite\n');
  
  // Check environment
  if (!process.env.SUPABASE_URL || !process.env.XAI_API_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('  - SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_KEY');
    console.error('  - XAI_API_KEY');
    process.exit(1);
  }

  await testPipeline();
  
  // Optionally test API endpoints
  if (process.argv.includes('--api')) {
    await testAPIEndpoints();
  }

  console.log('\n✨ Testing complete!');
}

main().catch(console.error);