/**
 * Curriculum Integration Middleware
 * Makes curriculum learning actually influence AI responses
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * Knowledge context that gets injected into all AI responses
 */
class KnowledgeContext {
  constructor() {
    this.cfaStandards = new Map();
    this.treasuryPolicies = new Map();
    this.validationRules = new Map();
    this.userProgress = new Map();
    this.lastRefresh = null;
  }

  async refresh() {
    // Refresh every 5 minutes
    if (this.lastRefresh && Date.now() - this.lastRefresh < 300000) {
      return;
    }

    try {
      // Load CFA standards
      const { data: cfaData } = await supabase
        .from('cfa_standards')
        .select('*')
        .eq('is_active', true);

      if (cfaData) {
        cfaData.forEach(standard => {
          this.cfaStandards.set(standard.standard_id, standard);
        });
      }

      // Load treasury policies
      const { data: treasuryData } = await supabase
        .from('treasury_policies')
        .select('*')
        .eq('is_active', true);

      if (treasuryData) {
        treasuryData.forEach(policy => {
          this.treasuryPolicies.set(policy.policy_id, policy);
        });
      }

      // Load validation rules from curriculum agent
      const { data: validations } = await supabase
        .from('agent_validations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (validations) {
        validations.forEach(val => {
          this.validationRules.set(val.domain, val);
        });
      }

      this.lastRefresh = Date.now();
    } catch (error) {
      console.error('Failed to refresh knowledge context:', error);
    }
  }

  /**
   * Get relevant context for a specific domain
   */
  getContext(domain, operation) {
    const context = {
      standards: [],
      policies: [],
      validations: [],
      constraints: []
    };

    // Find relevant CFA standards
    for (const [id, standard] of this.cfaStandards) {
      if (standard.domain === domain || standard.tags?.includes(domain)) {
        context.standards.push({
          id: standard.standard_id,
          formula: standard.formula,
          description: standard.description,
          constraints: standard.validation_rules
        });
      }
    }

    // Find relevant treasury policies
    for (const [id, policy] of this.treasuryPolicies) {
      if (policy.domain === domain || policy.applies_to?.includes(operation)) {
        context.policies.push({
          id: policy.policy_id,
          rule: policy.best_practice,
          threshold: policy.threshold_values
        });
      }
    }

    // Get validation history
    const validation = this.validationRules.get(domain);
    if (validation) {
      context.validations.push({
        lastValidated: validation.created_at,
        isValid: validation.is_valid,
        feedback: validation.feedback
      });
    }

    return context;
  }

