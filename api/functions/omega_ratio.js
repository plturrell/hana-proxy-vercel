/**
 * Omega Ratio Function
 * Calculates probability-weighted risk-return ratio
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
      threshold = 0, 
      risk_free_rate = 0.02,
      confidence_levels = [0.95, 0.99]
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

    // Convert annual risk-free rate to periodic
    const periodicRiskFreeRate = risk_free_rate / 252; // Assuming daily returns
    const adjustedThreshold = threshold || periodicRiskFreeRate;

    // Separate returns above and below threshold
    const gainsAboveThreshold = returns.filter(r => r > adjustedThreshold).map(r => r - adjustedThreshold);
    const lossesBelowThreshold = returns.filter(r => r <= adjustedThreshold).map(r => adjustedThreshold - r);

    // Calculate expected values
    const expectedGain = gainsAboveThreshold.length > 0 ? 
      gainsAboveThreshold.reduce((sum, gain) => sum + gain, 0) / returns.length : 0;
    
    const expectedLoss = lossesBelowThreshold.length > 0 ? 
      lossesBelowThreshold.reduce((sum, loss) => sum + loss, 0) / returns.length : 0;

    // Calculate Omega ratio
    const omegaRatio = expectedLoss === 0 ? 
      (expectedGain > 0 ? Infinity : 1) : 
      expectedGain / expectedLoss;

    // Calculate probabilities
    const probabilityOfGain = gainsAboveThreshold.length / returns.length;
    const probabilityOfLoss = lossesBelowThreshold.length / returns.length;

    // Average gain and loss when they occur
    const avgGainWhenGain = gainsAboveThreshold.length > 0 ? 
      gainsAboveThreshold.reduce((sum, gain) => sum + gain, 0) / gainsAboveThreshold.length : 0;
    
    const avgLossWhenLoss = lossesBelowThreshold.length > 0 ? 
      lossesBelowThreshold.reduce((sum, loss) => sum + loss, 0) / lossesBelowThreshold.length : 0;

    // Calculate cumulative distribution analysis
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cumulativeDistribution = calculateCumulativeDistribution(sortedReturns, adjustedThreshold);

    // Calculate Omega ratios for different thresholds
    const omegaCurve = calculateOmegaCurve(returns, adjustedThreshold);

    // Risk-return decomposition
    const riskReturnDecomposition = {
      upside_potential: expectedGain,
      downside_risk: expectedLoss,
      upside_probability: probabilityOfGain,
      downside_probability: probabilityOfLoss,
      gain_loss_ratio: avgLossWhenLoss === 0 ? Infinity : avgGainWhenGain / avgLossWhenLoss
    };

    // Compare with other risk measures
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)
    );
    const sharpeRatio = volatility === 0 ? Infinity : (meanReturn - periodicRiskFreeRate) / volatility;

    // Sortino ratio (downside deviation)
    const downsideReturns = returns.filter(r => r < adjustedThreshold);
    const downsideDeviation = downsideReturns.length > 0 ? 
      Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r - adjustedThreshold, 2), 0) / returns.length) : 0;
    const sortinoRatio = downsideDeviation === 0 ? Infinity : (meanReturn - adjustedThreshold) / downsideDeviation;

    // Value at Risk analysis for comparison
    const varAnalysis = calculateVaRForOmega(sortedReturns, confidence_levels);

    // Kappa ratios (higher moment risk measures)
    const kappaRatios = calculateKappaRatios(returns, adjustedThreshold);

    // Omega ratio stability analysis
    const rollingOmegas = calculateRollingOmega(returns, adjustedThreshold, 60); // 60-period rolling
    const omegaStability = assessOmegaStability(rollingOmegas);

    // Interpretation
    let interpretation;
    if (omegaRatio > 2.0) {
      interpretation = 'Excellent - very high probability-weighted returns above threshold';
    } else if (omegaRatio > 1.5) {
      interpretation = 'Good - solid probability-weighted outperformance';
    } else if (omegaRatio > 1.0) {
      interpretation = 'Moderate - positive probability-weighted returns';
    } else if (omegaRatio > 0.8) {
      interpretation = 'Fair - slightly negative probability-weighted returns';
    } else {
      interpretation = 'Poor - significant probability-weighted underperformance';
    }

    return res.json({
      omega_ratio: Number(omegaRatio.toFixed(6)),
      threshold: Number(adjustedThreshold.toFixed(6)),
      interpretation,
      probability_analysis: {
        probability_of_gain: Number(probabilityOfGain.toFixed(4)),
        probability_of_loss: Number(probabilityOfLoss.toFixed(4)),
        expected_gain: Number(expectedGain.toFixed(6)),
        expected_loss: Number(expectedLoss.toFixed(6)),
        avg_gain_when_gain: Number(avgGainWhenGain.toFixed(6)),
        avg_loss_when_loss: Number(avgLossWhenLoss.toFixed(6))
      },
      risk_return_decomposition: {
        upside_potential: Number(riskReturnDecomposition.upside_potential.toFixed(6)),
        downside_risk: Number(riskReturnDecomposition.downside_risk.toFixed(6)),
        upside_probability: Number(riskReturnDecomposition.upside_probability.toFixed(4)),
        downside_probability: Number(riskReturnDecomposition.downside_probability.toFixed(4)),
        gain_loss_ratio: Number(riskReturnDecomposition.gain_loss_ratio.toFixed(4))
      },
      cumulative_distribution: cumulativeDistribution,
      omega_curve: omegaCurve.slice(0, 10), // First 10 points of curve
      comparison_metrics: {
        sharpe_ratio: Number(sharpeRatio.toFixed(6)),
        sortino_ratio: Number(sortinoRatio.toFixed(6)),
        omega_vs_sharpe: Number((omegaRatio / sharpeRatio).toFixed(4)),
        omega_vs_sortino: Number((omegaRatio / sortinoRatio).toFixed(4))
      },
      var_analysis: varAnalysis,
      kappa_ratios: kappaRatios,
      stability_analysis: {
        rolling_omega_ratios: rollingOmegas.slice(-12), // Last 12 periods
        stability_assessment: omegaStability,
        min_rolling_omega: rollingOmegas.length > 0 ? Math.min(...rollingOmegas) : null,
        max_rolling_omega: rollingOmegas.length > 0 ? Math.max(...rollingOmegas) : null
      },
      annualized_metrics: {
        omega_ratio: Number(omegaRatio.toFixed(6)), // Omega is already ratio-based
        expected_gain_annualized: Number((expectedGain * 252).toFixed(6)),
        expected_loss_annualized: Number((expectedLoss * 252).toFixed(6))
      },
      metadata: {
        function: 'omega_ratio',
        observations: returns.length,
        gains_above_threshold: gainsAboveThreshold.length,
        losses_below_threshold: lossesBelowThreshold.length,
        threshold_type: threshold === 0 ? 'zero' : 'custom',
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

function calculateCumulativeDistribution(sortedReturns, threshold) {
  const thresholdIndex = sortedReturns.findIndex(r => r > threshold);
  const belowThreshold = thresholdIndex === -1 ? sortedReturns.length : thresholdIndex;
  const aboveThreshold = sortedReturns.length - belowThreshold;
  
  return {
    returns_below_threshold: belowThreshold,
    returns_above_threshold: aboveThreshold,
    percentile_of_threshold: Number((belowThreshold / sortedReturns.length * 100).toFixed(2)),
    worst_return: Number(sortedReturns[0].toFixed(6)),
    best_return: Number(sortedReturns[sortedReturns.length - 1].toFixed(6))
  };
}

function calculateOmegaCurve(returns, baseThreshold) {
  const curve = [];
  const minReturn = Math.min(...returns);
  const maxReturn = Math.max(...returns);
  const step = (maxReturn - minReturn) / 20;
  
  for (let i = 0; i < 20; i++) {
    const threshold = minReturn + i * step;
    const gains = returns.filter(r => r > threshold).map(r => r - threshold);
    const losses = returns.filter(r => r <= threshold).map(r => threshold - r);
    
    const expectedGain = gains.length > 0 ? gains.reduce((sum, g) => sum + g, 0) / returns.length : 0;
    const expectedLoss = losses.length > 0 ? losses.reduce((sum, l) => sum + l, 0) / returns.length : 0;
    
    const omega = expectedLoss === 0 ? (expectedGain > 0 ? 100 : 1) : expectedGain / expectedLoss;
    
    curve.push({
      threshold: Number(threshold.toFixed(6)),
      omega_ratio: Number(omega.toFixed(6))
    });
  }
  
  return curve;
}

function calculateVaRForOmega(sortedReturns, confidenceLevels) {
  const varResults = {};
  
  confidenceLevels.forEach(cl => {
    const index = Math.floor((1 - cl) * sortedReturns.length);
    const varValue = sortedReturns[index];
    
    varResults[`var_${Math.round(cl * 100)}`] = {
      value: Number(varValue.toFixed(6)),
      percentile: Number(((1 - cl) * 100).toFixed(1))
    };
  });
  
  return varResults;
}

function calculateKappaRatios(returns, threshold) {
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const excessReturn = meanReturn - threshold;
  
  // Kappa 3 (using 3rd moment - skewness)
  const downsideDeviations = returns.filter(r => r < threshold).map(r => threshold - r);
  
  const kappa3Denominator = downsideDeviations.length > 0 ?
    Math.pow(downsideDeviations.reduce((sum, d) => sum + Math.pow(d, 3), 0) / returns.length, 1/3) : 0;
  
  const kappa3 = kappa3Denominator === 0 ? Infinity : excessReturn / kappa3Denominator;
  
  // Kappa 4 (using 4th moment - kurtosis)
  const kappa4Denominator = downsideDeviations.length > 0 ?
    Math.pow(downsideDeviations.reduce((sum, d) => sum + Math.pow(d, 4), 0) / returns.length, 1/4) : 0;
  
  const kappa4 = kappa4Denominator === 0 ? Infinity : excessReturn / kappa4Denominator;
  
  return {
    kappa_3: Number(kappa3.toFixed(6)),
    kappa_4: Number(kappa4.toFixed(6))
  };
}

function calculateRollingOmega(returns, threshold, windowSize) {
  const rollingOmegas = [];
  
  for (let i = windowSize; i <= returns.length; i++) {
    const windowReturns = returns.slice(i - windowSize, i);
    
    const gains = windowReturns.filter(r => r > threshold).map(r => r - threshold);
    const losses = windowReturns.filter(r => r <= threshold).map(r => threshold - r);
    
    const expectedGain = gains.length > 0 ? gains.reduce((sum, g) => sum + g, 0) / windowReturns.length : 0;
    const expectedLoss = losses.length > 0 ? losses.reduce((sum, l) => sum + l, 0) / windowReturns.length : 0;
    
    const omega = expectedLoss === 0 ? (expectedGain > 0 ? 100 : 1) : expectedGain / expectedLoss;
    rollingOmegas.push(omega);
  }
  
  return rollingOmegas;
}

function assessOmegaStability(rollingOmegas) {
  if (rollingOmegas.length < 3) return 'insufficient_data';
  
  // Filter out extreme values for stability assessment
  const filteredOmegas = rollingOmegas.filter(o => o < 10 && o > 0.1);
  
  if (filteredOmegas.length < 3) return 'too_volatile';
  
  const mean = filteredOmegas.reduce((sum, o) => sum + o, 0) / filteredOmegas.length;
  const variance = filteredOmegas.reduce((sum, o) => sum + Math.pow(o - mean, 2), 0) / filteredOmegas.length;
  const coefficientOfVariation = Math.sqrt(variance) / mean;
  
  if (coefficientOfVariation < 0.2) return 'very_stable';
  if (coefficientOfVariation < 0.5) return 'stable';
  if (coefficientOfVariation < 1.0) return 'moderate';
  return 'unstable';
}