// Configuration for @xenova/transformers
module.exports = {
  // Model configuration
  models: {
    embedding: {
      name: 'Xenova/all-MiniLM-L6-v2',
      type: 'feature-extraction',
      quantized: true,
      dimensions: 384,
      paddedDimensions: 1536
    }
  },
  
  // Vercel configuration
  vercel: {
    // Cache models in /tmp for serverless functions
    cacheDir: '/tmp/transformers-cache',
    // Pre-download models during build
    preload: true
  },
  
  // Performance settings
  performance: {
    // Use WebAssembly SIMD if available
    simd: true,
    // Number of threads for model inference
    numThreads: 1,
    // Batch size for processing
    batchSize: 1
  }
};