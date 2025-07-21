/**
 * API Endpoint for Mathematical Function Calculations
 * Provides unified access to all mathematical functions via the orchestrator
 */

import { orchestratorMiddleware, batchMiddleware } from './orchestrator.js';
import orchestrator from './orchestrator.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle different request types
  switch (req.method) {
    case 'POST':
      // Check for batch requests
      if (req.body.requests) {
        return batchMiddleware(req, res);
      }
      // Single function execution
      return orchestratorMiddleware(req, res);

    case 'GET':
      // Return available functions and metrics
      return res.json({
        status: 'active',
        functions: orchestrator.getAvailableFunctions(),
        metrics: orchestrator.getMetrics(),
        endpoints: {
          calculate: '/api/functions/calculate',
          batch: '/api/functions/calculate (with requests array)',
          info: '/api/functions/calculate (GET)'
        }
      });

    default:
      return res.status(405).json({
        error: 'Method not allowed',
        allowedMethods: ['POST', 'GET', 'OPTIONS']
      });
  }
}

// Named exports for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};