/**
 * RAG Processing API Endpoint
 * Handles document upload and processing through the pipeline
 */

import { ragPipeline } from '../../lib/rag-pipeline.js';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { method } = req;
  
  // Add deployment timestamp for debugging
  console.log('RAG Process handler called at:', new Date().toISOString());

  try {
    switch (method) {
      case 'POST':
        return await handleDocumentUpload(req, res);
      case 'GET':
        return await handleStatusCheck(req, res);
      case 'DELETE':
        return await handleDocumentDeletion(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('RAG API error:', error);
    return res.status(500).json({ 
      error: 'Processing failed', 
      details: error.message 
    });
  }
}

async function handleDocumentUpload(req, res) {
  const form = formidable({
    maxFileSize: 50 * 1024 * 1024, // 50MB limit
    keepExtensions: true,
    uploadDir: '/tmp'
  });

  const [fields, files] = await form.parse(req);
  
  if (!files.document || !files.document[0]) {
    return res.status(400).json({ error: 'No document uploaded' });
  }

  const file = files.document[0];
  const metadata = fields.metadata ? JSON.parse(fields.metadata[0]) : {};

  try {
    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);
    
    // Process document through RAG pipeline
    const result = await ragPipeline.processDocument(
      fileBuffer, 
      file.originalFilename || file.newFilename,
      { ...metadata, fileSize: file.size }
    );
    
    // Clean up uploaded file
    await fs.unlink(file.filepath);

    return res.status(200).json({
      success: true,
      ...result,
      message: `Successfully processed ${file.originalFilename || file.newFilename}`
    });
  } catch (error) {
    // Clean up on error
    await fs.unlink(file.filepath).catch(() => {});
    throw error;
  }
}

async function handleStatusCheck(req, res) {
  // Check if documents list is requested
  const { list } = req.query;
  
  if (list === 'documents') {
    // Return document list
    const documents = await ragPipeline.getDocuments();
    return res.status(200).json({
      documents: documents,
      total: documents.length
    });
  }
  
  // Default: return status and statistics
  const stats = await ragPipeline.getStatistics();
  
  return res.status(200).json({
    status: 'operational',
    statistics: stats,
    capabilities: {
      supportedFormats: ['pdf', 'txt', 'md'],
      maxFileSize: '50MB',
      embeddingModel: 'grok-embed-1212',
      chunkSize: 500,
      features: ['semantic-chunking', 'hybrid-search', 'grok4-generation']
    }
  });
}

async function handleDocumentDeletion(req, res) {
  const { documentId } = req.query;
  
  if (!documentId) {
    return res.status(400).json({ error: 'Document ID required' });
  }

  await ragPipeline.deleteDocument(documentId);
  
  return res.status(200).json({
    success: true,
    message: `Document ${documentId} deleted`
  });
}