/**
 * Treynor Ratio Function
 * Calculates systematic risk-adjusted returns using beta
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
    const { 
      portfolio_returns, 
      market_returns = null,
      beta = null, 
      risk_free_rate = 0.02 
    } = req.body;

    if (!Array.isArray(portfolio_returns)) {
      return res.status(400).json({ 
        error: 'Invalid input: portfolio_returns must be an array' 
      });
    }

    if (portfolio_returns.length < 5) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 5 return observations required' 
      });
    }

    let calculatedBeta = beta;
    let marketData = null;

    // Calculate beta if market returns provided and beta not given
    if (!beta && Array.isArray(market_returns)) {
      if (market_returns.length !== portfolio_returns.length) {
        return res.status(400).json({ 
          error: 'Invalid input: portfolio_returns and market_returns must have same length' 
        });
      }
      
      const betaResult = calculateBeta(portfolio_returns, market_returns, risk_free_rate);
      calculatedBeta = betaResult.beta;
      marketData = betaResult;
    } else if (!beta) {
      return res.status(400).json({ 
        error: 'Invalid input: either beta or market_returns must be provided' 
      });
    }

    if (calculatedBeta === 0) {
      return res.status(400).json({ 
        error: 'Invalid input: beta cannot be zero for Treynor ratio calculation' 
      });
    }

    // Calculate portfolio statistics
    const annualRiskFreeRate = risk_free_rate;
    const periodicRiskFreeRate = annualRiskFreeRate / 252; // Assuming daily returns
    
    const excessReturns = portfolio_returns.map(r => r - periodicRiskFreeRate);
    const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    
    // Calculate Treynor ratio
    const treynorRatio = meanExcessReturn / calculatedBeta;
    
    // Annualized values
    const annualizedExcessReturn = meanExcessReturn * 252;
    const annualizedTreynorRatio = annualizedExcessReturn / calculatedBeta;
    
    // Additional portfolio metrics
    const portfolioVolatility = Math.sqrt(
      excessReturns.reduce((sum, r) => sum + Math.pow(r - meanExcessReturn, 2), 0) / 
      (excessReturns.length - 1)
    );
    const annualizedVolatility = portfolioVolatility * Math.sqrt(252);
    
    // Sharpe ratio for comparison
    const sharpeRatio = meanExcessReturn / portfolioVolatility;
    const annualizedSharpeRatio = annualizedExcessReturn / annualizedVolatility;

    // Systematic vs unsystematic risk
    const systematicRisk = Math.abs(calculatedBeta) * (marketData?.market_volatility || annualizedVolatility);
    const totalRisk = annualizedVolatility;
    const unsystematicRisk = Math.sqrt(Math.max(0, totalRisk * totalRisk - systematicRisk * systematicRisk));
    const rsquared = marketData?.r_squared || null;

    // Risk decomposition
    const riskDecomposition = {
      total_risk: Number(totalRisk.toFixed(6)),
      systematic_risk: Number(systematicRisk.toFixed(6)),
      unsystematic_risk: Number(unsystematicRisk.toFixed(6)),
      systematic_risk_percentage: Number((systematicRisk / totalRisk * 100).toFixed(2)),
      r_squared: rsquared ? Number(rsquared.toFixed(4)) : null
    };

    // Interpretation
    let interpretation;
    if (treynorRatio > 0.15) {
      interpretation = 'Excellent - high systematic risk-adjusted returns';
    } else if (treynorRatio > 0.08) {
      interpretation = 'Good - positive systematic risk-adjusted returns';
    } else if (treynorRatio > 0) {
      interpretation = 'Fair - positive but low systematic risk-adjusted returns';
    } else {
      interpretation = 'Poor - negative systematic risk-adjusted returns';
    }

    // Beta interpretation
    let betaInterpretation;
    if (Math.abs(calculatedBeta) > 1.5) {
      betaInterpretation = calculatedBeta > 0 ? 'Very high market sensitivity' : 'Very high inverse market sensitivity';
    } else if (Math.abs(calculatedBeta) > 1.0) {
      betaInterpretation = calculatedBeta > 0 ? 'High market sensitivity' : 'High inverse market sensitivity';
    } else if (Math.abs(calculatedBeta) > 0.5) {
      betaInterpretation = calculatedBeta > 0 ? 'Moderate market sensitivity' : 'Moderate inverse market sensitivity';
    } else {
      betaInterpretation = 'Low market sensitivity';
    }

    return res.json({
      treynor_ratio: Number(treynorRatio.toFixed(6)),
      beta: Number(calculatedBeta.toFixed(4)),
      mean_excess_return: Number(meanExcessReturn.toFixed(6)),
      interpretation,
      beta_interpretation: betaInterpretation,
      annualized: {
        treynor_ratio: Number(annualizedTreynorRatio.toFixed(6)),
        excess_return: Number(annualizedExcessReturn.toFixed(6)),
        portfolio_volatility: Number(annualizedVolatility.toFixed(6))
      },
      risk_decomposition: riskDecomposition,
      comparison_metrics: {
        sharpe_ratio: Number(sharpeRatio.toFixed(6)),
        annualized_sharpe_ratio: Number(annualizedSharpeRatio.toFixed(6)),
        treynor_vs_sharpe: Number((treynorRatio / sharpeRatio).toFixed(4))
      },
      market_analysis: marketData || {
        note: 'Beta provided directly - no market analysis available'
      },
      metadata: {
        function: 'treynor_ratio',
        observations: portfolio_returns.length,
        risk_free_rate: risk_free_rate,
        beta_calculated: beta === null,
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

function calculateBeta(portfolioReturns, marketReturns, riskFreeRate) {
  const periodicRiskFreeRate = riskFreeRate / 252;
  
  // Calculate excess returns
  const portfolioExcess = portfolioReturns.map(r => r - periodicRiskFreeRate);
  const marketExcess = marketReturns.map(r => r - periodicRiskFreeRate);
  
  // Calculate means
  const portfolioMean = portfolioExcess.reduce((sum, r) => sum + r, 0) / portfolioExcess.length;
  const marketMean = marketExcess.reduce((sum, r) => sum + r, 0) / marketExcess.length;
  
  // Calculate covariance and market variance
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < portfolioExcess.length; i++) {
    const portfolioDev = portfolioExcess[i] - portfolioMean;
    const marketDev = marketExcess[i] - marketMean;
    
    covariance += portfolioDev * marketDev;
    marketVariance += marketDev * marketDev;
  }
  
  covariance /= (portfolioExcess.length - 1);
  marketVariance /= (marketExcess.length - 1);
  
  const beta = marketVariance === 0 ? 0 : covariance / marketVariance;
  
  // Calculate alpha and R-squared
  const alpha = portfolioMean - beta * marketMean;
  
  // Calculate R-squared
  const portfolioVariance = portfolioExcess.reduce((sum, r) => sum + Math.pow(r - portfolioMean, 2), 0) / (portfolioExcess.length - 1);
  const explainedVariance = beta * beta * marketVariance;
  const rSquared = portfolioVariance === 0 ? 0 : explainedVariance / portfolioVariance;
  
  return {
    beta: beta,
    alpha: alpha,
    r_squared: rSquared,
    market_volatility: Math.sqrt(marketVariance * 252),
    portfolio_volatility: Math.sqrt(portfolioVariance * 252),
    correlation: Math.sqrt(rSquared) * Math.sign(beta)
  };
}