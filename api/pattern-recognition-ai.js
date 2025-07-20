/**
 * AI-Powered Technical Pattern Recognition Engine
 * Uses xAI/Grok for advanced chart pattern analysis and prediction
 * Detects complex patterns, support/resistance levels, and breakout probabilities
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Pattern cache to avoid repeated analysis
const patternCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
      case 'analyze-patterns':
        return await analyzeChartPatterns(req, res);
      case 'detect-breakouts':
        return await detectBreakoutPatterns(req, res);
      case 'support-resistance':
        return await analyzeSupportResistance(req, res);
      case 'trend-analysis':
        return await analyzeTrendPatterns(req, res);
      case 'pattern-completion':
        return await analyzePatternCompletion(req, res);
      case 'multi-timeframe':
        return await multiTimeframeAnalysis(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Pattern recognition error:', error);
    return res.status(500).json({ 
      error: 'Pattern recognition failed',
      details: error.message 
    });
  }
}

/**
 * Analyze chart patterns using AI computer vision approach
 */
async function analyzeChartPatterns(req, res) {
  const { symbol, priceData, volumeData, timeframe = '1d' } = req.body;
  
  if (!priceData || !Array.isArray(priceData)) {
    return res.status(400).json({ error: 'Price data array required' });
  }
  
  // Check cache first
  const cacheKey = `patterns_${symbol}_${timeframe}_${JSON.stringify(priceData).slice(0, 100)}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  const patternAnalysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are an expert technical analyst AI with computer vision capabilities for chart pattern recognition. You specialize in:
- Classic chart patterns (head & shoulders, triangles, flags, pennants, wedges)
- Harmonic patterns (Gartley, Butterfly, Bat, Crab)
- Candlestick patterns and formations
- Elliott Wave pattern identification
- Support/resistance level analysis
- Volume confirmation patterns`
      },
      {
        role: 'user',
        content: `Analyze this price and volume data for technical patterns:

Symbol: ${symbol}
Timeframe: ${timeframe}
Price Data: ${JSON.stringify(priceData.slice(-100))} (last 100 bars)
Volume Data: ${JSON.stringify(volumeData?.slice(-100) || [])}

Identify and analyze all detectable patterns:
{
  "detected_patterns": [
    {
      "pattern_type": "head_and_shoulders|triangle|flag|pennant|wedge|double_top|double_bottom|cup_and_handle|harmonic",
      "pattern_name": "specific pattern name",
      "formation_quality": "excellent|good|fair|poor",
      "completion_status": "forming|nearly_complete|complete|failed",
      "completion_probability": <0-1>,
      "timeframe_duration": "number of bars in pattern",
      "key_levels": {
        "entry": <price>,
        "target": <price>,
        "stop_loss": <price>
      },
      "volume_confirmation": true|false,
      "pattern_measurements": {
        "width": <number>,
        "height": <number>,
        "symmetry": <0-1>
      },
      "reliability_score": <0-1>,
      "risk_reward_ratio": <number>
    }
  ],
  "support_resistance_levels": [
    {
      "level": <price>,
      "type": "support|resistance",
      "strength": "weak|moderate|strong|major",
      "test_count": <number>,
      "last_test_date": "date",
      "break_probability": <0-1>
    }
  ],
  "trend_analysis": {
    "primary_trend": "uptrend|downtrend|sideways",
    "trend_strength": <0-1>,
    "trend_duration": "number of bars",
    "trend_channels": [
      {
        "upper_bound": <price>,
        "lower_bound": <price>,
        "slope": <number>,
        "reliability": <0-1>
      }
    ]
  },
  "candlestick_patterns": [
    {
      "pattern": "doji|hammer|shooting_star|engulfing|harami",
      "position": "bar index",
      "significance": "high|medium|low",
      "confirmation_needed": true|false
    }
  ],
  "elliott_wave_analysis": {
    "wave_count": "wave position",
    "wave_degree": "minor|intermediate|primary",
    "next_expected_move": "up|down|sideways",
    "target_levels": [<price1>, <price2>]
  },
  "fibonacci_levels": {
    "retracement_levels": {
      "23.6": <price>,
      "38.2": <price>,
      "50.0": <price>,
      "61.8": <price>,
      "78.6": <price>
    },
    "extension_levels": {
      "127.2": <price>,
      "161.8": <price>,
      "261.8": <price>
    },
    "key_fibonacci_confluence": [<price1>, <price2>]
  },
  "volume_analysis": {
    "volume_pattern": "increasing|decreasing|irregular",
    "volume_confirmation": "strong|weak|absent",
    "unusual_volume_bars": [<bar_index1>, <bar_index2>],
    "volume_breakout_signals": ["signal1", "signal2"]
  },
  "pattern_predictions": [
    {
      "scenario": "bullish_breakout|bearish_breakdown|continuation",
      "probability": <0-1>,
      "target_price": <price>,
      "timeframe": "bars until target",
      "catalysts": ["catalyst1", "catalyst2"]
    }
  ],
  "risk_assessment": {
    "pattern_failure_risk": <0-1>,
    "false_breakout_probability": <0-1>,
    "volatility_expectation": "low|medium|high",
    "recommended_position_size": <percentage>
  },
  "trading_plan": {
    "entry_strategy": "breakout|pullback|immediate",
    "entry_confirmation": ["confirmation1", "confirmation2"],
    "profit_targets": [<price1>, <price2>, <price3>],
    "stop_loss_strategy": "fixed|trailing|volatility_based",
    "time_stop": "max holding period"
  }
}`
      }
    ],
    temperature: 0.2,
    max_tokens: 3500
  });

  const result = {
    symbol,
    timeframe,
    analysis_timestamp: new Date().toISOString(),
    pattern_analysis: patternAnalysis || { detected_patterns: [] },
    data_points_analyzed: priceData.length,
    aiPowered: true
  };

  // Cache result
  setInCache(cacheKey, result);
  
  // Store analysis for learning
  if (supabase && patternAnalysis) {
    await supabase
      .from('pattern_analysis_log')
      .insert({
        symbol,
        timeframe,
        price_data_length: priceData.length,
        patterns_detected: patternAnalysis.detected_patterns?.length || 0,
        analysis_result: patternAnalysis,
        created_at: new Date()
      });
  }

  return res.json(result);
}

