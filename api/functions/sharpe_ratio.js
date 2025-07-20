/**
 * Sharpe Ratio Function
 * Computational utility - not an A2A agent
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
    const { returns, risk_free_rate = 0.02 } = req.body;

    if (!Array.isArray(returns)) {
      return res.status(400).json({ 
        error: 'Invalid input: returns must be an array' 
      });
    }

    if (returns.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 2 return observations required' 
      });
    }

    // Calculate mean return
    const mean_return = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Calculate standard deviation
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean_return, 2), 0) / (returns.length - 1);
    const std_dev = Math.sqrt(variance);

    if (std_dev === 0) {
      return res.json({
        sharpe_ratio: null,
        excess_return: mean_return - risk_free_rate,
        volatility: 0,
        interpretation: 'Undefined (zero volatility)',
        metadata: {
          n: returns.length,
          function: 'sharpe_ratio',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Calculate Sharpe ratio
    const excess_return = mean_return - risk_free_rate;
    const sharpe_ratio = excess_return / std_dev;

    // Interpretation
    let interpretation;
    if (sharpe_ratio > 1.0) {
      interpretation = 'Excellent risk-adjusted performance';
    } else if (sharpe_ratio > 0.5) {
      interpretation = 'Good risk-adjusted performance';
    } else if (sharpe_ratio > 0) {
      interpretation = 'Positive but modest risk-adjusted performance';
    } else {
      interpretation = 'Poor risk-adjusted performance';
    }

    // Annualized values (assuming daily returns)
    const annualized_return = mean_return * 252;
    const annualized_volatility = std_dev * Math.sqrt(252);
    const annualized_sharpe = sharpe_ratio * Math.sqrt(252);

    return res.json({
      sharpe_ratio: Number(sharpe_ratio.toFixed(6)),
      excess_return: Number(excess_return.toFixed(6)),
      volatility: Number(std_dev.toFixed(6)),
      interpretation,
      annualized: {
        return: Number(annualized_return.toFixed(6)),
        volatility: Number(annualized_volatility.toFixed(6)),
        sharpe_ratio: Number(annualized_sharpe.toFixed(6))
      },
      metadata: {
        n: returns.length,
        risk_free_rate: risk_free_rate,
        function: 'sharpe_ratio',
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