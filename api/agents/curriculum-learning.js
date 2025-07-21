/**
 * Curriculum Learning Agent API Endpoint
 * RESTful interface for CFA/Treasury domain expertise and context engineering
 */

import { IntelligentCurriculumLearningAgent } from '../../agents/curriculum-learning-agent-v2.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

let curriculumAgent = null;

async function initializeCurriculumAgent() {
  if (!curriculumAgent) {
    const agentData = {
      agent_id: 'finsight.education.curriculum_learning',
      agent_name: 'Curriculum Learning Agent',
      agent_type: 'education',
      voting_power: 150, // High voting power for domain guardian role
      connection_config: {
        goals: [
          'Enforce CFA standards across all financial calculations',
          'Maintain treasury best practices',
          'Provide business context to technical agents',
          'Prevent financial methodology errors'
        ],
        personality: 'authoritative'
      }
    };
    
    // Always create the agent instance
    curriculumAgent = new IntelligentCurriculumLearningAgent(agentData);
    
    try {
      // Try to initialize with database connections
      await curriculumAgent.initialize();
      console.log('📚 Curriculum Learning Agent initialized and ready');
    } catch (error) {
      console.error('Failed to fully initialize Curriculum Learning Agent:', error);
      console.log('📚 Curriculum Learning Agent running without database connection');
    }
  }
  
  return curriculumAgent;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Agent-ID');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if Supabase is properly configured
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not configured',
        agent_id: 'finsight.education.curriculum_learning',
        status: 'error'
      });
    }
    
    // Initialize agent if needed
    const agent = await initializeCurriculumAgent();

    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'status':
          return await handleStatusRequest(req, res, agent);
        case 'domains':
          return await handleDomainsRequest(req, res, agent);
        case 'curricula':
          return await handleCurriculaRequest(req, res, agent);
        case 'validations':
          return await handleValidationsRequest(req, res, agent);
        case 'agent_scores':
          return await handleAgentScoresRequest(req, res, agent);
        case 'context_templates':
          return await handleContextTemplatesRequest(req, res, agent);
        case 'statistics':
          return await handleStatisticsRequest(req, res, agent);
        default:
          return await handleStatusRequest(req, res, agent);
      }
    }

    if (req.method === 'POST') {
      const { action } = req.body;
      
      switch (action) {
        case 'validate':
          return await handleValidateRequest(req, res, agent);
        case 'apply_context':
          return await handleApplyContextRequest(req, res, agent);
        case 'create_curriculum':
          return await handleCreateCurriculumRequest(req, res, agent);
        case 'teach_concept':
          return await handleTeachConceptRequest(req, res, agent);
        case 'assess_knowledge':
          return await handleAssessKnowledgeRequest(req, res, agent);
        case 'monitor_agent':
          return await handleMonitorAgentRequest(req, res, agent);
        default:
          return res.status(400).json({
            success: false,
            error: 'Unknown action',
            available_actions: ['validate', 'apply_context', 'create_curriculum', 'teach_concept', 'assess_knowledge', 'monitor_agent']
          });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    });

  } catch (error) {
    console.error('Curriculum Learning Agent error:', error);
    return res.status(500).json({
      success: false,
      error: 'Curriculum agent error',
      details: error.message
    });
  }
}

/**
 * Handle status requests
 */
async function handleStatusRequest(req, res, agent) {
  try {
    const stats = await agent.getCurriculumStatistics();
    
    return res.json({
      success: true,
      agent_id: agent.id,
      agent_name: agent.name,
      status: 'active',
      uptime: process.uptime(),
      capabilities: agent.capabilities,
      knowledge_domains: Object.keys(agent.knowledgeDomains || {}),
      statistics: stats,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: error.message
    });
  }
}

/**
 * Handle knowledge domains request
 */
async function handleDomainsRequest(req, res, agent) {
  try {
    return res.json({
      success: true,
      domains: agent.knowledgeDomains,
      total_domains: Object.keys(agent.knowledgeDomains || {}).length,
      cfa_topics: agent.knowledgeDomains?.cfa_level_1 || {},
      treasury_topics: agent.knowledgeDomains?.treasury_management || {},
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get domains',
      details: error.message
    });
  }
}

/**
 * Handle curricula overview request
 */
async function handleCurriculaRequest(req, res, agent) {
  try {
    const { agent_id, status = 'active' } = req.query;
    
    let curricula = [];
    if (agent.curricula) {
      curricula = Array.from(agent.curricula.entries())
        .filter(([id, curriculum]) => {
          if (agent_id && id !== agent_id) return false;
          if (status && curriculum.status !== status) return false;
          return true;
        })
        .map(([id, curriculum]) => ({
          agent_id: id,
          ...curriculum
        }));
    }

    return res.json({
      success: true,
      total_curricula: curricula.length,
      curricula: curricula,
      filters_applied: { agent_id, status },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get curricula',
      details: error.message
    });
  }
}

/**
 * Handle validation history request
 */
