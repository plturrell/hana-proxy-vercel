/**
 * AI-Enhanced Value at Risk Function
 * Computational utility with AI-powered risk analysis enhancement
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      returns, 
      confidence_level = 0.95, 
      method = 'historical',
      portfolio_data,
      market_context,
      use_ai_enhancement = true
    } = req.body;

    if (!Array.isArray(returns)) {
      return res.status(400).json({ 
        error: 'Invalid input: returns must be an array' 
      });
    }

    if (returns.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 10 return observations required' 
      });
    }

    if (confidence_level <= 0 || confidence_level >= 1) {
      return res.status(400).json({ 
        error: 'Invalid input: confidence_level must be between 0 and 1' 
      });
    }

    let var_result;
    let expected_shortfall;

    if (method === 'historical') {
      // Historical simulation method
      const sorted_returns = [...returns].sort((a, b) => a - b);
      const var_index = Math.floor((1 - confidence_level) * returns.length);
      var_result = sorted_returns[var_index];
      
      // Expected Shortfall (CVaR) - average of losses beyond VaR
      const tail_losses = sorted_returns.slice(0, var_index + 1);
      expected_shortfall = tail_losses.reduce((a, b) => a + b, 0) / tail_losses.length;
      
    } else if (method === 'parametric') {
      // Parametric method (assumes normal distribution)
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
      const std_dev = Math.sqrt(variance);
      
      // Z-score for given confidence level
      const z_score = normalInverse(1 - confidence_level);
      var_result = mean + z_score * std_dev;
      
      // Expected Shortfall for normal distribution
      const phi_z = normalPDF(z_score);
      expected_shortfall = mean - std_dev * phi_z / (1 - confidence_level);
      
    } else {
      return res.status(400).json({ 
        error: 'Invalid method: use "historical" or "parametric"' 
      });
    }

    // Portfolio value impact (assuming $1M portfolio)
    const portfolio_value = 1000000;
    const var_dollar = Math.abs(var_result) * portfolio_value;
    const es_dollar = Math.abs(expected_shortfall) * portfolio_value;

    // Interpretation
    let interpretation;
    if (Math.abs(var_result) > 0.05) {
      interpretation = 'High risk - significant potential losses';
    } else if (Math.abs(var_result) > 0.02) {
      interpretation = 'Moderate risk - manageable potential losses';
    } else {
      interpretation = 'Low risk - minimal potential losses';
    }

    // Enhance with AI analysis if requested
    let aiEnhancement = null;
    if (use_ai_enhancement && GROK_API_KEY) {
      aiEnhancement = await enhanceVaRWithAI(returns, confidence_level, portfolio_data, market_context, var_result, expected_shortfall);
    }

    const result = {
      var: Number(var_result.toFixed(6)),
      expected_shortfall: Number(expected_shortfall.toFixed(6)),
      confidence_level: confidence_level,
      method: method,
      interpretation,
      portfolio_impact: {
        var_dollar: Number(var_dollar.toFixed(2)),
        es_dollar: Number(es_dollar.toFixed(2)),
        currency: 'USD'
      },
      metadata: {
        n: returns.length,
        function: 'value_at_risk',
        timestamp: new Date().toISOString(),
        ai_enhanced: !!aiEnhancement
      },
      ...(aiEnhancement && { ai_analysis: aiEnhancement })
    };

    // Store result in Supabase
    if (supabase) {
      await supabase
        .from('prdord_analytics')
        .insert({
          function_name: 'value_at_risk',
          input_parameters: { returns: returns.length, confidence_level, method, portfolio_data, market_context },
          result: result,
          created_at: new Date().toISOString()
        });
    }

    return res.json(result);

  } catch (error) {
    return res.status(500).json({
      error: 'Calculation failed',
      details: error.message
    });
  }
}

/**
 * Enhance VaR calculation with AI analysis
 */
