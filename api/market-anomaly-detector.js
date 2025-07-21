/**
 * AI-Powered Market Anomaly Detection System
 * Uses xAI/Grok for intelligent pattern recognition and anomaly detection
 * Identifies unusual market patterns, volume spikes, and price movements
 */

import { createClient } from '@supabase/supabase-js';
import { callGrokStructured } from '../lib/grok-structured-schemas.js';
import { storeAnomalyDetection } from '../lib/ai-to-database-mapper.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Anomaly cache to avoid repeated analysis
const anomalyCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

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
      case 'detect-anomalies':
        return await detectMarketAnomalies(req, res);
      case 'analyze-pattern':
        return await analyzeSpecificPattern(req, res);
      case 'predict-breakout':
        return await predictBreakoutProbability(req, res);
      case 'volume-analysis':
        return await analyzeVolumeAnomalies(req, res);
      case 'cross-asset-analysis':
        return await analyzeCrossAssetAnomalies(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Market anomaly detection error:', error);
    return res.status(500).json({ 
      error: 'Anomaly detection failed',
      details: error.message 
    });
  }
}

/**
 * Detect market anomalies using AI pattern recognition
 */
async function detectMarketAnomalies(req, res) {
  const { marketData, symbol, timeframe = '1d' } = req.body;
  
  if (!marketData) {
    return res.status(400).json({ error: 'Market data required' });
  }
  
  // Check cache first
  const cacheKey = `anomalies_${symbol}_${timeframe}_${JSON.stringify(marketData).slice(0, 100)}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  // Define anomaly detection schema
  const anomalySchema = {
    name: "market_anomaly_detection",
    schema: {
      type: "object",
      properties: {
        anomalies_detected: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["price", "volume", "pattern", "statistical", "regime", "microstructure"]
              },
              severity: {
                type: "string",
                enum: ["low", "medium", "high", "critical"]
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              description: { type: "string" },
              current_value: { type: "number" },
              expected_range: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              z_score: { type: "number" },
              probability: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              timeframe_detected: { type: "string" },
              potential_causes: {
                type: "array",
                items: { type: "string" }
              },
              trading_implications: {
                type: "object",
                properties: {
                  direction: {
                    type: "string",
                    enum: ["bullish", "bearish", "neutral"]
                  },
                  suggested_action: {
                    type: "string",
                    enum: ["buy", "sell", "hold", "monitor"]
                  },
                  risk_level: {
                    type: "string",
                    enum: ["low", "medium", "high"]
                  },
                  timeframe: { type: "string" }
                },
                required: ["direction", "suggested_action", "risk_level"]
              },
              historical_context: { type: "string" }
            },
            required: ["type", "severity", "confidence", "description"]
          }
        },
        pattern_analysis: {
          type: "object",
          properties: {
            chart_patterns: {
              type: "array",
              items: { type: "string" }
            },
            support_resistance: {
              type: "object",
              properties: {
                key_levels: {
                  type: "array",
                  items: { type: "number" }
                },
                strength: {
                  type: "string",
                  enum: ["weak", "moderate", "strong"]
                },
                test_count: { type: "integer" }
              }
            },
            trend_analysis: {
              type: "object",
              properties: {
                current_trend: {
                  type: "string",
                  enum: ["uptrend", "downtrend", "sideways"]
                },
                trend_strength: {
                  type: "number",
                  minimum: 0,
                  maximum: 1
                },
                trend_duration: { type: "string" },
                potential_reversal: {
                  type: "number",
                  minimum: 0,
                  maximum: 1
                }
              }
            }
          }
        },
        volume_profile: {
          type: "object",
          properties: {
            volume_anomalies: {
              type: "array",
              items: { type: "string" }
            },
            institutional_activity: {
              type: "string",
              enum: ["accumulation", "distribution", "neutral"]
            },
            volume_price_divergence: { type: "boolean" }
          }
        },
        cross_market_impact: {
          type: "object",
          properties: {
            sector_correlation: {
              type: "number",
              minimum: -1,
              maximum: 1
            },
            market_correlation: {
              type: "number",
              minimum: -1,
              maximum: 1
            },
            relative_strength: { type: "number" },
            beta_anomaly: { type: "boolean" }
          }
        },
        risk_assessment: {
          type: "object",
          properties: {
            volatility_expansion: { type: "boolean" },
            overall_risk: {
              type: "string",
              enum: ["low", "medium", "high", "extreme"]
            },
            black_swan_probability: {
              type: "number",
              minimum: 0,
              maximum: 1
            }
          }
        },
        ai_recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string" },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              reasoning: { type: "string" },
              timeframe: { type: "string" }
            },
            required: ["action", "confidence", "reasoning"]
          }
        }
      },
      required: ["anomalies_detected", "pattern_analysis", "risk_assessment"],
      additionalProperties: false
    }
  };

  const messages = [
    {
      role: 'system',
      content: `You are an advanced market anomaly detection AI with expertise in:
- Statistical anomaly detection using Z-scores and isolation forests
- Technical pattern recognition (flags, pennants, triangles, head & shoulders)
- Volume analysis and institutional flow detection
- Price-action discrepancies and market inefficiencies
- Cross-asset correlation breakdowns
- Regime change detection`
    },
    {
      role: 'user',
      content: `Analyze this market data for anomalies and unusual patterns:

Symbol: ${symbol}
Timeframe: ${timeframe}
Market Data: ${JSON.stringify(marketData)}

Detect and classify anomalies by:
1. **Price Anomalies**: Unusual price movements vs. historical patterns
2. **Volume Anomalies**: Volume spikes, volume-price divergences
3. **Technical Patterns**: Chart patterns nearing completion or breaking
4. **Statistical Outliers**: Z-score > 2 or isolation forest detected outliers
5. **Regime Changes**: Volatility shifts, correlation breakdowns
6. **Market Microstructure**: Bid-ask spread anomalies, order flow imbalances`
    }
  ];

  const anomalies = await callGrokStructured(GROK_API_KEY, messages, anomalySchema, {
    temperature: 0.3,
    max_tokens: 2000
  });

  // Store anomalies in database
  if (anomalies && anomalies.anomalies_detected.length > 0) {
    try {
      const storageResult = await storeAnomalyDetection(
        symbol,
        anomalies,
        'agent-anomaly-detector'
      );
      
      // Add storage info to response
      anomalies._storage = storageResult;
    } catch (storeError) {
      console.warn('Failed to store anomaly detection:', storeError.message);
      anomalies._storage = { success: false, error: storeError.message };
    }
  }
    "correlation_breakdown": true|false,
    "liquidity_concerns": true|false,
    "overall_risk": "low|medium|high|extreme"
  },
  "actionable_insights": [
    {
      "insight": "specific actionable insight",
      "priority": "high|medium|low",
      "timeframe": "immediate|short_term|medium_term",
      "expected_outcome": "description of expected outcome"
    }
  ],
  "monitoring_alerts": [
    {
      "condition": "specific condition to monitor",
      "threshold": <value>,
      "action": "what to do when threshold is met"
    }
  ]
}`
      }
    ],
    temperature: 0.2,
    max_tokens: 3000
  });

  const result = {
    symbol,
    timeframe,
    analysis_timestamp: new Date().toISOString(),
    anomalies: anomalies || { anomalies_detected: [] },
    aiPowered: true
  };

  // Cache result
  setInCache(cacheKey, result);
  
  // Store analysis for learning
  if (supabase && anomalies) {
    await supabase
      .from('market_anomaly_detections')
      .insert({
        symbol,
        timeframe,
        market_data: marketData,
        anomalies_detected: anomalies.anomalies_detected,
        analysis_result: anomalies,
        created_at: new Date()
      });
  }

  return res.json(result);
}