async function handleValidationsRequest(req, res, agent) {
  try {
    const { agent_id, days = 7 } = req.query;
    
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    
    let query = supabase
      .from('agent_validations')
      .select('*')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }
    
    const { data: validations, error } = await query;
    
    if (error) {
      throw error;
    }

    // Calculate summary statistics
    const summary = {
      total_validations: validations?.length || 0,
      average_compliance_score: 0,
      total_errors: 0,
      total_warnings: 0
    };

    if (validations && validations.length > 0) {
      summary.average_compliance_score = validations.reduce((sum, v) => 
        sum + (v.validation_result?.compliance_score || 0), 0) / validations.length;
      summary.total_errors = validations.reduce((sum, v) => 
        sum + (v.validation_result?.errors?.length || 0), 0);
      summary.total_warnings = validations.reduce((sum, v) => 
        sum + (v.validation_result?.warnings?.length || 0), 0);
    }

    return res.json({
      success: true,
      validations: validations || [],
      summary: summary,
      filters: { agent_id, days },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get validations',
      details: error.message
    });
  }
}

/**
 * Handle agent scores request
 */
async function handleAgentScoresRequest(req, res, agent) {
  try {
    const scores = [];
    if (agent.agentScores) {
      agent.agentScores.forEach((score, agentId) => {
        scores.push({
          agent_id: agentId,
          compliance_score: score,
          status: score >= 0.85 ? 'compliant' : score >= 0.70 ? 'needs_improvement' : 'non_compliant'
        });
      });
    }

    return res.json({
      success: true,
      agent_scores: scores,
      total_agents: scores.length,
      compliant_agents: scores.filter(s => s.status === 'compliant').length,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get agent scores',
      details: error.message
    });
  }
}

/**
 * Handle context templates request
 */
async function handleContextTemplatesRequest(req, res, agent) {
  try {
    return res.json({
      success: true,
      templates: agent.contextTemplates || {},
      total_templates: Object.keys(agent.contextTemplates || {}).length,
      categories: Object.keys(agent.contextTemplates || {}),
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get context templates',
      details: error.message
    });
  }
}

/**
 * Handle statistics request
 */
async function handleStatisticsRequest(req, res, agent) {
  try {
    const stats = await agent.getCurriculumStatistics();
    
    return res.json({
      success: true,
      statistics: stats,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    });
  }
}

/**
 * Handle validation request
 */
async function handleValidateRequest(req, res, agent) {
  try {
    const { agent_id, output, context } = req.body;

    if (!agent_id || !output || !context) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: agent_id, output, context'
      });
    }

    const validation = await agent.validateAgentOutput(agent_id, output, context);

    return res.json({
      success: true,
      validation: validation,
      requires_correction: validation.errors.length > 0,
      compliance_status: validation.compliance_score >= 0.85 ? 'compliant' : 'non_compliant',
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    });
  }
}

/**
 * Handle apply context request
 */
async function handleApplyContextRequest(req, res, agent) {
  try {
    const { agent_id, task, business_context } = req.body;

    if (!agent_id || !task || !business_context) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: agent_id, task, business_context'
      });
    }

    const enhancedTask = await agent.applyContextOverlay(agent_id, task, business_context);

    return res.json({
      success: true,
      enhanced_task: enhancedTask,
      context_additions: Object.keys(enhancedTask.context_overlay?.enhanced_context || {}),
      constraints_added: enhancedTask.context_overlay?.domain_constraints?.length || 0,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Context application failed',
      details: error.message
    });
  }
}

/**
 * Handle create curriculum request
 */
async function handleCreateCurriculumRequest(req, res, agent) {
  try {
    const { agent_id, agent_type, current_level = 'beginner' } = req.body;

    if (!agent_id || !agent_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: agent_id, agent_type'
      });
    }

    const curriculum = await agent.createCurriculum(agent_id, agent_type, current_level);

    return res.json({
      success: true,
      curriculum: curriculum,
      total_modules: curriculum.modules.length,
      estimated_duration: curriculum.modules.length * 2, // hours
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Curriculum creation failed',
      details: error.message
    });
  }
}

/**
 * Handle teach concept request
 */
async function handleTeachConceptRequest(req, res, agent) {
  try {
    const { agent_id, concept, current_knowledge } = req.body;

    if (!agent_id || !concept) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: agent_id, concept'
      });
    }

    const lesson = await agent.teachConcept(agent_id, concept, current_knowledge);

    return res.json({
      success: true,
      lesson: lesson,
      improvement: lesson.stages[lesson.stages.length - 1]?.improvement || 0,
      duration_minutes: Math.round((new Date() - new Date(lesson.started_at)) / 60000),
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Teaching failed',
      details: error.message
    });
  }
}

/**
 * Handle assess knowledge request
 */
async function handleAssessKnowledgeRequest(req, res, agent) {
  try {
    const { agent_id, concept, test_data } = req.body;

    if (!agent_id || !concept) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: agent_id, concept'
      });
    }

    // For now, return a mock assessment
    const assessment = {
      agent_id,
      concept,
      score: 0.75,
      strengths: ['basic_understanding', 'formula_application'],
      weaknesses: ['edge_cases', 'optimization'],
      recommendations: ['practice_more_complex_scenarios', 'review_advanced_topics']
    };

    return res.json({
      success: true,
      assessment: assessment,
      passed: assessment.score >= 0.80,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Assessment failed',
      details: error.message
    });
  }
}

/**
 * Handle monitor agent request
 */
async function handleMonitorAgentRequest(req, res, agent) {
  try {
    const { agent_id, action, params } = req.body;

    if (!agent_id || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: agent_id, action'
      });
    }

    const monitoring = await agent.monitorAgentBehavior(agent_id, action, params);

    return res.json({
      success: true,
      monitoring: monitoring,
      interventions_made: monitoring.interventions.length,
      requires_training: monitoring.interventions.some(i => i.type === 'prevented_error'),
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Monitoring failed',
      details: error.message
    });
  }
}