/**
 * Detect breakout patterns with probability assessment
 */
async function detectBreakoutPatterns(req, res) {
  const { symbol, priceData, volumeData, keyLevels } = req.body;
  
  const breakoutAnalysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a breakout detection specialist. Analyze price action near key levels to predict breakout probability and direction.'
      },
      {
        role: 'user',
        content: `Analyze breakout potential for ${symbol}:

Price Data: ${JSON.stringify(priceData.slice(-50))}
Volume Data: ${JSON.stringify(volumeData?.slice(-50) || [])}
Key Levels: ${JSON.stringify(keyLevels)}

Analyze breakout patterns:
{
  "breakout_analysis": [
    {
      "level": <price>,
      "level_type": "support|resistance|trend_line",
      "approach_pattern": "testing|consolidating|rejecting",
      "breakout_probability": <0-1>,
      "breakout_direction": "up|down|unclear",
      "volume_buildup": true|false,
      "price_action_quality": "strong|moderate|weak",
      "false_breakout_risk": <0-1>,
      "minimum_breakout_volume": <number>,
      "target_after_breakout": <price>,
      "estimated_timeframe": "bars|hours|days"
    }
  ],
  "consolidation_patterns": [
    {
      "pattern": "triangle|rectangle|pennant",
      "width": <number>,
      "duration": <number>,
      "volume_decline": true|false,
      "apex_approaching": true|false,
      "breakout_imminent": <0-1>
    }
  ],
  "momentum_indicators": {
    "price_momentum": "accelerating|decelerating|neutral",
    "volume_momentum": "increasing|decreasing|stable",
    "volatility_contraction": true|false,
    "coiling_effect": "tight|moderate|loose"
  },
  "breakout_scenarios": [
    {
      "scenario": "upward_breakout|downward_breakdown",
      "probability": <0-1>,
      "initial_target": <price>,
      "extended_target": <price>,
      "failure_level": <price>,
      "volume_requirement": <multiple_of_average>
    }
  ]
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return res.json({
    symbol,
    breakout_analysis: breakoutAnalysis || {},
    analysis_time: new Date().toISOString()
  });
}

/**
 * Analyze support and resistance levels with AI precision
 */
async function analyzeSupportResistance(req, res) {
  const { symbol, priceData, lookbackPeriod = 50 } = req.body;
  
  const srAnalysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a support/resistance level identification expert. Analyze price action to identify key levels with high precision.'
      },
      {
        role: 'user',
        content: `Identify support and resistance levels for ${symbol}:

Price Data: ${JSON.stringify(priceData.slice(-lookbackPeriod))}
Lookback Period: ${lookbackPeriod} bars

Identify key levels:
{
  "support_levels": [
    {
      "price": <level>,
      "strength": "minor|intermediate|major|critical",
      "test_count": <number>,
      "last_test": "bar index",
      "formation_type": "swing_low|gap|psychological|fibonacci|pivot",
      "reliability": <0-1>,
      "age": "bars since formation",
      "volume_at_formation": <number>
    }
  ],
  "resistance_levels": [
    {
      "price": <level>,
      "strength": "minor|intermediate|major|critical",
      "test_count": <number>,
      "last_test": "bar index",
      "formation_type": "swing_high|gap|psychological|fibonacci|pivot",
      "reliability": <0-1>,
      "age": "bars since formation",
      "volume_at_formation": <number>
    }
  ],
  "level_clusters": [
    {
      "price_zone": [<lower>, <upper>],
      "level_count": <number>,
      "combined_strength": "weak|moderate|strong|very_strong",
      "significance": "high|medium|low"
    }
  ],
  "psychological_levels": [
    {
      "price": <round_number>,
      "type": "round_number|half_dollar|previous_high_low",
      "market_attention": "high|medium|low"
    }
  ],
  "dynamic_levels": {
    "moving_averages": [
      {
        "period": <number>,
        "current_value": <price>,
        "acting_as": "support|resistance|neutral",
        "slope": "rising|falling|flat"
      }
    ],
    "trend_lines": [
      {
        "start_point": <price>,
        "end_point": <price>,
        "slope": <degrees>,
        "touches": <number>,
        "projected_value": <price>
      }
    ]
  },
  "level_interaction_forecast": {
    "next_key_level": <price>,
    "distance_to_level": <percentage>,
    "interaction_probability": <0-1>,
    "expected_reaction": "bounce|break|consolidate"
  }
}`
      }
    ],
    temperature: 0.2,
    max_tokens: 2500
  });

  return res.json({
    symbol,
    support_resistance_analysis: srAnalysis || {},
    lookback_period: lookbackPeriod,
    timestamp: new Date().toISOString()
  });
}

/**
 * Multi-timeframe pattern analysis
 */
async function multiTimeframeAnalysis(req, res) {
  const { symbol, timeframes } = req.body;
  
  if (!timeframes || !Array.isArray(timeframes)) {
    return res.status(400).json({ error: 'Timeframes array required' });
  }
  
  const mtfAnalysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a multi-timeframe analysis expert. Synthesize patterns across different timeframes to provide comprehensive market view.'
      },
      {
        role: 'user',
        content: `Analyze ${symbol} across multiple timeframes:

Timeframes: ${JSON.stringify(timeframes)}

Provide multi-timeframe synthesis:
{
  "timeframe_hierarchy": {
    "primary_trend": {
      "timeframe": "highest timeframe",
      "direction": "up|down|sideways",
      "strength": <0-1>,
      "next_inflection": "estimated bars"
    },
    "intermediate_trend": {
      "timeframe": "medium timeframe", 
      "direction": "up|down|sideways",
      "alignment_with_primary": "aligned|counter|neutral"
    },
    "short_term_trend": {
      "timeframe": "lowest timeframe",
      "direction": "up|down|sideways",
      "tactical_bias": "bullish|bearish|neutral"
    }
  },
  "pattern_confluence": [
    {
      "pattern_type": "pattern name",
      "timeframes": ["tf1", "tf2"],
      "confluence_strength": <0-1>,
      "combined_target": <price>,
      "reliability_multiplier": <number>
    }
  ],
  "level_confluence": [
    {
      "price_level": <price>,
      "supporting_timeframes": ["tf1", "tf2"],
      "level_types": ["support", "fibonacci", "pivot"],
      "confluence_score": <0-1>
    }
  ],
  "timing_analysis": {
    "optimal_entry_timeframe": "timeframe",
    "trend_alignment": "perfect|good|mixed|poor",
    "momentum_alignment": "synchronized|diverging",
    "recommended_holding_period": "timeframe duration"
  },
  "risk_reward_optimization": {
    "best_entry_level": <price>,
    "multi_timeframe_stop": <price>,
    "primary_target": <price>,
    "extended_target": <price>,
    "risk_reward_ratio": <number>
  }
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return res.json({
    symbol,
    multi_timeframe_analysis: mtfAnalysis || {},
    timeframes_analyzed: timeframes,
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper functions
 */

async function callGrokAPI(config) {
  if (!GROK_API_KEY) {
    console.error('Grok API key not configured - pattern recognition unavailable');
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
      console.error('Failed to parse pattern recognition response');
      return null;
    }
  } catch (error) {
    console.error('Grok API call failed:', error);
    return null;
  }
}

function getFromCache(key) {
  const cached = patternCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  return null;
}

function setInCache(key, data) {
  patternCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup old cache entries
  if (patternCache.size > 50) {
    const oldestKey = patternCache.keys().next().value;
    patternCache.delete(oldestKey);
  }
}

/**
 * Real-time pattern monitoring
 */
export async function startPatternMonitoring(symbols, callback) {
  const monitoringInterval = setInterval(async () => {
    for (const symbol of symbols) {
      try {
        // This would get real-time price data
        const priceData = await getCurrentPriceData(symbol);
        const patterns = await analyzeChartPatterns({ body: { symbol, priceData } }, { json: (data) => data });
        
        if (patterns.pattern_analysis?.detected_patterns?.length > 0) {
          callback(symbol, patterns);
        }
      } catch (error) {
        console.error(`Pattern monitoring failed for ${symbol}:`, error);
      }
    }
  }, 300000); // Check every 5 minutes
  
  return () => clearInterval(monitoringInterval);
}

async function getCurrentPriceData(symbol) {
  // This would integrate with your market data provider
  return [];
}