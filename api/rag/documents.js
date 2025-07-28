/**
 * RAG Documents API Endpoint
 * Handles document listing and management
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getDocuments(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Documents API error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve documents', 
      details: error.message 
    });
  }
}

async function getDocuments(req, res) {
  try {
    // Get all unique documents from rag_documents table
    const { data: documents, error } = await supabase
      .from('rag_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // If no documents table exists, return empty array
    if (!documents) {
      return res.status(200).json({ documents: [] });
    }

    // Get chunk counts for each document
    const documentIds = documents.map(d => d.id);
    const { data: chunkCounts } = await supabase
      .from('rag_chunks')
      .select('document_id')
      .in('document_id', documentIds);

    // Create a map of document_id to chunk count
    const chunkCountMap = {};
    if (chunkCounts) {
      chunkCounts.forEach(chunk => {
        chunkCountMap[chunk.document_id] = (chunkCountMap[chunk.document_id] || 0) + 1;
      });
    }

    // Format documents with additional metadata
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.filename || doc.name || 'Untitled Document',
      size: formatFileSize(doc.file_size || 0),
      chunks: chunkCountMap[doc.id] || 0,
      created_at: doc.created_at,
      metadata: doc.metadata || {}
    }));

    return res.status(200).json({ 
      documents: formattedDocuments,
      total: formattedDocuments.length
    });
  } catch (error) {
    // If tables don't exist, return empty result
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      return res.status(200).json({ documents: [], total: 0 });
    }
    throw error;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}