/**
 * Enhanced calculation endpoint with curriculum integration
 * This wraps the existing calculation functions with knowledge validation
 */

import { curriculumMiddleware, curriculumResponseInterceptor } from '../../middleware/curriculum-integration.js';

// Import the original calculation logic
async function performCalculation(functionName, parameters) {
  try {
    // Call the actual calculation function via internal API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/functions/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: functionName, parameters })
    });

    if (!response.ok) {
      throw new Error(`Calculation failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Calculation error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Apply curriculum middleware manually since Vercel doesn't support Express middleware
  await curriculumMiddleware(req, res, () => {});

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { function: functionName, parameters } = req.body;

  if (!functionName) {
    return res.status(400).json({ error: 'Function name required' });
  }

  try {
    // Perform the calculation
    const result = await performCalculation(functionName, parameters);

    // Validate the result against curriculum knowledge
    if (req.validateWithCurriculum) {
      const validation = await req.validateWithCurriculum(result);
      
      // Enhance result with curriculum context
      result._curriculum = {
        context: req.curriculumContext,
        validation: validation,
        learning_notes: generateLearningNotes(req.curriculumContext, result),
        confidence_score: validation.isValid ? 1.0 : 0.7
      };

      // Add warnings if validation failed
      if (!validation.isValid) {
        result._warnings = validation.violations;
        
        // Log for improvement
        console.warn(`Calculation ${functionName} violated curriculum rules:`, validation.violations);
      }

      // Add educational context
      result._education = {
        related_standards: req.curriculumContext.standards.map(s => ({
          id: s.id,
          description: s.description,
          learn_more: `/learn/standards/${s.id}`
        })),
        best_practices: req.curriculumContext.policies.map(p => ({
          rule: p.rule,
          why: 'This ensures compliance with industry standards'
        }))
      };
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Calculation with curriculum failed:', error);
    return res.status(500).json({ 
      error: 'Calculation failed',
      details: error.message,
      _curriculum: {
        suggestion: 'Review the calculation parameters against CFA standards'
      }
    });
  }
}

function generateLearningNotes(context, result) {
  const notes = [];

  // Add contextual learning based on the calculation
  if (result.function?.includes('var')) {
    notes.push({
      concept: 'Value at Risk',
      insight: 'VaR measures potential loss in value of a portfolio over a defined period for a given confidence interval',
      standard: context.standards.find(s => s.id.includes('risk'))?.id
    });
  }

  if (result.function?.includes('duration')) {
    notes.push({
      concept: 'Duration',
      insight: 'Duration measures the sensitivity of a bond\'s price to interest rate changes',
      formula: context.standards.find(s => s.id.includes('duration'))?.formula
    });
  }

  return notes;
}