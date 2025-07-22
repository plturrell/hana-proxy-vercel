/**
 * Production RAG Pipeline Implementation
 * Complete working system with Grok-4 and Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.XAI_API_KEY;
const GROK_BASE_URL = 'https://api.x.ai/v1';

/**
 * Complete RAG Pipeline Implementation
 */
export class RAGPipeline {
  constructor() {
    this.chunkSize = 500;
    this.chunkOverlap = 50;
    this.embeddingDimension = 1536;
    this.batchSize = 100;
  }

  /**
   * Process a complete document through the RAG pipeline
   */
  async processDocument(fileBuffer, fileName, metadata = {}) {
    try {
      console.log(`📄 Processing document: ${fileName}`);
      
      // Step 1: Extract text from document
      const text = await this.extractText(fileBuffer, fileName);
      console.log(`✅ Extracted ${text.length} characters`);
      
      // Step 2: Create document record
      const documentId = await this.createDocumentRecord(fileName, metadata);
      console.log(`✅ Created document record: ${documentId}`);
      
      // Step 3: Chunk the text
      const chunks = await this.chunkText(text);
      console.log(`✅ Created ${chunks.length} chunks`);
      
      // Step 4: Generate embeddings with Grok-4
      const embeddings = await this.generateEmbeddings(chunks);
      console.log(`✅ Generated ${embeddings.length} embeddings`);
      
      // Step 5: Store in Supabase
      await this.storeChunks(documentId, chunks, embeddings);
      console.log(`✅ Stored chunks in vector database`);
      
      return {
        documentId,
        chunksProcessed: chunks.length,
        status: 'success'
      };
    } catch (error) {
      console.error('Pipeline error:', error);
      throw error;
    }
  }

