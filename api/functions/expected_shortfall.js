/**
 * Expected Shortfall Function
 * Calculates conditional VaR and expected shortfall (CVaR)
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
      returns, 
      confidence_level = 0.95, 
      method = 'historical',
      portfolio_value = 1000000 
    } = req.body;

    if (!Array.isArray(returns)) {
      return res.status(400).json({ 
        error: 'Invalid input: returns must be an array' 
      });
    }

    if (returns.length < 20) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 20 return observations required for reliable ES calculation' 
      });
    }

    if (confidence_level <= 0 || confidence_level >= 1) {
      return res.status(400).json({ 
        error: 'Invalid input: confidence_level must be between 0 and 1' 
      });
    }

    let expectedShortfall;
    let valueAtRisk;
    let tailStatistics;
    let methodDetails;

    if (method === 'historical') {
      const result = calculateHistoricalES(returns, confidence_level);
      expectedShortfall = result.expected_shortfall;
      valueAtRisk = result.value_at_risk;
      tailStatistics = result.tail_statistics;
      methodDetails = result.method_details;
    } else if (method === 'parametric') {
      const result = calculateParametricES(returns, confidence_level);
      expectedShortfall = result.expected_shortfall;
      valueAtRisk = result.value_at_risk;
      tailStatistics = result.tail_statistics;
      methodDetails = result.method_details;
    } else if (method === 'cornish_fisher') {
      const result = calculateCornishFisherES(returns, confidence_level);
      expectedShortfall = result.expected_shortfall;
      valueAtRisk = result.value_at_risk;
      tailStatistics = result.tail_statistics;
      methodDetails = result.method_details;
    } else {
      return res.status(400).json({ 
        error: 'Invalid method: use "historical", "parametric", or "cornish_fisher"' 
      });
    }

    // Calculate multiple confidence levels for comparison
    const multipleConfidenceLevels = [0.90, 0.95, 0.99, 0.995];
    const esComparison = {};
    
    multipleConfidenceLevels.forEach(cl => {
      if (method === 'historical') {
        const result = calculateHistoricalES(returns, cl);
        esComparison[`es_${Math.round(cl * 100)}`] = {
          expected_shortfall: Number(result.expected_shortfall.toFixed(6)),
          value_at_risk: Number(result.value_at_risk.toFixed(6))
        };
      }
    });

    // Portfolio impact calculations
    const portfolioImpact = {
      es_dollar: Math.abs(expectedShortfall) * portfolio_value,
      var_dollar: Math.abs(valueAtRisk) * portfolio_value,
      excess_loss_beyond_var: Math.abs(expectedShortfall - valueAtRisk) * portfolio_value,
      currency: 'USD'
    };

    // Risk decomposition and analysis
    const riskAnalysis = analyzeRiskProfile(returns, expectedShortfall, valueAtRisk, confidence_level);

    // Backtesting analysis
    const backtestResults = performESBacktest(returns, confidence_level, method);

    // Expected shortfall ratios
    const esRatios = calculateESRatios(returns, expectedShortfall, valueAtRisk);

    // Spectral risk measures
    const spectralRisk = calculateSpectralRiskMeasures(returns, confidence_level);

    // Tail risk analytics
    const tailRiskAnalytics = analyzeTailRisk(returns, confidence_level);

    // Interpretation
    let interpretation;
    const esPercentage = Math.abs(expectedShortfall) * 100;
    if (esPercentage > 10) {
      interpretation = 'Very high tail risk - significant expected losses in worst-case scenarios';
    } else if (esPercentage > 5) {
      interpretation = 'High tail risk - substantial expected losses in tail events';
    } else if (esPercentage > 2) {
      interpretation = 'Moderate tail risk - manageable expected losses in extreme scenarios';
    } else {
      interpretation = 'Low tail risk - minimal expected losses in worst-case scenarios';
    }

    return res.json({
      expected_shortfall: Number(expectedShortfall.toFixed(6)),
      value_at_risk: Number(valueAtRisk.toFixed(6)),
      confidence_level: confidence_level,
      method: method,
      interpretation,
      portfolio_impact: {
        es_dollar: Number(portfolioImpact.es_dollar.toFixed(2)),
        var_dollar: Number(portfolioImpact.var_dollar.toFixed(2)),
        excess_loss_beyond_var: Number(portfolioImpact.excess_loss_beyond_var.toFixed(2)),
        portfolio_value: portfolio_value,
        currency: portfolioImpact.currency
      },
      tail_statistics: tailStatistics,
      method_details: methodDetails,
      es_comparison: esComparison,
      risk_analysis: riskAnalysis,
      backtesting: backtestResults,
      es_ratios: esRatios,
      spectral_risk: spectralRisk,
      tail_risk_analytics: tailRiskAnalytics,
      metadata: {
        function: 'expected_shortfall',
        observations: returns.length,
        method: method,
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

function calculateHistoricalES(returns, confidenceLevel) {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const n = sortedReturns.length;
  const varIndex = Math.floor((1 - confidenceLevel) * n);
  
  const valueAtRisk = sortedReturns[varIndex];
  
  // Expected Shortfall is the average of returns worse than VaR
  const tailLosses = sortedReturns.slice(0, varIndex + 1);
  const expectedShortfall = tailLosses.reduce((sum, loss) => sum + loss, 0) / tailLosses.length;
  
  const tailStatistics = {
    tail_observations: tailLosses.length,
    worst_return: sortedReturns[0],
    tail_average: expectedShortfall,
    tail_volatility: Math.sqrt(
      tailLosses.reduce((sum, loss) => sum + Math.pow(loss - expectedShortfall, 2), 0) / tailLosses.length
    )
  };
  
  return {
    expected_shortfall: expectedShortfall,
    value_at_risk: valueAtRisk,
    tail_statistics: tailStatistics,
    method_details: {
      method: 'historical_simulation',
      sample_size: n,
      tail_size: tailLosses.length,
      empirical_percentile: ((1 - confidenceLevel) * 100).toFixed(1) + '%'
    }
  };
}

function calculateParametricES(returns, confidenceLevel) {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Z-score for given confidence level
  const alpha = 1 - confidenceLevel;
  const zScore = normalInverse(alpha);
  
  const valueAtRisk = mean + zScore * stdDev;
  
  // For normal distribution, ES = mean - stdDev * phi(z) / alpha
  const phi_z = normalPDF(zScore);
  const expectedShortfall = mean - stdDev * phi_z / alpha;
  
  const tailStatistics = {
    theoretical_mean: mean,
    theoretical_std: stdDev,
    z_score: zScore,
    tail_expectation: expectedShortfall
  };
  
  return {
    expected_shortfall: expectedShortfall,
    value_at_risk: valueAtRisk,
    tail_statistics: tailStatistics,
    method_details: {
      method: 'parametric_normal',
      distribution: 'normal',
      parameters: { mean: mean, std_dev: stdDev }
    }
  };
}

function calculateCornishFisherES(returns, confidenceLevel) {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Calculate skewness and kurtosis
  const skewness = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 3), 0) / returns.length;
  const kurtosis = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 4), 0) / returns.length - 3;
  
  const alpha = 1 - confidenceLevel;
  const z = normalInverse(alpha);
  
  // Cornish-Fisher expansion
  const cfAdjustment = (z * z - 1) * skewness / 6 + 
                       (z * z * z - 3 * z) * kurtosis / 24 - 
                       (2 * z * z * z - 5 * z) * skewness * skewness / 36;
  
  const adjustedZ = z + cfAdjustment;
  const valueAtRisk = mean + adjustedZ * stdDev;
  
  // Approximate ES using adjusted distribution
  const phi_z = normalPDF(adjustedZ);
  const expectedShortfall = mean - stdDev * phi_z / alpha;
  
  const tailStatistics = {
    skewness: skewness,
    excess_kurtosis: kurtosis,
    cf_adjustment: cfAdjustment,
    adjusted_z_score: adjustedZ
  };
  
  return {
    expected_shortfall: expectedShortfall,
    value_at_risk: valueAtRisk,
    tail_statistics: tailStatistics,
    method_details: {
      method: 'cornish_fisher',
      higher_moments: { skewness: skewness, kurtosis: kurtosis }
    }
  };
}

function analyzeRiskProfile(returns, es, valueAtRiskParam, confidenceLevel) {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const volatility = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1)
  );
  
  return {
    es_var_ratio: Number((Math.abs(es) / Math.abs(valueAtRiskParam)).toFixed(4)),
    es_volatility_ratio: Number((Math.abs(es) / volatility).toFixed(4)),
    tail_risk_contribution: Number(((Math.abs(es) - Math.abs(valueAtRiskParam)) / Math.abs(es) * 100).toFixed(2)),
    mean_reversion_distance: Number((Math.abs(es - mean) / volatility).toFixed(4))
  };
}

function performESBacktest(returns, confidenceLevel, method) {
  const windowSize = Math.min(250, Math.floor(returns.length / 4)); // Use 1/4 of data for rolling
  const backtestResults = [];
  let violations = 0;
  let sumOfExcesses = 0;
  
  for (let i = windowSize; i < returns.length; i++) {
    const historicalWindow = returns.slice(i - windowSize, i);
    const actualReturn = returns[i];
    
    let predictedES;
    if (method === 'historical') {
      predictedES = calculateHistoricalES(historicalWindow, confidenceLevel).expected_shortfall;
    } else {
      predictedES = calculateParametricES(historicalWindow, confidenceLevel).expected_shortfall;
    }
    
    if (actualReturn < predictedES) {
      violations++;
      sumOfExcesses += Math.abs(actualReturn - predictedES);
    }
  }
  
  const expectedViolations = (returns.length - windowSize) * (1 - confidenceLevel);
  const violationRate = violations / (returns.length - windowSize);
  
  return {
    total_observations: returns.length - windowSize,
    violations: violations,
    expected_violations: Math.round(expectedViolations),
    violation_rate: Number(violationRate.toFixed(4)),
    expected_violation_rate: Number((1 - confidenceLevel).toFixed(4)),
    average_excess: violations > 0 ? Number((sumOfExcesses / violations).toFixed(6)) : 0,
    backtest_pass: Math.abs(violationRate - (1 - confidenceLevel)) < 0.01
  };
}

function calculateESRatios(returns, es, valueAtRiskParam) {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const volatility = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1)
  );
  
  return {
    es_var_spread: Number((Math.abs(es) - Math.abs(valueAtRiskParam)).toFixed(6)),
    es_return_ratio: mean !== 0 ? Number((es / mean).toFixed(4)) : null,
    es_volatility_ratio: Number((Math.abs(es) / volatility).toFixed(4)),
    conditional_tail_expectation: Number((es / valueAtRiskParam).toFixed(4))
  };
}

function calculateSpectralRiskMeasures(returns, confidenceLevel) {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const n = sortedReturns.length;
  const tailSize = Math.floor((1 - confidenceLevel) * n);
  
  // Weighted average with declining weights
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < tailSize; i++) {
    const weight = 1 / (i + 1); // Declining weights
    weightedSum += weight * sortedReturns[i];
    totalWeight += weight;
  }
  
  const spectralRisk = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return {
    spectral_risk_measure: Number(spectralRisk.toFixed(6)),
    weight_function: 'declining',
    tail_size: tailSize
  };
}

function analyzeTailRisk(returns, confidenceLevel) {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const n = sortedReturns.length;
  const tailSize = Math.floor((1 - confidenceLevel) * n);
  const tailReturns = sortedReturns.slice(0, tailSize);
  
  if (tailReturns.length === 0) {
    return { note: 'Insufficient tail observations' };
  }
  
  const tailMean = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
  const tailVar = tailReturns.reduce((sum, r) => sum + Math.pow(r - tailMean, 2), 0) / tailReturns.length;
  
  return {
    tail_mean: Number(tailMean.toFixed(6)),
    tail_variance: Number(tailVar.toFixed(6)),
    tail_skewness: calculateSkewness(tailReturns),
    tail_concentration: Number((tailReturns.length / n).toFixed(4)),
    worst_case_scenario: Number(sortedReturns[0].toFixed(6)),
    tail_diversity: tailReturns.length > 1 ? Number((Math.sqrt(tailVar) / Math.abs(tailMean)).toFixed(4)) : 0
  };
}

function calculateSkewness(data) {
  const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  const skewness = data.reduce((sum, x) => sum + Math.pow((x - mean) / stdDev, 3), 0) / data.length;
  return Number(skewness.toFixed(6));
}

// Helper functions for normal distribution
function normalInverse(p) {
  // Approximation of inverse normal CDF (same as in value_at_risk.js)
  if (p <= 0 || p >= 1) return NaN;
  
  const a0 = 2.50662823884;
  const a1 = -18.61500062529;
  const a2 = 41.39119773534;
  const a3 = -25.44106049637;
  
  const b1 = -8.47351093090;
  const b2 = 23.08336743743;
  const b3 = -21.06224101826;
  const b4 = 3.13082909833;
  
  let y = p - 0.5;
  
  if (Math.abs(y) < 0.42) {
    let r = y * y;
    return y * (((a3 * r + a2) * r + a1) * r + a0) / ((((b4 * r + b3) * r + b2) * r + b1) * r + 1);
  }
  
  let r = p;
  if (y > 0) r = 1 - p;
  r = Math.log(-Math.log(r));
  
  const c0 = 0.3374754822726147;
  const c1 = 0.9761690190917186;
  const c2 = 0.1607979714918209;
  const c3 = 0.0276438810333863;
  const c4 = 0.0038405729373609;
  const c5 = 0.0003951896511919;
  const c6 = 0.0000321767881768;
  const c7 = 0.0000002888167364;
  const c8 = 0.0000003960315187;
  
  let x = c0 + r * (c1 + r * (c2 + r * (c3 + r * (c4 + r * (c5 + r * (c6 + r * (c7 + r * c8)))))));
  
  return y < 0 ? -x : x;
}

function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}