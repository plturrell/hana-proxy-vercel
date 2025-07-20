/**
 * Sortino Ratio Function
 * Measures downside risk-adjusted returns
 */

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
    const { returns, target_return = 0, risk_free_rate = 0.02 } = req.body;

    if (!Array.isArray(returns)) {
      return res.status(400).json({ 
        error: 'Invalid input: returns must be an array' 
      });
    }

    if (returns.length < 5) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 5 return observations required' 
      });
    }

    // Calculate excess returns
    const annualRiskFreeRate = risk_free_rate;
    const periodicRiskFreeRate = annualRiskFreeRate / 252; // Assuming daily returns
    const excessReturns = returns.map(r => r - periodicRiskFreeRate);
    
    // Calculate mean excess return
    const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    
    // Calculate downside deviations (below target)
    const downsideReturns = excessReturns.filter(r => r < target_return);
    
    if (downsideReturns.length === 0) {
      return res.json({
        sortino_ratio: Infinity,
        mean_return: Number(meanExcessReturn.toFixed(6)),
        downside_deviation: 0,
        target_return: target_return,
        interpretation: 'No downside risk - all returns above target',
        annualized: {
          sortino_ratio: Infinity,
          mean_return: Number((meanExcessReturn * 252).toFixed(6)),
          downside_deviation: 0
        },
        metadata: {
          function: 'sortino_ratio',
          observations: returns.length,
          downside_observations: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Calculate downside deviation
    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - target_return, 2), 0) / returns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    // Calculate Sortino ratio
    const sortinoRatio = downsideDeviation === 0 ? Infinity : (meanExcessReturn - target_return) / downsideDeviation;
    
    // Annualized values
    const annualizedReturn = meanExcessReturn * 252;
    const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(252);
    const annualizedSortinoRatio = annualizedDownsideDeviation === 0 ? Infinity : (annualizedReturn - target_return * 252) / annualizedDownsideDeviation;
    
    // Calculate additional metrics
    const upsideReturns = excessReturns.filter(r => r > target_return);
    const upsideDeviation = upsideReturns.length > 0 ? 
      Math.sqrt(upsideReturns.reduce((sum, r) => sum + Math.pow(r - target_return, 2), 0) / returns.length) : 0;
    
    // Interpretation
    let interpretation;
    if (sortinoRatio > 2.0) {
      interpretation = 'Excellent - very high risk-adjusted returns with low downside risk';
    } else if (sortinoRatio > 1.0) {
      interpretation = 'Good - positive risk-adjusted returns with manageable downside';
    } else if (sortinoRatio > 0) {
      interpretation = 'Fair - positive returns but significant downside risk';
    } else {
      interpretation = 'Poor - negative risk-adjusted returns';
    }

    return res.json({
      sortino_ratio: Number(sortinoRatio.toFixed(6)),
      mean_return: Number(meanExcessReturn.toFixed(6)),
      downside_deviation: Number(downsideDeviation.toFixed(6)),
      upside_deviation: Number(upsideDeviation.toFixed(6)),
      target_return: target_return,
      interpretation,
      annualized: {
        sortino_ratio: Number(annualizedSortinoRatio.toFixed(6)),
        mean_return: Number(annualizedReturn.toFixed(6)),
        downside_deviation: Number(annualizedDownsideDeviation.toFixed(6))
      },
      risk_metrics: {
        downside_frequency: Number((downsideReturns.length / returns.length).toFixed(4)),
        upside_frequency: Number((upsideReturns.length / returns.length).toFixed(4)),
        worst_return: Number(Math.min(...returns).toFixed(6)),
        best_return: Number(Math.max(...returns).toFixed(6))
      },
      metadata: {
        function: 'sortino_ratio',
        observations: returns.length,
        downside_observations: downsideReturns.length,
        upside_observations: upsideReturns.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Calculation failed',
      details: error.message
    });
  }
}