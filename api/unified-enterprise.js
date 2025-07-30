const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../lib/logger');
const { asyncHandler, AppError, NotFoundError } = require('../lib/error-handler');
const { authenticate, authorize, requirePermission } = require('../lib/auth');
const { validate, sanitize } = require('../lib/validation');
const { trackApiUsage, trackDatabaseQuery } = require('../lib/monitoring');
const { configureSecurity } = require('../lib/security');

// Initialize Express app
const app = express();

// Configure security
configureSecurity(app);

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// API versioning middleware
app.use('/api/v1', (req, res, next) => {
  req.apiVersion = 'v1';
  next();
});

// ==================== A2A Agents ====================
app.get('/api/v1/a2a/agents', 
  authenticate, 
  requirePermission('agents.read'),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    trackApiUsage('a2a_agents', req.user.id);
    
    const { data: agents, error } = await supabase
      .from('a2a_agents')
      .select(`
        *,
        agent_metrics:a2a_agent_metrics(*),
        connections:a2a_agent_connections(*)
      `)
      .eq('status', 'active')
      .order('agent_name');

    trackDatabaseQuery('select_agents', (Date.now() - startTime) / 1000, !error);

    if (error) {
      logger.error('Failed to fetch agents', { error, userId: req.user.id });
      throw new AppError('Failed to fetch agents', 500, 'AGENTS_FETCH_ERROR');
    }

    res.json({
      agents: agents || [],
      count: agents?.length || 0,
      active: agents?.filter(a => a.status === 'active').length || 0,
      apiVersion: req.apiVersion
    });
  })
);

app.post('/api/v1/a2a/agents',
  authenticate,
  requirePermission('agents.create'),
  validate('agentCreate'),
  sanitize(['html', 'sql']),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    trackApiUsage('create_agent', req.user.id);
    
    const agentData = {
      ...req.body,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    const { data: agent, error } = await supabase
      .from('a2a_agents')
      .insert([agentData])
      .select()
      .single();

    trackDatabaseQuery('insert_agent', (Date.now() - startTime) / 1000, !error);

    if (error) {
      logger.error('Failed to create agent', { error, userId: req.user.id });
      throw new AppError('Failed to create agent', 500, 'AGENT_CREATE_ERROR');
    }

    logger.info('Agent created', { agentId: agent.id, userId: req.user.id });

    res.status(201).json({
      agent,
      message: 'Agent created successfully'
    });
  })
);

// ==================== A2A Network ====================
app.get('/api/v1/a2a/network',
  authenticate,
  requirePermission('network.read'),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    trackApiUsage('a2a_network', req.user.id);
    
    // Use database function for optimized network query
    const { data: connections, error } = await supabase
      .rpc('get_a2a_network_connections', {
        active_only: true,
        include_metrics: true
      });

    trackDatabaseQuery('get_network_connections', (Date.now() - startTime) / 1000, !error);

    if (error) {
      logger.error('Failed to fetch network', { error, userId: req.user.id });
      throw new AppError('Failed to fetch network connections', 500, 'NETWORK_FETCH_ERROR');
    }

    res.json({
      connections: connections || [],
      totalConnections: connections?.length || 0,
      isReal: true,
      source: 'supabase_optimized',
      apiVersion: req.apiVersion
    });
  })
);

// ==================== Smart Contracts ====================
app.get('/api/v1/contracts/templates',
  authenticate,
  requirePermission('contracts.read'),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    trackApiUsage('contract_templates', req.user.id);
    
    const { data: templates, error } = await supabase
      .from('smart_contract_templates')
      .select(`
        *,
        deployments:deployed_contracts(count)
      `)
      .eq('status', 'active')
      .order('popularity', { ascending: false });

    trackDatabaseQuery('select_templates', (Date.now() - startTime) / 1000, !error);

    if (error) {
      logger.error('Failed to fetch templates', { error, userId: req.user.id });
      throw new AppError('Failed to fetch contract templates', 500, 'TEMPLATES_FETCH_ERROR');
    }

    res.json({
      templates: templates || [],
      count: templates?.length || 0,
      apiVersion: req.apiVersion
    });
  })
);

