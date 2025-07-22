/**
 * RAG Search API Endpoint
 * Performs semantic search and generates answers
 */

import { ragPipeline } from '../../lib/rag-pipeline.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    query, 
    matchCount = 10,
    matchThreshold = 0.7,
    useHybrid = true,
    generateAnswer = true,
    filterMetadata = {}
  } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  try {
    if (generateAnswer) {
      // Full RAG flow with answer generation
      const result = await ragPipeline.query(query, {
        matchCount,
        matchThreshold,
        filterMetadata,
        useHybrid
      });

      return res.status(200).json({
        success: true,
        query,
        answer: result.answer,
        sources: result.sources,
        searchType: useHybrid ? 'hybrid' : 'vector'
      });
    } else {
      // Just search without answer generation
      const searchResults = await ragPipeline.search(query, {
        matchCount,
        matchThreshold,
        filterMetadata,
        useHybrid
      });

      return res.status(200).json({
        success: true,
        query,
        results: searchResults,
        searchType: useHybrid ? 'hybrid' : 'vector'
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: 'Search failed', 
      details: error.message 
    });
  }
}