  /**
   * Extract text from various document formats
   */
  async extractText(fileBuffer, fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    if (fileExtension === 'pdf') {
      return await this.extractPDFText(fileBuffer);
    } else if (['txt', 'md'].includes(fileExtension)) {
      return fileBuffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  /**
   * Extract text from PDF using PDF parsing service
   */
  async extractPDFText(pdfBuffer) {
    // For Vercel deployment, use a PDF parsing service or convert to base64
    try {
      // Option 1: Use Mozilla's PDF.js (works in serverless)
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
      
      const loadingTask = pdfjsLib.getDocument({
        data: pdfBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      });
      
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      // Clean the text
      fullText = fullText.replace(/\s+/g, ' ');
      fullText = fullText.replace(/\n\s*\d+\s*\n/g, '\n');
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('PDF extraction failed: ' + error.message);
    }
  }

  /**
   * Create document record in database
   */
  async createDocumentRecord(fileName, metadata) {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: fileName,
        source_url: fileName,
        metadata: metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Semantic chunking implementation
   */
  async chunkText(text) {
    // Use sentence boundaries for semantic chunking
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const chunks = [];
    let currentChunk = '';
    let wordCount = 0;

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length;
      
      if (wordCount + sentenceWords > this.chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        // Add overlap by keeping last sentence
        currentChunk = chunks.length > 0 ? sentences[sentences.indexOf(sentence) - 1] + ' ' + sentence : sentence;
        wordCount = currentChunk.split(/\s+/).length;
      } else {
        currentChunk += ' ' + sentence;
        wordCount += sentenceWords;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Generate embeddings using Grok-4 API
   */
  async generateEmbeddings(texts) {
    const embeddings = [];
    
    // Process in batches
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      
      try {
        const response = await fetch(`${GROK_BASE_URL}/embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: batch,
            model: 'grok-embed-1212',
            encoding_format: 'float'
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Grok API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        embeddings.push(...data.data.map(item => item.embedding));
        
        // Rate limiting
        if (i + this.batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Embedding generation error:', error);
        // Retry logic
        await new Promise(resolve => setTimeout(resolve, 5000));
        i -= this.batchSize; // Retry this batch
      }
    }

    return embeddings;
  }

  /**
   * Store chunks with embeddings in Supabase
   */
  async storeChunks(documentId, chunks, embeddings) {
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        chunk_size: chunk.length,
        word_count: chunk.split(/\s+/).length,
        position: index / chunks.length
      }
    }));

    // Insert in batches to avoid payload size limits
    const insertBatchSize = 50;
    for (let i = 0; i < chunkRecords.length; i += insertBatchSize) {
      const batch = chunkRecords.slice(i, i + insertBatchSize);
      
      const { error } = await supabase
        .from('document_chunks')
        .insert(batch);

      if (error) {
        console.error('Chunk storage error:', error);
        throw error;
      }
    }
  }

  /**
   * Search for relevant documents
   */
  async search(query, options = {}) {
    const {
      matchCount = 10,
      matchThreshold = 0.7,
      filterMetadata = {},
      useHybrid = true
    } = options;

    // Generate query embedding
    const [queryEmbedding] = await this.generateEmbeddings([query]);

    if (useHybrid) {
      // Hybrid search combining vector and full-text
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_text: query,
        query_embedding: queryEmbedding,
        match_count: matchCount,
        rrf_k: 60
      });

      if (error) throw error;
      return data;
    } else {
      // Pure vector search
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_metadata: filterMetadata
      });

      if (error) throw error;
      return data;
    }
  }

  /**
   * Generate answer using Grok-4 with retrieved context
   */
  async generateAnswer(query, searchResults) {
    const context = searchResults
      .map((result, index) => `[${index + 1}] ${result.content}`)
      .join('\n\n');

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that answers questions based on the provided context. Always cite your sources using the reference numbers.'
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${query}\n\nProvide a comprehensive answer based on the context above. Include reference numbers [1], [2], etc. for your sources.`
      }
    ];

    try {
      const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-4-vision-1212',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        answer: data.choices[0].message.content,
        sources: searchResults.map(r => ({
          content: r.content,
          document_id: r.document_id,
          similarity: r.similarity
        }))
      };
    } catch (error) {
      console.error('Answer generation error:', error);
      throw error;
    }
  }

  /**
   * Complete RAG query flow
   */
  async query(question, options = {}) {
    console.log(`🔍 Processing query: ${question}`);
    
    // Search for relevant chunks
    const searchResults = await this.search(question, options);
    console.log(`✅ Found ${searchResults.length} relevant chunks`);
    
    // Generate answer with Grok-4
    const answer = await this.generateAnswer(question, searchResults);
    console.log(`✅ Generated answer with ${answer.sources.length} sources`);
    
    return answer;
  }

  /**
   * Batch process multiple documents
   */
  async processDocumentBatch(documentPaths, options = {}) {
    const results = [];
    const { parallel = 3 } = options;

    // Process in controlled parallelism
    for (let i = 0; i < documentPaths.length; i += parallel) {
      const batch = documentPaths.slice(i, i + parallel);
      const batchPromises = batch.map(path => 
        this.processDocument(path, options.metadata)
          .catch(error => ({ path, error: error.message }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      console.log(`✅ Processed batch ${Math.floor(i / parallel) + 1}/${Math.ceil(documentPaths.length / parallel)}`);
    }

    return results;
  }

  /**
   * Update document embeddings (for re-indexing)
   */
  async updateDocumentEmbeddings(documentId) {
    // Fetch chunks
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, content')
      .eq('document_id', documentId);

    if (error) throw error;

    // Generate new embeddings
    const texts = chunks.map(c => c.content);
    const embeddings = await this.generateEmbeddings(texts);

    // Update in batches
    for (let i = 0; i < chunks.length; i++) {
      await supabase
        .from('document_chunks')
        .update({ embedding: embeddings[i] })
        .eq('id', chunks[i].id);
    }

    return chunks.length;
  }

  /**
   * Delete document and its chunks
   */
  async deleteDocument(documentId) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
    // Chunks are deleted automatically via CASCADE
    
    return true;
  }

  /**
   * Get pipeline statistics
   */
  async getStatistics() {
    const { data: stats } = await supabase.rpc('get_rag_statistics');
    
    return {
      totalDocuments: stats?.total_documents || 0,
      totalChunks: stats?.total_chunks || 0,
      avgChunksPerDocument: stats?.avg_chunks_per_document || 0,
      totalEmbeddings: stats?.total_embeddings || 0,
      storageUsedMB: stats?.storage_used_mb || 0
    };
  }
}

// Export singleton instance
export const ragPipeline = new RAGPipeline();