/**
 * Analyze specific pattern with AI
 */
async function analyzeSpecificPattern(req, res) {
  const { patternType, priceData, volumeData } = req.body;
  
  const analysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a technical analysis expert specializing in chart pattern recognition and probability assessment.'
      },
      {
        role: 'user',
        content: `Analyze this specific pattern:

Pattern Type: ${patternType}
Price Data: ${JSON.stringify(priceData)}
Volume Data: ${JSON.stringify(volumeData)}

Provide detailed pattern analysis:
{
  "pattern_validity": <0-1>,
  "completion_probability": <0-1>,
  "breakout_direction": "up|down|unclear",
  "target_price": <number>,
  "stop_loss": <number>,
  "pattern_quality": "excellent|good|fair|poor",
  "volume_confirmation": true|false,
  "risk_reward_ratio": <number>,
  "timeframe_estimate": "hours|days|weeks",
  "confidence": <0-1>
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 1000
  });

  return res.json({
    pattern_type: patternType,
    analysis: analysis || {},
    timestamp: new Date().toISOString()
  });
}

/**
 * Predict breakout probability with AI
 */
async function predictBreakoutProbability(req, res) {
  const { symbol, priceData, volumeData, newsEvents } = req.body;
  
  const prediction = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a breakout prediction specialist using multi-factor analysis including price action, volume, and fundamental catalysts.'
      },
      {
        role: 'user',
        content: `Predict breakout probability for ${symbol}:

Price Data: ${JSON.stringify(priceData)}
Volume Data: ${JSON.stringify(volumeData)}
News/Events: ${JSON.stringify(newsEvents)}

Analyze breakout potential:
{
  "breakout_probability": <0-1>,
  "direction": "upward|downward|unclear",
  "timeframe": "hours|days|weeks",
  "catalyst_analysis": {
    "technical_factors": ["factor1", "factor2"],
    "fundamental_factors": ["factor1", "factor2"],
    "market_factors": ["factor1", "factor2"]
  },
  "key_levels": {
    "resistance": <price>,
    "support": <price>,
    "breakout_confirmation": <price>
  },
  "volume_requirements": {
    "minimum_volume": <number>,
    "volume_surge_needed": <percentage>
  },
  "success_probability": <0-1>,
  "target_zones": [<price1>, <price2>],
  "risk_factors": ["risk1", "risk2"]
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 1500
  });

  return res.json({
    symbol,
    breakout_analysis: prediction || {},
    analysis_time: new Date().toISOString()
  });
}

