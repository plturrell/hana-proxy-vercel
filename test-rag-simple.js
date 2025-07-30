// Simple test for RAG endpoints
const { createClient } = require('@supabase/supabase-js');

// Test if Transformers.js works
async function testTransformers() {
  console.log('🔍 Testing Transformers.js...');
  try {
    const { pipeline } = require('@xenova/transformers');
    console.log('✅ Transformers.js loaded successfully');
    
    // Try to load the model
    console.log('Loading embedding model...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true
    });
    
    const output = await extractor('test text', { pooling: 'mean', normalize: true });
    console.log('✅ Model loaded and working');
    console.log('Embedding dimensions:', output.data.length);
  } catch (error) {
    console.error('❌ Transformers.js error:', error.message);
  }
}

// Test Supabase connection
async function testSupabase() {
  console.log('\n🔍 Testing Supabase connection...');
  try {
    const supabase = createClient(
      'https://fnsbxaywhsxqppncqksu.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo'
    );
    
    const { data, error } = await supabase
      .from('documents')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase error:', error.message);
    } else {
      console.log('✅ Supabase connection working');
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

// Run tests
async function main() {
  console.log('🚀 Testing RAG dependencies...\n');
  await testTransformers();
  await testSupabase();
  console.log('\n✅ Tests complete');
}

main().catch(console.error);