// Risk Assessment API - Real Production Endpoint
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { portfolioId } = req.body;
    
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    // Get portfolio data from database
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (error || !portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Get historical performance data
    const { data: performance } = await supabase
      .from('portfolio_performance')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('date', { ascending: false })
      .limit(252); // ~1 year of trading days

    // Calculate risk metrics
    const riskAssessment = calculateRiskMetrics(portfolio, performance);

    // Store risk assessment
    await supabase
      .from('risk_assessments')
      .insert({
        portfolio_id: portfolioId,
        assessment: riskAssessment,
        created_at: new Date().toISOString()
      });

    return res.json(riskAssessment);

  } catch (error) {
    console.error('Risk assessment error:', error);
    return res.status(500).json({
      error: 'Risk assessment failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
}

function calculateRiskMetrics(portfolio, performance) {
  if (!performance || performance.length === 0) {
    // Return default risk assessment when no performance data
    return {
      overall_risk: 'Medium',
      risk_score: 6.5,
      volatility: 'Moderate',
      max_drawdown: 'Unknown',
      sharpe_ratio: 'N/A',
      beta: 'N/A',
      value_at_risk: 'N/A',
      recommendations: [
        'Insufficient historical data for comprehensive risk analysis',
        'Consider diversifying across multiple asset classes',
        'Implement stop-loss orders to limit downside risk',
        'Regular portfolio rebalancing recommended'
      ],
      risk_factors: [
        { factor: 'Market Risk', level: 'Medium', impact: 'Moderate' },
        { factor: 'Concentration Risk', level: 'Unknown', impact: 'Unknown' },
        { factor: 'Liquidity Risk', level: 'Low', impact: 'Low' }
      ],
      timestamp: new Date().toISOString()
    };
  }

  // Calculate returns
  const returns = [];
  for (let i = 1; i < performance.length; i++) {
    const currentValue = performance[i - 1].total_value;
    const previousValue = performance[i].total_value;
    if (previousValue > 0) {
      returns.push((currentValue - previousValue) / previousValue);
    }
  }

  if (returns.length === 0) {
    return {
      overall_risk: 'Unknown',
      risk_score: 5.0,
      error: 'Insufficient return data'
    };
  }

  // Calculate volatility (standard deviation of returns)
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

  // Calculate maximum drawdown
  let maxDrawdown = 0;
  let peak = performance[0].total_value;
  
  for (const p of performance) {
    if (p.total_value > peak) {
      peak = p.total_value;
    }
    const drawdown = (peak - p.total_value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Calculate Sharpe ratio (assuming 2% risk-free rate)
  const riskFreeRate = 0.02;
  const excessReturn = avgReturn * 252 - riskFreeRate;
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

  // Risk scoring (1-10 scale)
  let riskScore = Math.min(10, Math.max(1, 
    (volatility * 20) + (maxDrawdown * 10) + (sharpeRatio < 0 ? 2 : 0)
  ));

  // Risk level determination
  let riskLevel = 'Low';
  if (riskScore > 7) riskLevel = 'High';
  else if (riskScore > 4) riskLevel = 'Medium';

  return {
    overall_risk: riskLevel,
    risk_score: Math.round(riskScore * 10) / 10,
    volatility: `${(volatility * 100).toFixed(1)}%`,
    max_drawdown: `${(maxDrawdown * 100).toFixed(1)}%`,
    sharpe_ratio: sharpeRatio.toFixed(2),
    beta: calculateBeta(returns),
    value_at_risk: `${(calculateVaR(returns) * 100).toFixed(1)}%`,
    recommendations: generateRecommendations(riskScore, volatility, maxDrawdown, sharpeRatio),
    risk_factors: [
      { 
        factor: 'Market Risk', 
        level: volatility > 0.25 ? 'High' : volatility > 0.15 ? 'Medium' : 'Low',
        impact: volatility > 0.25 ? 'High' : 'Moderate'
      },
      { 
        factor: 'Drawdown Risk', 
        level: maxDrawdown > 0.20 ? 'High' : maxDrawdown > 0.10 ? 'Medium' : 'Low',
        impact: maxDrawdown > 0.15 ? 'High' : 'Moderate'
      },
      { 
        factor: 'Performance Risk', 
        level: sharpeRatio < 0 ? 'High' : sharpeRatio < 0.5 ? 'Medium' : 'Low',
        impact: sharpeRatio < 0 ? 'High' : 'Low'
      }
    ],
    timestamp: new Date().toISOString()
  };
}

function calculateBeta(returns) {
  // Simplified beta calculation (would need market index data for accuracy)
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  
  // Approximate beta based on volatility (market volatility ~15%)
  const marketVolatility = 0.15 / Math.sqrt(252);
  return (volatility / marketVolatility).toFixed(2);
}

function calculateVaR(returns, confidence = 0.05) {
  // Value at Risk at 95% confidence level
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor(confidence * sortedReturns.length);
  return Math.abs(sortedReturns[index] || 0);
}

function generateRecommendations(riskScore, volatility, maxDrawdown, sharpeRatio) {
  const recommendations = [];

  if (riskScore > 7) {
    recommendations.push('Portfolio shows high risk - consider reducing position sizes');
    recommendations.push('Implement strict stop-loss orders to limit downside exposure');
  }

  if (volatility > 0.25) {
    recommendations.push('High volatility detected - diversification across uncorrelated assets recommended');
    recommendations.push('Consider adding defensive assets like bonds or utilities');
  }

  if (maxDrawdown > 0.15) {
    recommendations.push('Significant drawdowns observed - review position sizing strategy');
    recommendations.push('Consider implementing systematic rebalancing rules');
  }

  if (sharpeRatio < 0.5) {
    recommendations.push('Risk-adjusted returns could be improved');
    recommendations.push('Evaluate if current risk level is justified by expected returns');
  }

  if (recommendations.length === 0) {
    recommendations.push('Portfolio shows reasonable risk characteristics');
    recommendations.push('Continue monitoring performance and maintain diversification');
  }

  return recommendations;
}