/**
 * Analyze volume anomalies with AI
 */
async function analyzeVolumeAnomalies(req, res) {
  const { symbol, volumeData, priceData } = req.body;
  
  const analysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a volume analysis expert specializing in detecting institutional activity, accumulation/distribution patterns, and volume-price relationships.'
      },
      {
        role: 'user',
        content: `Analyze volume patterns for ${symbol}:

Volume Data: ${JSON.stringify(volumeData)}
Price Data: ${JSON.stringify(priceData)}

Detect volume anomalies and patterns:
{
  "volume_anomalies": [
    {
      "type": "spike|unusual_distribution|divergence|accumulation|distribution",
      "severity": "mild|moderate|significant|extreme",
      "time_period": "specific time period",
      "volume_multiple": <number>,
      "price_correlation": <-1 to 1>,
      "institutional_activity": "likely|possible|unlikely"
    }
  ],
  "volume_profile": {
    "average_volume": <number>,
    "volume_trend": "increasing|decreasing|stable",
    "volume_volatility": "low|normal|high",
    "peak_volume_times": ["time1", "time2"]
  },
  "price_volume_analysis": {
    "volume_price_trend": "confirming|diverging|neutral",
    "on_balance_volume": "rising|falling|sideways",
    "volume_weighted_price": <number>,
    "money_flow": "positive|negative|neutral"
  },
  "institutional_indicators": {
    "block_trades": <count>,
    "iceberg_orders": "detected|not_detected",
    "dark_pool_activity": "high|medium|low",
    "smart_money_flow": "inflow|outflow|neutral"
  },
  "trading_implications": {
    "volume_confirmation": true|false,
    "breakout_potential": <0-1>,
    "trend_strength": <0-1>,
    "reversal_signals": ["signal1", "signal2"]
  }
}`
      }
    ],
    temperature: 0.2,
    max_tokens: 1500
  });

  return res.json({
    symbol,
    volume_analysis: analysis || {},
    timestamp: new Date().toISOString()
  });
}

