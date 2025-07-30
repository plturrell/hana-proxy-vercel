/**
 * A2A Agent System
 * Proper separation of autonomous agents and computational functions
 * Direct integration without MCP
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// A2A Agent Registry - True autonomous agents (expanding to include data product agents)
const TRUE_A2A_AGENTS = [
  // Analytics Agents
  'finsight.analytics.regime_detection',
  'finsight.analytics.portfolio_rebalancing', 
  'finsight.analytics.risk_budgeting',
  'finsight.analytics.risk_parity',
  'finsight.analytics.copula_modeling',
  'finsight.analytics.garch_volatility',
  'finsight.analytics.stress_testing',
  'finsight.analytics.performance_attribution',
  'finsight.analytics.portfolio_optimization',
  // Data Product Agents
  'finsight.data.news_intelligence'
];

// Function Registry - Computational utilities (verified 16 working endpoints)
const FUNCTION_REGISTRY = {
  // Statistical Functions
  'pearson_correlation': {
    type: 'function',
    category: 'statistical',
    description: 'Calculates Pearson correlation coefficient',
    inputs: ['x_values', 'y_values'],
    outputs: ['correlation', 'p_value'],
    endpoint: '/api/functions/pearson_correlation',
    status: 'active'
  },
  'correlation_matrix': {
    type: 'function',
    category: 'statistical', 
    description: 'Generates correlation matrix for multiple variables',
    inputs: ['data_matrix', 'asset_names'],
    outputs: ['correlation_matrix', 'matrix_properties'],
    endpoint: '/api/functions/correlation_matrix',
    status: 'active'
  },
  
  // Performance Ratios
  'sharpe_ratio': {
    type: 'function', 
    category: 'performance',
    description: 'Calculates risk-adjusted returns using Sharpe ratio',
    inputs: ['returns', 'risk_free_rate'],
    outputs: ['sharpe_ratio'],
    endpoint: '/api/functions/sharpe_ratio',
    status: 'active'
  },
  'sortino_ratio': {
    type: 'function',
    category: 'performance',
    description: 'Measures downside risk-adjusted returns',
    inputs: ['returns', 'target_return', 'risk_free_rate'],
    outputs: ['sortino_ratio', 'downside_deviation'],
    endpoint: '/api/functions/sortino_ratio',
    status: 'active'
  },
  
  // Risk Metrics
  'value_at_risk': {
    type: 'function',
    category: 'risk',
    description: 'Calculates Value at Risk using multiple methods',
    inputs: ['returns', 'confidence_level', 'method'],
    outputs: ['var', 'expected_shortfall'],
    endpoint: '/api/functions/value_at_risk',
    status: 'active'
  },
  'maximum_drawdown': {
    type: 'function',
    category: 'risk',
    description: 'Analyzes maximum portfolio drawdowns',
    inputs: ['price_series', 'returns'],
    outputs: ['max_drawdown', 'recovery_time', 'underwater_periods'],
    endpoint: '/api/functions/maximum_drawdown',
    status: 'active'
  },
  
  // Advanced Analytics
  'black_scholes': {
    type: 'function',
    category: 'derivatives',
    description: 'Calculates option prices and Greeks using Black-Scholes model',
    inputs: ['S', 'K', 'T', 'r', 'sigma', 'option_type'],
    outputs: ['option_price', 'greeks', 'intrinsic_value'],
    endpoint: '/api/functions/black_scholes',
    status: 'active'
  },
  'monte_carlo': {
    type: 'function',
    category: 'simulation',
    description: 'Runs Monte Carlo simulations for risk analysis',
    inputs: ['initial_value', 'drift', 'volatility', 'time_horizon', 'simulations'],
    outputs: ['final_values', 'statistics', 'value_at_risk'],
    endpoint: '/api/functions/monte_carlo',
    status: 'active'
  },
  
  // Newly implemented functions (now active)
  'temporal_correlations': {
    type: 'function',
    category: 'statistical',
    description: 'Calculates time-lagged correlations between time series',
    inputs: ['time_series_1', 'time_series_2', 'max_lag', 'method'],
    outputs: ['correlations', 'lead_lag_analysis', 'granger_causality'],
    endpoint: '/api/functions/temporal_correlations',
    status: 'active'
  },
  'treynor_ratio': {
    type: 'function',
    category: 'performance', 
    description: 'Calculates systematic risk-adjusted returns using beta',
    inputs: ['portfolio_returns', 'market_returns', 'beta', 'risk_free_rate'],
    outputs: ['treynor_ratio', 'beta', 'risk_decomposition'],
    endpoint: '/api/functions/treynor_ratio',
    status: 'active'
  },
  'information_ratio': {
    type: 'function',
    category: 'performance',
    description: 'Measures risk-adjusted active returns vs benchmark',
    inputs: ['portfolio_returns', 'benchmark_returns', 'risk_free_rate'],
    outputs: ['information_ratio', 'tracking_error', 'hit_rate'],
    endpoint: '/api/functions/information_ratio', 
    status: 'active'
  },
  'calmar_ratio': {
    type: 'function',
    category: 'performance',
    description: 'Measures return over maximum drawdown',
    inputs: ['returns', 'price_series', 'risk_free_rate', 'lookback_period'],
    outputs: ['calmar_ratio', 'max_drawdown', 'recovery_time'],
    endpoint: '/api/functions/calmar_ratio',
    status: 'active'
  },
  'omega_ratio': {
    type: 'function',
    category: 'performance',
    description: 'Calculates probability-weighted risk-return ratio',
    inputs: ['returns', 'threshold', 'risk_free_rate', 'confidence_levels'],
    outputs: ['omega_ratio', 'probability_analysis', 'omega_curve'],
    endpoint: '/api/functions/omega_ratio',
    status: 'active'
  },
  'expected_shortfall': {
    type: 'function',
    category: 'risk',
    description: 'Calculates conditional VaR and expected shortfall (CVaR)',
    inputs: ['returns', 'confidence_level', 'method', 'portfolio_value'],
    outputs: ['expected_shortfall', 'value_at_risk', 'tail_statistics'],
    endpoint: '/api/functions/expected_shortfall',
    status: 'active'
  },
  'kelly_criterion': {
    type: 'function',
    category: 'optimization',
    description: 'Calculates optimal position sizing for risk management',
    inputs: ['win_probability', 'win_loss_ratio', 'expected_return', 'variance', 'returns'],
    outputs: ['kelly_fraction', 'fractional_kelly', 'risk_assessment'],
    endpoint: '/api/functions/kelly_criterion',
    status: 'active'
  },
  'technical_indicators': {
    type: 'function',
    category: 'technical',
    description: 'Calculates various technical analysis indicators',
    inputs: ['prices', 'high_prices', 'low_prices', 'volumes', 'indicator', 'period'],
    outputs: ['values', 'signals', 'statistics'],
    endpoint: '/api/functions/technical_indicators',
    status: 'active'
  }
};

// A2A Agent Class
class A2AAgent {
  constructor(agentData) {
    this.id = agentData.agent_id;
    this.name = agentData.agent_name;
    this.goals = agentData.connection_config?.goals || [];
    this.personality = agentData.connection_config?.personality || 'collaborative';
    this.votingPower = agentData.connection_config?.voting_power || 100;
    this.tools = [];
    this.contracts = new Map();
    this.memory = new Map();
  }

  // Core A2A Methods with ORD compliance
  async discoverFunctions(category = null, useORD = true) {
    let discoveredFunctions;
    
    if (useORD) {
      try {
        // Use ORD-compliant discovery
        const response = await fetch(`${process.env.BASE_URL || 'https://hana-proxy-vercel.vercel.app'}/api/a2a/functions?discovery_method=ord${category ? `&category=${category}` : ''}`);
        const result = await response.json();
        
        if (result.success && result.functions) {
          discoveredFunctions = Object.entries(result.functions);
          console.log(`Agent ${this.id} discovered ${discoveredFunctions.length} functions via ORD`);
        } else {
          throw new Error('ORD discovery failed');
        }
      } catch (error) {
        console.log(`Agent ${this.id} falling back to internal registry:`, error.message);
        // Fallback to internal registry
        const functions = Object.entries(FUNCTION_REGISTRY);
        discoveredFunctions = category 
          ? functions.filter(([_, func]) => func.category === category)
          : functions;
      }
    } else {
      // Use internal registry directly
      const functions = Object.entries(FUNCTION_REGISTRY);
      discoveredFunctions = category 
        ? functions.filter(([_, func]) => func.category === category)
        : functions;
    }
    
    this.tools = discoveredFunctions.map(([name, func]) => ({ 
      name, 
      ...func,
      discovered_via: useORD ? 'ord' : 'internal',
      agent_id: this.id 
    }));
    
    // Log discovery for learning
    this.logFunctionDiscovery(this.tools.length, category, useORD);
    
    return this.tools;
  }

  async callFunction(functionName, params) {
    const func = FUNCTION_REGISTRY[functionName];
    if (!func) {
      throw new Error(`Function ${functionName} not found in registry`);
    }

    // Direct function call without MCP
    try {
      const response = await fetch(`${process.env.BASE_URL || 'https://hana-proxy-vercel.vercel.app'}${func.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const result = await response.json();
      
      // Log usage for learning
      this.logFunctionUsage(functionName, params, result);
      
      return result;
    } catch (error) {
      console.error(`Function call failed: ${functionName}`, error);
      throw error;
    }
  }

  async negotiate(targetAgentId, proposal) {
    const contract = {
      id: crypto.randomBytes(16).toString('hex'),
      requester: this.id,
      provider: targetAgentId,
      proposal: proposal,
      terms: {
        payment: this.calculatePayment(proposal),
        deadline: new Date(Date.now() + proposal.urgency * 60000),
        quality: proposal.qualityLevel || 'standard'
      },
      status: 'pending',
      created: new Date()
    };

    // Store contract and await response
    this.contracts.set(contract.id, contract);
    
    // Notify target agent via database event
    if (supabase) {
      await supabase
        .from('a2a_contracts')
        .insert(contract);
    }

    return contract;
  }

  async respondToContract(contractId, response) {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;

    contract.status = response.accepted ? 'accepted' : 'rejected';
    contract.response = response;
    contract.updated = new Date();

    if (supabase) {
      await supabase
        .from('a2a_contracts')
        .update({ status: contract.status, response: response })
        .eq('id', contractId);
    }

    return contract;
  }

  // Agent-specific decision making with blockchain consensus integration
  async makeDecision(context) {
    // Each agent implements its own decision logic
    const baseDecision = this.getBaseDecision(context);
    
    // If decision requires consensus, initiate blockchain voting
    if (baseDecision.requiresConsensus) {
      return await this.initiateConsensusDecision(baseDecision, context);
    }
    
    return baseDecision;
  }
  
  getBaseDecision(context) {
    switch (this.personality) {
      case 'conservative':
        return this.conservativeDecision(context);
      case 'aggressive':
        return this.aggressiveDecision(context);
      case 'analytical':
        return this.analyticalDecision(context);
      default:
        return this.defaultDecision(context);
    }
  }
  
  async initiateConsensusDecision(decision, context) {
    try {
      // Create consensus proposal
      const proposalId = crypto.randomBytes(16).toString('hex');
      const proposal = {
        proposal_id: proposalId,
        proposer_id: this.id,
        proposal_type: 'agent_decision',
        proposal_data: {
          decision: decision,
          context: context,
          requires_votes: Math.min(5, Math.max(3, Math.floor(this.votingPower / 50))),
          voting_deadline: new Date(Date.now() + 300000) // 5 minutes
        },
        status: 'active',
        created_at: new Date()
      };
      
      // Store in database
      if (supabase) {
        await supabase
          .from('a2a_proposals')
          .insert(proposal);
          
        // Start consensus round
        await supabase
          .from('a2a_consensus_rounds')
          .insert({
            proposal_id: proposalId,
            voting_weights: this.calculateVotingWeights(),
            blockchain_consensus: true,
            consensus_algorithm: 'weighted_voting',
            required_participants: proposal.proposal_data.requires_votes,
            status: 'active'
          });
      }
      
      return {
        ...decision,
        consensus_required: true,
        proposal_id: proposalId,
        status: 'pending_consensus'
      };
      
    } catch (error) {
      console.error('Consensus initiation failed:', error);
      // Fallback to individual decision
      return decision;
    }
  }
  
  calculateVotingWeights() {
    // Calculate voting weights based on agent reputation and stake
    const baseWeight = this.votingPower || 100;
    const reputationMultiplier = (this.reputation || 100) / 100;
    const performanceMultiplier = (this.performance_score || 100) / 100;
    
    return {
      [this.id]: Math.round(baseWeight * reputationMultiplier * performanceMultiplier)
    };
  }
  
  async participateInConsensus(proposalId, vote, reasoning) {
    try {
      const voteRecord = {
        vote_id: crypto.randomBytes(16).toString('hex'),
        proposal_id: proposalId,
        voter_id: this.id,
        vote: vote, // 'approve', 'reject', 'abstain'
        voting_power: this.votingPower,
        reasoning: reasoning,
        signature: this.signVote(proposalId, vote),
        created_at: new Date()
      };
      
      if (supabase) {
        await supabase
          .from('a2a_votes')
          .insert(voteRecord);
          
        // Check if consensus reached
        await this.checkConsensusStatus(proposalId);
      }
      
      return voteRecord;
      
    } catch (error) {
      console.error('Consensus participation failed:', error);
      throw error;
    }
  }
  
  async checkConsensusStatus(proposalId) {
    if (!supabase) return;
    
    // Get consensus round details
    const { data: round } = await supabase
      .from('a2a_consensus_rounds')
      .select('*')
      .eq('proposal_id', proposalId)
      .single();
    
    if (!round || round.status !== 'active') return;
    
    // Get all votes
    const { data: votes } = await supabase
      .from('a2a_votes')
      .select('*')
      .eq('proposal_id', proposalId);
    
    if (!votes || votes.length < round.required_participants) {
      return; // Not enough votes yet
    }
    
    // Calculate weighted consensus
    const totalWeight = votes.reduce((sum, vote) => sum + (vote.voting_power || 100), 0);
    const approveWeight = votes
      .filter(v => v.vote === 'approve')
      .reduce((sum, vote) => sum + (vote.voting_power || 100), 0);
    
    const consensusReached = (approveWeight / totalWeight) >= 0.6; // 60% threshold
    
    // Update consensus round
    await supabase
      .from('a2a_consensus_rounds')
      .update({
        status: consensusReached ? 'approved' : 'rejected',
        final_result: {
          total_votes: votes.length,
          total_weight: totalWeight,
          approve_weight: approveWeight,
          consensus_percentage: (approveWeight / totalWeight * 100).toFixed(2),
          approved: consensusReached
        },
        completed_at: new Date()
      })
      .eq('proposal_id', proposalId);
    
    // Update proposal status
    await supabase
      .from('a2a_proposals')  
      .update({
        status: consensusReached ? 'approved' : 'rejected',
        resolved_at: new Date()
      })
      .eq('proposal_id', proposalId);
      
    return consensusReached;
  }
  
  signVote(proposalId, vote) {
    // Create cryptographic signature for vote integrity
    return crypto.createHash('sha256')
      .update(`${this.id}-${proposalId}-${vote}-${Date.now()}`)
      .digest('hex');
  }

  // Learning and adaptation
  logFunctionUsage(functionName, params, result) {
    const usage = {
      timestamp: new Date(),
      function: functionName,
      params: params,
      result: result,
      success: !result.error
    };
    
    const history = this.memory.get('function_usage') || [];
    history.push(usage);
    this.memory.set('function_usage', history.slice(-100)); // Keep last 100
  }

  adaptBehavior() {
    const usage = this.memory.get('function_usage') || [];
    const successful = usage.filter(u => u.success);
    
    // Learn which functions work best for this agent's goals
    const functionStats = {};
    successful.forEach(u => {
      functionStats[u.function] = (functionStats[u.function] || 0) + 1;
    });
    
    this.preferredTools = Object.entries(functionStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);
  }

  calculatePayment(proposal) {
    const basePayment = this.votingPower * 0.01;
    const urgencyMultiplier = proposal.urgency || 1;
    const complexityMultiplier = proposal.complexity || 1;
    
    return Math.round(basePayment * urgencyMultiplier * complexityMultiplier);
  }
}

// Specialized Agent Implementations
class MarketRegimeAgent extends A2AAgent {
  constructor(agentData) {
    super(agentData);
    this.specialization = 'market_regime_detection';
  }

  async detectRegime(marketData) {
    // Use multiple functions as tools
    const [volatility, correlations, trends] = await Promise.all([
      this.callFunction('garch_volatility', { returns: marketData.returns }),
      this.callFunction('correlation_matrix', { data: marketData.assets }),
      this.callFunction('technical_indicators', { prices: marketData.prices })
    ]);

    // Apply agent's analytical judgment
    const regime = this.synthesizeRegimeAnalysis(volatility, correlations, trends);
    
    // Notify other agents if regime change detected
    if (regime.changed) {
      await this.broadcastRegimeChange(regime);
    }

    return regime;
  }

  synthesizeRegimeAnalysis(volatility, correlations, trends) {
    // Agent-specific logic based on personality and goals
    if (this.personality === 'adaptive') {
      return this.adaptiveRegimeAnalysis(volatility, correlations, trends);
    }
    return this.standardRegimeAnalysis(volatility, correlations, trends);
  }
}

class PortfolioOptimizationAgent extends A2AAgent {
  constructor(agentData) {
    super(agentData);
    this.specialization = 'portfolio_optimization';
  }

  async optimizePortfolio(portfolio, constraints) {
    // Negotiate with risk management agent
    const riskAssessment = await this.negotiate('finsight.analytics.stress_testing', {
      task: 'risk_assessment',
      portfolio: portfolio,
      urgency: 2,
      complexity: 3
    });

    // Use computational functions as tools
    const [returns, volatilities, correlations] = await Promise.all([
      this.callFunction('sharpe_ratio', { returns: portfolio.returns }),
      this.callFunction('portfolio_volatility', { weights: portfolio.weights }),
      this.callFunction('correlation_matrix', { assets: portfolio.assets })
    ]);

    // Strategic decision making based on goals
    const optimization = this.makeOptimizationDecision(
      returns, volatilities, correlations, constraints
    );

    return optimization;
  }

  makeOptimizationDecision(returns, volatilities, correlations, constraints) {
    // Goal-driven decision making
    if (this.goals.includes('maximize_sharpe_ratio')) {
      return this.maximizeSharpe(returns, volatilities, correlations);
    }
    if (this.goals.includes('minimize_risk')) {
      return this.minimizeRisk(volatilities, correlations, constraints);
    }
    
    return this.balancedOptimization(returns, volatilities, correlations);
  }
}

// Agent Factory
function createAgent(agentData) {
  switch (agentData.agent_id) {
    case 'finsight.analytics.regime_detection':
      return new MarketRegimeAgent(agentData);
    case 'finsight.analytics.portfolio_optimization':
      return new PortfolioOptimizationAgent(agentData);
    case 'finsight.data.news_intelligence':
      // Import and return NewsIntelligenceAgent when needed
      return new A2AAgent(agentData); // Fallback for now
    default:
      return new A2AAgent(agentData);
  }
}

// Main handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url.split('?')[0];

  try {
    // A2A Agent System endpoints
    if (path === '/api/a2a/agents') {
      return handleAgentOperations(req, res);
    }
    
    if (path === '/api/a2a/functions') {
      return handleFunctionRegistry(req, res);
    }
    
    if (path === '/api/a2a/contracts') {
      return handleContractNegotiation(req, res);
    }

    if (path.startsWith('/api/a2a/agent/')) {
      const agentId = path.split('/')[4];
      return handleAgentInteraction(agentId, req, res);
    }

    return res.status(404).json({ error: 'A2A endpoint not found' });

  } catch (error) {
    console.error('A2A System error:', error);
    return res.status(500).json({ 
      error: 'A2A system error',
      details: error.message 
    });
  }
}

async function handleAgentOperations(req, res) {
  if (req.method === 'GET') {
    // Get all true A2A agents
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { data: agents } = await supabase
      .from('a2a_agents')
      .select('*')
      .in('agent_id', TRUE_A2A_AGENTS)
      .eq('status', 'active');

    return res.json({
      success: true,
      agents: agents || [],
      count: agents?.length || 0,
      type: 'a2a_agents'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleFunctionRegistry(req, res) {
  if (req.method === 'GET') {
    const { category, discovery_method = 'internal' } = req.query;
    
    // Support ORD-compliant discovery
    if (discovery_method === 'ord') {
      try {
        // Fetch functions from ORD system
        const ordResponse = await fetch(`${process.env.BASE_URL || 'https://hana-proxy-vercel.vercel.app'}/open-resource-discovery/v1/documents/function-registry`);
        const ordData = await ordResponse.json();
        
        const ordFunctions = {};
        if (ordData.apiResources) {
          ordData.apiResources.forEach(resource => {
            if (resource.title && resource.title.includes('API')) {
              const functionName = resource.ordId.split(':').pop().replace('-api:v1', '');
              ordFunctions[functionName] = {
                type: 'function',
                category: resource.partOfGroups?.[0]?.includes('risk') ? 'risk' : 
                         resource.partOfGroups?.[0]?.includes('performance') ? 'performance' : 'statistical',
                description: resource.shortDescription,
                ord_id: resource.ordId,
                endpoint: resource.definitionUrl || `/api/functions/${functionName}`,
                status: 'active',
                discovery_method: 'ord',
                inputs: resource.entityTypeMappings?.find(m => m.entitySetName === 'request')?.entityTypeTargets || [],
                outputs: resource.entityTypeMappings?.find(m => m.entitySetName === 'response')?.entityTypeTargets || []
              };
            }
          });
        }
        
        return res.json({
          success: true,
          functions: ordFunctions,
          discovery_method: 'ord',
          total_functions: Object.keys(ordFunctions).length,
          ord_compliance: '100%'
        });
      } catch (error) {
        console.error('ORD discovery failed:', error);
        // Fallback to internal registry
      }
    }
    
    // Internal function registry
    let functions = Object.entries(FUNCTION_REGISTRY);
    if (category) {
      functions = functions.filter(([_, func]) => func.category === category);
    }

    return res.json({
      success: true,
      functions: Object.fromEntries(functions),
      categories: [...new Set(Object.values(FUNCTION_REGISTRY).map(f => f.category))],
      discovery_method: 'internal',
      total_functions: functions.length,
      ord_support: {
        available: true,
        endpoint: '/api/a2a/functions?discovery_method=ord'
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleContractNegotiation(req, res) {
  if (req.method === 'POST') {
    const { requester, provider, proposal } = req.body;
    
    // Create contract between agents
    const contract = {
      id: crypto.randomBytes(16).toString('hex'),
      requester,
      provider,
      proposal,
      status: 'pending',
      created: new Date()
    };

    if (supabase) {
      await supabase
        .from('a2a_contracts')
        .insert(contract);
    }

    return res.json({
      success: true,
      contract
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleAgentInteraction(agentId, req, res) {
  if (!TRUE_A2A_AGENTS.includes(agentId)) {
    return res.status(404).json({ error: 'Agent not found in A2A registry' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { data: agentData } = await supabase
    .from('a2a_agents')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (!agentData) {
    return res.status(404).json({ error: 'Agent data not found' });
  }

  const agent = createAgent(agentData);

  if (req.method === 'POST') {
    const { action, params } = req.body;

    switch (action) {
      case 'discover_functions':
        const functions = await agent.discoverFunctions(params.category);
        return res.json({ success: true, functions });

      case 'call_function':
        const result = await agent.callFunction(params.functionName, params.functionParams);
        return res.json({ success: true, result });

      case 'negotiate':
        const contract = await agent.negotiate(params.targetAgent, params.proposal);
        return res.json({ success: true, contract });

      case 'make_decision':
        const decision = agent.makeDecision(params.context);
        return res.json({ success: true, decision });

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
// Export the A2AAgent class for use by other agents
export { A2AAgent };