  /**
   * Validate a response against curriculum knowledge
   */
  async validateResponse(domain, response, operation) {
    const context = this.getContext(domain, operation);
    const violations = [];

    // Check against CFA standards
    for (const standard of context.standards) {
      if (standard.constraints) {
        // Simple validation - could be made more sophisticated
        if (response.value && standard.constraints.min && response.value < standard.constraints.min) {
          violations.push({
            type: 'cfa_standard',
            standard: standard.id,
            message: `Value ${response.value} below minimum ${standard.constraints.min}`
          });
        }
      }
    }

    // Check against treasury policies
    for (const policy of context.policies) {
      if (policy.threshold && response.risk_score > policy.threshold.max_risk) {
        violations.push({
          type: 'treasury_policy',
          policy: policy.id,
          message: `Risk score ${response.risk_score} exceeds policy maximum ${policy.threshold.max_risk}`
        });
      }
    }

    // Log validation result
    if (supabase) {
      await supabase.from('agent_validations').insert({
        agent_id: 'middleware',
        domain: domain,
        concept: operation,
        is_valid: violations.length === 0,
        feedback: violations.length > 0 ? JSON.stringify(violations) : 'Passed all validations',
        context_applied: context
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      context
    };
  }
}

// Singleton instance
const knowledgeContext = new KnowledgeContext();

/**
 * Middleware to inject curriculum knowledge into requests
 */
export async function curriculumMiddleware(req, res, next) {
  // Refresh knowledge context
  await knowledgeContext.refresh();

  // Determine domain from request
  const domain = determineDomain(req.path, req.body);
  const operation = determineOperation(req.method, req.path);

  // Get relevant context
  const context = knowledgeContext.getContext(domain, operation);

  // Inject context into request
  req.curriculumContext = context;
  req.validateWithCurriculum = async (response) => {
    return await knowledgeContext.validateResponse(domain, response, operation);
  };

  // Track user learning progress if user is authenticated
  if (req.user?.id) {
    trackUserInteraction(req.user.id, domain, operation);
  }

  next();
}

/**
 * Response interceptor to validate and enhance responses
 */
export function curriculumResponseInterceptor(req, res, next) {
  const originalJson = res.json;

  res.json = async function(data) {
    // Only process successful responses with data
    if (res.statusCode === 200 && data && req.curriculumContext) {
      // Validate response
      if (req.validateWithCurriculum) {
        const validation = await req.validateWithCurriculum(data);
        
        // Enhance response with curriculum context
        data._curriculum = {
          context: req.curriculumContext,
          validation: validation,
          learning_notes: generateLearningNotes(req.curriculumContext, data)
        };

        // If validation failed, add warnings
        if (!validation.isValid) {
          data._warnings = validation.violations;
        }
      }

      // Track successful responses for learning
      if (req.user?.id) {
        await trackLearningOutcome(req.user.id, req.path, data);
      }
    }

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Determine domain from request
 */
function determineDomain(path, body) {
  if (path.includes('treasury')) return 'treasury_management';
  if (path.includes('market')) return 'market_analysis';
  if (path.includes('portfolio')) return 'portfolio_management';
  if (path.includes('news')) return 'news_intelligence';
  if (body?.function?.includes('var')) return 'risk_management';
  if (body?.function?.includes('duration')) return 'fixed_income';
  return 'general_finance';
}

/**
 * Determine operation from request
 */
function determineOperation(method, path) {
  const pathParts = path.split('/').filter(p => p);
  const lastPart = pathParts[pathParts.length - 1];
  
  if (method === 'POST' && path.includes('calculate')) return 'calculation';
  if (method === 'GET' && path.includes('analyze')) return 'analysis';
  if (method === 'POST' && path.includes('optimize')) return 'optimization';
  
  return lastPart || 'general';
}

/**
 * Generate learning notes based on context and response
 */
function generateLearningNotes(context, response) {
  const notes = [];

  if (context.standards.length > 0) {
    notes.push({
      type: 'cfa_standard',
      message: `This calculation follows CFA Standard ${context.standards[0].id}`,
      formula: context.standards[0].formula
    });
  }

  if (context.policies.length > 0) {
    notes.push({
      type: 'best_practice',
      message: context.policies[0].rule
    });
  }

  return notes;
}

/**
 * Track user interaction for learning progress
 */
async function trackUserInteraction(userId, domain, operation) {
  try {
    await supabase.from('user_learning_progress').upsert({
      user_id: userId,
      curriculum_id: `${domain}_fundamentals`,
      last_accessed: new Date().toISOString(),
      modules_completed: supabase.raw('modules_completed + 1')
    }, {
      onConflict: 'user_id,curriculum_id'
    });
  } catch (error) {
    console.error('Failed to track user interaction:', error);
  }
}

/**
 * Track learning outcomes from responses
 */
async function trackLearningOutcome(userId, endpoint, response) {
  try {
    // Simple tracking - could be enhanced with ML
    const score = response._warnings ? 0.5 : 1.0;
    
    await supabase.from('learning_assessments').insert({
      user_id: userId,
      assessment_type: 'api_interaction',
      score_percentage: score * 100,
      questions_data: {
        endpoint: endpoint,
        warnings: response._warnings || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to track learning outcome:', error);
  }
}

export default {
  curriculumMiddleware,
  curriculumResponseInterceptor,
  knowledgeContext
};