/**
 * Simple test endpoint to verify RAG deployment
 */

export default async function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    message: 'RAG test endpoint is working',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.url
  });
}