async function enhanceVaRWithAI(returns, confidence_level, portfolioData, marketContext, varResult, expectedShortfall) {
  if (!GROK_API_KEY) {
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
        model: 'grok-4-0709',
        messages: [
          {
            role: 'system',
            content: `You are an advanced quantitative risk analyst AI specializing in Value at Risk enhancement. You understand:
- Regime-dependent risk modeling and fat-tail distributions
- Dynamic correlation modeling and stress testing
- Market microstructure impacts on portfolio risk
- Forward-looking risk adjustments and scenario analysis`
          },
          {
            role: 'user',
            content: `Enhance this VaR analysis with advanced insights:

Returns Statistics: 
- Sample size: ${returns.length}
- Calculated VaR (${confidence_level * 100}%): ${varResult}
- Expected Shortfall: ${expectedShortfall}
- Mean return: ${(returns.reduce((a, b) => a + b, 0) / returns.length).toFixed(6)}
- Volatility: ${Math.sqrt(returns.reduce((sum, r, _, arr) => sum + Math.pow(r - arr.reduce((a, b) => a + b, 0) / arr.length, 2), 0) / (returns.length - 1)).toFixed(6)}

Portfolio Context: ${JSON.stringify(portfolioData)}
Market Context: ${JSON.stringify(marketContext)}

Provide enhanced risk analysis:
{
  "regime_analysis": {
    "current_regime": "low_vol|normal|high_vol|crisis",
    "regime_stability": <0-1>,
    "regime_adjusted_var": <number>,
    "volatility_clustering": "detected|not_detected"
  },
  "tail_risk_assessment": {
    "fat_tail_indicator": <number>,
    "extreme_loss_probability": <0-1>,
    "tail_dependency": "high|medium|low",
    "black_swan_vulnerability": <0-1>
  },
  "model_limitations": {
    "distribution_assumptions": ["assumption1", "assumption2"],
    "structural_breaks": "detected|not_detected",
    "model_confidence": <0-1>,
    "back_testing_accuracy": <0-1>
  },
  "stress_scenarios": [
    {
      "scenario": "market_crash|volatility_spike|correlation_breakdown",
      "var_impact": <number>,
      "probability": <0-1>,
      "description": "scenario description"
    }
  ],
  "risk_warnings": [
    {
      "warning": "specific risk concern",
      "severity": "low|medium|high|critical",
      "recommended_action": "action to take"
    }
  ],
  "dynamic_adjustments": {
    "volatility_forecast": <number>,
    "trend_adjustment": <number>,
    "correlation_adjustment": <number>,
    "adjusted_var": <number>
  },
  "portfolio_recommendations": [
    {
      "recommendation": "specific recommendation",
      "impact": "expected impact on risk",
      "urgency": "low|medium|high"
    }
  ]
}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('AI VaR enhancement failed:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch {
      console.error('Failed to parse AI VaR enhancement response');
      return null;
    }
  } catch (error) {
    console.error('AI VaR enhancement error:', error);
    return null;
  }
}

// Helper functions for parametric VaR
function normalInverse(p) {
  // Approximation of inverse normal CDF
  if (p <= 0 || p >= 1) return NaN;
  
  // Beasley-Springer-Moro algorithm
  const a0 = 2.50662823884;
  const a1 = -18.61500062529;
  const a2 = 41.39119773534;
  const a3 = -25.44106049637;
  
  const b1 = -8.47351093090;
  const b2 = 23.08336743743;
  const b3 = -21.06224101826;
  const b4 = 3.13082909833;
  
  const c0 = 0.3374754822726147;
  const c1 = 0.9761690190917186;
  const c2 = 0.1607979714918209;
  const c3 = 0.0276438810333863;
  const c4 = 0.0038405729373609;
  const c5 = 0.0003951896511919;
  const c6 = 0.0000321767881768;
  const c7 = 0.0000002888167364;
  const c8 = 0.0000003960315187;
  
  let y = p - 0.5;
  
  if (Math.abs(y) < 0.42) {
    let r = y * y;
    return y * (((a3 * r + a2) * r + a1) * r + a0) / ((((b4 * r + b3) * r + b2) * r + b1) * r + 1);
  }
  
  let r = p;
  if (y > 0) r = 1 - p;
  r = Math.log(-Math.log(r));
  
  let x = c0 + r * (c1 + r * (c2 + r * (c3 + r * (c4 + r * (c5 + r * (c6 + r * (c7 + r * c8)))))));
  
  return y < 0 ? -x : x;
}

function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}