app.post('/api/v1/contracts/deploy',
  authenticate,
  requirePermission('contracts.deploy'),
  validate('contractDeploy'),
  sanitize(['sql']),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    trackApiUsage('deploy_contract', req.user.id);
    
    // Start deployment transaction
    const { data: deployment, error: deployError } = await supabase
      .from('deployed_contracts')
      .insert([{
        ...req.body,
        user_id: req.user.id,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (deployError) {
      logger.error('Failed to create deployment', { error: deployError, userId: req.user.id });
      throw new AppError('Failed to initiate deployment', 500, 'DEPLOYMENT_ERROR');
    }

    // Queue deployment job
    await supabase
      .from('deployment_queue')
      .insert([{
        deployment_id: deployment.id,
        priority: req.body.priority || 'normal',
        scheduled_at: new Date().toISOString()
      }]);

    trackDatabaseQuery('create_deployment', (Date.now() - startTime) / 1000, true);

    logger.info('Contract deployment initiated', { 
      deploymentId: deployment.id, 
      userId: req.user.id 
    });

    res.status(202).json({
      deployment,
      message: 'Deployment queued successfully',
      estimatedTime: '2-5 minutes'
    });
  })
);

// ==================== RAG Documents ====================
app.get('/api/v1/rag/documents',
  authenticate,
  requirePermission('documents.read'),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    trackApiUsage('rag_documents', req.user.id);
    
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('documents')
      .select(`
        *,
        chunks:document_chunks(count),
        embeddings:document_embeddings(count)
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: documents, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    trackDatabaseQuery('select_documents', (Date.now() - startTime) / 1000, !error);

    if (error) {
      logger.error('Failed to fetch documents', { error, userId: req.user.id });
      throw new AppError('Failed to fetch documents', 500, 'DOCUMENTS_FETCH_ERROR');
    }

    res.json({
      documents: documents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      apiVersion: req.apiVersion
    });
  })
);

app.post('/api/v1/rag/search',
  authenticate,
  requirePermission('documents.search'),
  validate('searchQuery'),
  sanitize(['sql']),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    trackApiUsage('rag_search', req.user.id);
    
    const { query, filters = {}, pagination = {} } = req.body;

    // Perform vector search using Supabase function
    const { data: results, error } = await supabase
      .rpc('search_documents', {
        query_text: query,
        match_threshold: 0.7,
        match_count: pagination.limit || 20,
        filter_params: filters
      });

    trackDatabaseQuery('vector_search', (Date.now() - startTime) / 1000, !error);

    if (error) {
      logger.error('Failed to search documents', { error, userId: req.user.id });
      throw new AppError('Search failed', 500, 'SEARCH_ERROR');
    }

    res.json({
      results: results || [],
      query,
      count: results?.length || 0,
      apiVersion: req.apiVersion
    });
  })
);

// ==================== AI Integration ====================
app.post('/api/v1/ai/grok/explain',
  authenticate,
  requirePermission('ai.use'),
  asyncHandler(async (req, res) => {
    const { sourceCode, contractName, context } = req.body;
    
    trackApiUsage('grok_explain', req.user.id);
    
    if (!process.env.GROK_API_KEY) {
      throw new AppError('AI service not configured', 503, 'AI_NOT_CONFIGURED');
    }

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-2',
          messages: [
            {
              role: 'system',
              content: 'You are an expert explaining smart contracts to business users. Be concise and clear.'
            },
            {
              role: 'user',
              content: `Explain this ${contractName} smart contract:\n\n${sourceCode}\n\nContext: ${context || 'General explanation'}`
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new AppError('AI service error', 503, 'AI_SERVICE_ERROR');
      }

      const data = await response.json();
      
      logger.info('Grok explanation generated', { userId: req.user.id, contractName });

      res.json({
        explanation: data.choices[0].message.content,
        model: 'grok-2',
        usage: data.usage,
        apiVersion: req.apiVersion
      });
    } catch (error) {
      logger.error('Grok API error', { error, userId: req.user.id });
      throw new AppError('Failed to generate explanation', 503, 'AI_GENERATION_ERROR');
    }
  })
);

// ==================== Health & Monitoring ====================
app.get('/api/v1/health', require('../lib/monitoring').healthCheck);
app.get('/api/v1/ready', require('../lib/monitoring').readinessCheck);
app.get('/api/v1/live', require('../lib/monitoring').livenessCheck);

// ==================== Error Handling ====================
app.use(require('../lib/error-handler').errorHandler);

// Export for Vercel
module.exports = app;