/**
 * Analyze cross-asset anomalies and correlations
 */
async function analyzeCrossAssetAnomalies(req, res) {
  const { primaryAsset, correlatedAssets, marketData } = req.body;
  
  const analysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a cross-asset correlation specialist detecting regime changes, correlation breakdowns, and inter-market relationships.'
      },
      {
        role: 'user',
        content: `Analyze cross-asset relationships:

Primary Asset: ${primaryAsset}
Correlated Assets: ${JSON.stringify(correlatedAssets)}
Market Data: ${JSON.stringify(marketData)}

Detect correlation anomalies:
{
  "correlation_analysis": {
    "normal_correlations": {"asset1": <correlation>, "asset2": <correlation>},
    "current_correlations": {"asset1": <correlation>, "asset2": <correlation>},
    "correlation_breakdown": true|false,
    "regime_change": "detected|not_detected"
  },
  "anomalies": [
    {
      "asset_pair": "asset1_asset2",
      "normal_correlation": <number>,
      "current_correlation": <number>,
      "deviation_significance": <0-1>,
      "potential_causes": ["cause1", "cause2"],
      "trading_opportunity": "arbitrage|momentum|mean_reversion|none"
    }
  ],
  "sector_analysis": {
    "sector_rotation": "detected|not_detected",
    "relative_strength": {"sector1": <number>, "sector2": <number>},
    "defensive_vs_cyclical": "defensive_outperforming|cyclical_outperforming|neutral"
  },
  "macro_implications": {
    "yield_curve_impact": "steepening|flattening|neutral",
    "dollar_strength_impact": "positive|negative|neutral",
    "volatility_regime": "low|medium|high|extreme",
    "flight_to_quality": true|false
  },
  "trading_strategies": [
    {
      "strategy": "pairs_trade|momentum|mean_reversion|hedging",
      "asset_combination": ["asset1", "asset2"],
      "expected_return": <percentage>,
      "risk_level": "low|medium|high",
      "timeframe": "days|weeks|months"
    }
  ]
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return res.json({
    primary_asset: primaryAsset,
    cross_asset_analysis: analysis || {},
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper functions
 */

async function callGrokAPI(config) {
  if (!GROK_API_KEY) {
    console.error('Grok API key not configured - market anomaly detection unavailable');
    return null;
  }
  
  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        ...config,
        model: 'grok-4-0709'
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
      console.error('Failed to parse anomaly detection response');
      return null;
    }
  } catch (error) {
    console.error('Grok API call failed:', error);
    return null;
  }
}

function getFromCache(key) {
  const cached = anomalyCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  return null;
}

function setInCache(key, data) {
  anomalyCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup old cache entries
  if (anomalyCache.size > 100) {
    const oldestKey = anomalyCache.keys().next().value;
    anomalyCache.delete(oldestKey);
  }
}

/**
 * Real-time anomaly monitoring (can be called externally)
 */
export async function startAnomalyMonitoring(symbols, callback) {
  const monitoringInterval = setInterval(async () => {
    for (const symbol of symbols) {
      try {
        // This would typically get real-time market data
        const marketData = await getCurrentMarketData(symbol);
        const anomalies = await detectMarketAnomalies({ body: { marketData, symbol } }, { json: (data) => data });
        
        if (anomalies.anomalies?.anomalies_detected?.length > 0) {
          callback(symbol, anomalies);
        }
      } catch (error) {
        console.error(`Anomaly monitoring failed for ${symbol}:`, error);
      }
    }
  }, 60000); // Check every minute
  
  return () => clearInterval(monitoringInterval);
}

async function getCurrentMarketData(symbol) {
  // This would integrate with your market data provider
  // For now, return placeholder structure
  return {
    symbol,
    price: 0,
    volume: 0,
    timestamp: new Date().toISOString()
  };
}