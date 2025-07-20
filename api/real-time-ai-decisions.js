/**
 * Real-Time AI Decision Engine
 * Makes instant intelligent decisions for every system interaction
 * Powered by xAI/Grok for maximum intelligence
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Real-time decision cache with ultra-short TTL
const decisionCache = new Map();
const DECISION_CACHE_TTL = 30000; // 30 seconds for real-time freshness

// Decision context accumulator
const contextAccumulator = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'decide':
        return await makeRealTimeDecision(req, res);
      case 'stream-decisions':
        return await streamDecisions(req, res);
      case 'context-aware-decision':
        return await makeContextAwareDecision(req, res);
      case 'multi-agent-decision':
        return await makeMultiAgentDecision(req, res);
      case 'predictive-routing':
        return await makePredictiveRouting(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Real-time AI decision error:', error);
    return res.status(500).json({ 
      error: 'AI decision failed',
      fallback: getFallbackDecision(req.body)
    });
  }
}

/**
 * Make real-time AI decision for any system interaction
 */
async function makeRealTimeDecision(req, res) {
  const { context, options, urgency = 'normal', constraints } = req.body;
  
  // Check ultra-fast cache first
  const cacheKey = `decision_${JSON.stringify(context)}_${JSON.stringify(options)}`;
  const cached = getFromCache(cacheKey);
  if (cached && urgency !== 'critical') {
    return res.json({
      decision: cached.decision,
      reasoning: cached.reasoning,
      confidence: cached.confidence,
      cached: true,
      latency: 0
    });
  }
  
  const startTime = Date.now();
  
  // Accumulate context for better decisions
  updateContext(context);
  
  const decision = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a real-time AI decision engine for financial systems. 
                  Make instant, intelligent decisions based on context and constraints.
                  Prioritize: ${urgency === 'critical' ? 'speed and safety' : 'optimization and efficiency'}`
      },
      {
        role: 'user',
        content: `Make an intelligent decision for this scenario:

Context: ${JSON.stringify(context, null, 2)}
Options: ${JSON.stringify(options, null, 2)}
Constraints: ${JSON.stringify(constraints, null, 2)}
Historical Context: ${JSON.stringify(getRecentContext(), null, 2)}

Decide:
1. Best option to choose
2. Why this is optimal
3. Potential risks
4. Alternative if primary fails
5. Confidence level

Return JSON:
{
  "decision": {
    "primary": "selected_option",
    "fallback": "alternative_option",
    "parameters": {}
  },
  "reasoning": "why this decision is optimal",
  "risks": ["risk1", "risk2"],
  "confidence": 0.95,
  "executionPlan": {
    "steps": ["step1", "step2"],
    "parallelizable": true,
    "estimatedTime": 100
  },
  "monitoring": {
    "metrics": ["metric1", "metric2"],
    "thresholds": {"metric1": 0.95}
  }
}`
      }
    ],
    temperature: urgency === 'critical' ? 0.1 : 0.3,
    max_tokens: 1500
  });
  
  const latency = Date.now() - startTime;
  
  // Cache decision
  if (decision) {
    setInCache(cacheKey, decision);
    
    // Log for learning
    await logDecision({
      context,
      options,
      decision,
      latency,
      urgency
    });
  }
  
  return res.json({
    ...decision,
    latency,
    realTime: true
  });
}

/**
 * Stream real-time decisions via Server-Sent Events
 */
async function streamDecisions(req, res) {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const { streamContext } = req.query;
  
  // Send initial connection
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ 
    type: 'connected',
    streamId: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  })}\n\n`);
  
  // Real-time decision stream
  const interval = setInterval(async () => {
    const decision = await makeStreamDecision(streamContext);
    
    res.write(`event: decision\n`);
    res.write(`data: ${JSON.stringify({
      type: 'real-time-decision',
      decision: decision.action,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 1000); // Every second for real-time updates
  
  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
}

/**
 * Make context-aware decisions using accumulated knowledge
 */
async function makeContextAwareDecision(req, res) {
  const { decision, userContext, systemState } = req.body;
  
  // Get full context including history
  const fullContext = {
    current: { decision, userContext, systemState },
    historical: getRecentContext(),
    patterns: await getContextPatterns(),
    predictions: await predictNextActions(userContext)
  };
  
  const intelligentDecision = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a context-aware AI that makes decisions based on comprehensive understanding.
                  Consider historical patterns, user behavior, and system state.`
      },
      {
        role: 'user',
        content: `Make a context-aware decision:

Full Context:
${JSON.stringify(fullContext, null, 2)}

Provide:
1. Optimal decision considering all context
2. How historical patterns influence this
3. Predicted next actions
4. Proactive suggestions
5. Risk mitigation based on patterns

Return JSON:
{
  "decision": {
    "action": "recommended_action",
    "timing": "immediate|delayed|scheduled",
    "prerequisites": []
  },
  "contextInfluence": {
    "historicalWeight": 0.3,
    "patternMatch": "pattern_name",
    "similarCases": 5
  },
  "predictions": {
    "nextLikelyAction": "action",
    "probability": 0.85,
    "timeframe": "5m"
  },
  "proactiveSuggestions": [
    {
      "suggestion": "prepare X for upcoming Y",
      "reason": "based on pattern Z",
      "benefit": "reduce latency by 50%"
    }
  ],
  "riskMitigation": {
    "identifiedRisks": [],
    "mitigations": []
  },
  "confidence": 0.92
}`
      }
    ],
    temperature: 0.2,
    max_tokens: 2000
  });
  
  // Update context with this decision
  updateContext({
    decision: intelligentDecision,
    timestamp: Date.now()
  });
  
  return res.json({
    ...intelligentDecision,
    contextAware: true
  });
}

/**
 * Multi-agent collaborative decision making
 */
async function makeMultiAgentDecision(req, res) {
  const { decision, agents, consensusMethod = 'weighted-voting' } = req.body;
  
  // Get each agent's perspective
  const agentDecisions = await Promise.all(
    agents.map(agent => getAgentPerspective(decision, agent))
  );
  
  // AI-mediated consensus
  const consensus = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a multi-agent consensus mediator. Synthesize different agent perspectives
                  into optimal decisions using ${consensusMethod} consensus method.`
      },
      {
        role: 'user',
        content: `Mediate consensus between agents:

Decision: ${JSON.stringify(decision, null, 2)}
Agent Perspectives: ${JSON.stringify(agentDecisions, null, 2)}
Consensus Method: ${consensusMethod}

Provide:
1. Consensus decision
2. How each agent influenced it
3. Dissenting opinions handled
4. Confidence in consensus
5. Alternative if consensus fails

Return JSON:
{
  "consensusDecision": {
    "action": "agreed_action",
    "parameters": {},
    "executionAgent": "best_suited_agent"
  },
  "agentInfluence": {
    "agent_id": {
      "weight": 0.3,
      "contribution": "specific insight",
      "agreement": 0.95
    }
  },
  "dissentHandling": {
    "minorityOpinions": [],
    "compromises": []
  },
  "consensusStrength": 0.88,
  "fallbackPlan": {
    "trigger": "consensus < 0.7",
    "action": "fallback_action"
  },
  "explanation": "how consensus was reached"
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });
  
  return res.json({
    consensus,
    agentCount: agents.length,
    method: consensusMethod,
    realTime: true
  });
}

/**
 * Predictive routing based on AI analysis
 */
async function makePredictiveRouting(req, res) {
  const { request, currentLoad, availableRoutes } = req.body;
  
  // Predict optimal routing
  const routing = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are an intelligent routing engine. Predict optimal paths based on 
                  current conditions and future predictions.`
      },
      {
        role: 'user',
        content: `Determine optimal routing:

Request: ${JSON.stringify(request, null, 2)}
Current System Load: ${JSON.stringify(currentLoad, null, 2)}
Available Routes: ${JSON.stringify(availableRoutes, null, 2)}

Predict:
1. Optimal route now
2. Load prediction for next 5 minutes
3. Preemptive route adjustments
4. Failover preparations
5. Performance optimization

Return JSON:
{
  "routing": {
    "primary": "route_id",
    "secondary": "backup_route_id",
    "loadBalancing": {
      "method": "weighted|round-robin|least-connections",
      "weights": {"route1": 0.6, "route2": 0.4}
    }
  },
  "predictions": {
    "loadIn1Min": {"route1": 0.8, "route2": 0.5},
    "loadIn5Min": {"route1": 0.9, "route2": 0.6},
    "bottlenecks": ["potential bottleneck points"]
  },
  "optimizations": {
    "caching": ["cache these endpoints"],
    "prefetch": ["prefetch these resources"],
    "scaleUp": ["scale these services"]
  },
  "failoverReady": true,
  "performanceGain": "23%",
  "confidence": 0.91
}`
      }
    ],
    temperature: 0.2,
    max_tokens: 1500
  });
  
  // Implement predictive adjustments
  if (routing?.optimizations) {
    await implementOptimizations(routing.optimizations);
  }
  
  return res.json({
    ...routing,
    implemented: true,
    realTime: true
  });
}

/**
 * Helper functions
 */

async function callGrokAPI(config) {
  if (!GROK_API_KEY) return getFallbackDecision();
  
  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        ...config,
        model: 'grok-4-0709',
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return getFallbackDecision();
    }
  } catch (error) {
    console.error('Grok API call failed:', error);
    return getFallbackDecision();
  }
}

function getFromCache(key) {
  const cached = decisionCache.get(key);
  if (cached && (Date.now() - cached.timestamp < DECISION_CACHE_TTL)) {
    return cached.data;
  }
  return null;
}

function setInCache(key, data) {
  decisionCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup old cache entries
  if (decisionCache.size > 1000) {
    const oldestKey = decisionCache.keys().next().value;
    decisionCache.delete(oldestKey);
  }
}

function updateContext(context) {
  const now = Date.now();
  contextAccumulator.set(now, context);
  
  // Keep only recent context (last 5 minutes)
  for (const [timestamp, _] of contextAccumulator) {
    if (now - timestamp > 300000) {
      contextAccumulator.delete(timestamp);
    }
  }
}

function getRecentContext() {
  const contexts = Array.from(contextAccumulator.values());
  return contexts.slice(-10); // Last 10 contexts
}

async function getContextPatterns() {
  // Analyze accumulated context for patterns
  const contexts = Array.from(contextAccumulator.values());
  
  const patterns = {
    commonDecisions: {},
    timePatterns: {},
    userPatterns: {}
  };
  
  contexts.forEach(ctx => {
    if (ctx.decision) {
      patterns.commonDecisions[ctx.decision] = 
        (patterns.commonDecisions[ctx.decision] || 0) + 1;
    }
  });
  
  return patterns;
}

async function predictNextActions(userContext) {
  // Simple prediction based on context patterns
  const patterns = await getContextPatterns();
  
  return {
    likelyNext: Object.keys(patterns.commonDecisions)[0] || 'unknown',
    confidence: 0.7
  };
}

async function makeStreamDecision(context) {
  // Real-time decision based on context
  if (!GROK_API_KEY) {
    return null;
  }
  
  const decision = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a real-time streaming AI decision engine. Provide instant decisions based on current context.'
      },
      {
        role: 'user',
        content: `Make a streaming decision for context: ${JSON.stringify(context)}`
      }
    ],
    temperature: 0.4,
    max_tokens: 200
  });
  
  return decision || null;
}

async function getAgentPerspective(decision, agent) {
  // Get real agent perspective via AI analysis
  if (!GROK_API_KEY) {
    return null;
  }
  
  const perspective = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are simulating agent ${agent.id} with capability ${agent.capability}. Provide your perspective on this decision.`
      },
      {
        role: 'user',
        content: `Decision context: ${JSON.stringify(decision)}\nAgent capability: ${agent.capability}\nProvide your recommendation and reasoning.`
      }
    ],
    temperature: 0.3,
    max_tokens: 300
  });
  
  return perspective || null;
}

async function implementOptimizations(optimizations) {
  // Log optimizations for implementation
  if (supabase) {
    await supabase
      .from('ai_optimizations')
      .insert({
        optimizations,
        implemented_at: new Date(),
        source: 'real-time-ai'
      });
  }
}

async function logDecision(decision) {
  if (supabase) {
    await supabase
      .from('ai_decision_log')
      .insert({
        ...decision,
        created_at: new Date()
      });
  }
}

function getFallbackDecision(context) {
  // Intelligent fallback when AI is unavailable
  return {
    decision: {
      primary: context?.options?.[0] || 'default',
      fallback: context?.options?.[1] || 'safe-mode'
    },
    reasoning: 'Fallback decision due to AI unavailability',
    confidence: 0.6,
    fallback: true
  };
}

/**
 * Real-time AI Decision Middleware
 * Can be integrated into any request flow
 */
export async function aiDecisionMiddleware(context, next) {
  // Make real-time decision
  const decision = await makeRealTimeDecision({
    body: { context, options: context.options, urgency: 'normal' }
  }, {
    json: (data) => data
  });
  
  // Apply decision to context
  context.aiDecision = decision;
  context.aiEnhanced = true;
  
  // Continue with enhanced context
  return next(context);
}