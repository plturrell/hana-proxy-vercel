/**
 * Kelly Criterion Function
 * Calculates optimal position sizing for risk management
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
      win_probability = null,
      win_loss_ratio = null,
      expected_return = null,
      variance = null,
      returns = null,
      betting_odds = null,
      fractional_kelly = 0.25 // Conservative fraction of Kelly
    } = req.body;

    let kellyFraction;
    let calculationMethod;
    let riskMetrics;

    // Method 1: Classic Kelly with win probability and win/loss ratio
    if (win_probability !== null && win_loss_ratio !== null) {
      if (win_probability <= 0 || win_probability >= 1) {
        return res.status(400).json({ 
          error: 'Invalid input: win_probability must be between 0 and 1' 
        });
      }
      
      if (win_loss_ratio <= 0) {
        return res.status(400).json({ 
          error: 'Invalid input: win_loss_ratio must be positive' 
        });
      }

      kellyFraction = (win_probability * win_loss_ratio - (1 - win_probability)) / win_loss_ratio;
      calculationMethod = 'classic_kelly';
      
      riskMetrics = {
        win_probability: win_probability,
        loss_probability: 1 - win_probability,
        win_loss_ratio: win_loss_ratio,
        expected_value: win_probability * win_loss_ratio - (1 - win_probability),
        breakeven_probability: 1 / (1 + win_loss_ratio)
      };
    }
    // Method 2: Continuous Kelly with expected return and variance
    else if (expected_return !== null && variance !== null) {
      if (variance <= 0) {
        return res.status(400).json({ 
          error: 'Invalid input: variance must be positive' 
        });
      }

      kellyFraction = expected_return / variance;
      calculationMethod = 'continuous_kelly';
      
      riskMetrics = {
        expected_return: expected_return,
        variance: variance,
        volatility: Math.sqrt(variance),
        sharpe_like_ratio: expected_return / Math.sqrt(variance)
      };
    }
    // Method 3: Empirical Kelly from historical returns
    else if (Array.isArray(returns)) {
      if (returns.length < 10) {
        return res.status(400).json({ 
          error: 'Invalid input: at least 10 return observations required' 
        });
      }

      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const empiricalVariance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
      
      kellyFraction = empiricalVariance > 0 ? mean / empiricalVariance : 0;
      calculationMethod = 'empirical_kelly';
      
      // Additional empirical analysis
      const wins = returns.filter(r => r > 0);
      const losses = returns.filter(r => r < 0);
      const empiricalWinProb = wins.length / returns.length;
      const avgWin = wins.length > 0 ? wins.reduce((sum, w) => sum + w, 0) / wins.length : 0;
      const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, l) => sum + l, 0) / losses.length) : 0;
      const empiricalWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
      
      riskMetrics = {
        empirical_mean: mean,
        empirical_variance: empiricalVariance,
        empirical_volatility: Math.sqrt(empiricalVariance),
        win_probability: empiricalWinProb,
        avg_win: avgWin,
        avg_loss: avgLoss,
        win_loss_ratio: empiricalWinLossRatio,
        sample_size: returns.length
      };
    }
    // Method 4: Betting odds approach
    else if (betting_odds !== null && win_probability !== null) {
      if (betting_odds <= 0) {
        return res.status(400).json({ 
          error: 'Invalid input: betting_odds must be positive' 
        });
      }

      const impliedProbability = 1 / (betting_odds + 1);
      const edge = win_probability - impliedProbability;
      kellyFraction = edge > 0 ? edge / betting_odds : 0;
      calculationMethod = 'betting_kelly';
      
      riskMetrics = {
        betting_odds: betting_odds,
        win_probability: win_probability,
        implied_probability: impliedProbability,
        edge: edge,
        expected_profit: win_probability * betting_odds - (1 - win_probability)
      };
    }
    else {
      return res.status(400).json({ 
        error: 'Invalid input: provide either (win_probability + win_loss_ratio), (expected_return + variance), (returns array), or (betting_odds + win_probability)' 
      });
    }

    // Risk management adjustments
    const fractionalKellyAmount = kellyFraction * fractional_kelly;
    
    // Kelly risks and warnings
    const riskAssessment = assessKellyRisks(kellyFraction, riskMetrics);
    
    // Simulation of outcomes
    const simulationResults = simulateKellyOutcomes(kellyFraction, riskMetrics, calculationMethod);
    
    // Alternative position sizing methods for comparison
    const alternativeSizing = calculateAlternativeSizing(riskMetrics, calculationMethod);
    
    // Growth rate analysis
    const growthAnalysis = analyzeGrowthRate(kellyFraction, riskMetrics, calculationMethod);

    // Interpretation
    let interpretation;
    if (kellyFraction <= 0) {
      interpretation = 'Negative edge - avoid this investment/bet entirely';
    } else if (kellyFraction > 1) {
      interpretation = 'Very high edge but extreme risk - consider fractional Kelly sizing';
    } else if (kellyFraction > 0.5) {
      interpretation = 'High edge detected - significant position size recommended but with caution';
    } else if (kellyFraction > 0.25) {
      interpretation = 'Moderate edge - reasonable position size with good risk management';
    } else if (kellyFraction > 0.1) {
      interpretation = 'Small edge - conservative position sizing appropriate';
    } else {
      interpretation = 'Very small edge - minimal position size recommended';
    }

    let fractionalRecommendation;
    if (kellyFraction > 0.5) {
      fractionalRecommendation = 'Use 10-25% of Kelly due to high volatility risk';
    } else if (kellyFraction > 0.25) {
      fractionalRecommendation = 'Use 25-50% of Kelly for balanced risk-return';
    } else {
      fractionalRecommendation = 'Full Kelly acceptable for small positions';
    }

    return res.json({
      kelly_fraction: Number(kellyFraction.toFixed(6)),
      kelly_percentage: Number((kellyFraction * 100).toFixed(2)),
      fractional_kelly: Number(fractionalKellyAmount.toFixed(6)),
      fractional_percentage: Number((fractionalKellyAmount * 100).toFixed(2)),
      calculation_method: calculationMethod,
      interpretation,
      fractional_recommendation: fractionalRecommendation,
      risk_metrics: riskMetrics,
      risk_assessment: riskAssessment,
      simulation_results: simulationResults,
      alternative_sizing: alternativeSizing,
      growth_analysis: growthAnalysis,
      position_sizing_guide: {
        conservative: Number((kellyFraction * 0.1).toFixed(6)),
        moderate: Number((kellyFraction * 0.25).toFixed(6)),
        aggressive: Number((kellyFraction * 0.5).toFixed(6)),
        full_kelly: Number(kellyFraction.toFixed(6))
      },
      warnings: generateKellyWarnings(kellyFraction, riskAssessment),
      metadata: {
        function: 'kelly_criterion',
        method: calculationMethod,
        fractional_multiplier: fractional_kelly,
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

function assessKellyRisks(kellyFraction, riskMetrics) {
  const risks = [];
  let overallRisk = 'low';

  if (kellyFraction > 1) {
    risks.push('Extreme position size - high bankruptcy risk');
    overallRisk = 'very_high';
  } else if (kellyFraction > 0.5) {
    risks.push('Large position size - significant volatility');
    overallRisk = 'high';
  } else if (kellyFraction > 0.25) {
    risks.push('Moderate position size - manageable risk');
    overallRisk = 'moderate';
  }

  if (riskMetrics.win_probability && riskMetrics.win_probability < 0.6) {
    risks.push('Low win probability - frequent losses expected');
  }

  if (riskMetrics.variance && riskMetrics.variance > 0.1) {
    risks.push('High variance - volatile outcomes');
  }

  if (riskMetrics.sample_size && riskMetrics.sample_size < 50) {
    risks.push('Small sample size - parameter uncertainty');
  }

  return {
    overall_risk: overallRisk,
    risk_factors: risks,
    bankruptcy_probability: calculateBankruptcyProbability(kellyFraction),
    max_drawdown_estimate: estimateMaxDrawdown(kellyFraction, riskMetrics)
  };
}

function calculateBankruptcyProbability(kellyFraction) {
  // Simplified bankruptcy probability estimation
  if (kellyFraction <= 0) return 1.0;
  if (kellyFraction >= 1) return 0.99; // Very high risk
  
  // Rough approximation based on Kelly theory
  return Math.max(0, 1 - Math.pow(0.95, kellyFraction * 10));
}

function estimateMaxDrawdown(kellyFraction, riskMetrics) {
  // Rough estimate of maximum drawdown
  if (kellyFraction <= 0) return 1.0; // 100% loss
  
  const baseDrawdown = Math.min(0.5, kellyFraction * 2); // Base estimate
  const volatilityMultiplier = riskMetrics.volatility ? Math.min(2, riskMetrics.volatility * 5) : 1;
  
  return Math.min(0.99, baseDrawdown * volatilityMultiplier);
}

function simulateKellyOutcomes(kellyFraction, riskMetrics, method) {
  const simulations = 1000;
  const periods = 100;
  const outcomes = [];

  for (let sim = 0; sim < simulations; sim++) {
    let wealth = 1.0;
    
    for (let period = 0; period < periods; period++) {
      let return_;
      
      if (method === 'classic_kelly' || method === 'betting_kelly') {
        // Binary outcome simulation
        const isWin = Math.random() < riskMetrics.win_probability;
        return_ = isWin ? riskMetrics.win_loss_ratio || 1 : -1;
      } else {
        // Continuous outcome simulation (normal distribution)
        const mean = riskMetrics.expected_return || riskMetrics.empirical_mean || 0;
        const std = Math.sqrt(riskMetrics.variance || riskMetrics.empirical_variance || 0.01);
        return_ = mean + std * boxMullerRandom();
      }
      
      // Apply Kelly position sizing
      const positionReturn = kellyFraction * return_;
      wealth *= (1 + positionReturn);
      
      if (wealth <= 0.01) break; // Bankruptcy protection
    }
    
    outcomes.push(wealth);
  }

  outcomes.sort((a, b) => a - b);
  
  return {
    final_wealth_distribution: {
      median: outcomes[Math.floor(simulations / 2)],
      percentile_5: outcomes[Math.floor(simulations * 0.05)],
      percentile_95: outcomes[Math.floor(simulations * 0.95)],
      best_case: outcomes[simulations - 1],
      worst_case: outcomes[0]
    },
    bankruptcy_rate: outcomes.filter(w => w <= 0.01).length / simulations,
    average_final_wealth: outcomes.reduce((sum, w) => sum + w, 0) / simulations,
    geometric_mean_return: Math.pow(outcomes.reduce((prod, w) => prod * w, 1), 1/simulations) - 1
  };
}

function calculateAlternativeSizing(riskMetrics, method) {
  const alternatives = {};

  // Fixed fractional sizing
  alternatives.fixed_fraction_2_percent = 0.02;
  alternatives.fixed_fraction_5_percent = 0.05;

  // Volatility-based sizing (inverse volatility)
  if (riskMetrics.volatility || riskMetrics.empirical_volatility) {
    const vol = riskMetrics.volatility || riskMetrics.empirical_volatility;
    alternatives.inverse_volatility = Math.min(0.5, 0.1 / vol);
  }

  // Risk parity approach
  if (riskMetrics.variance || riskMetrics.empirical_variance) {
    const var_ = riskMetrics.variance || riskMetrics.empirical_variance;
    alternatives.risk_parity = Math.min(0.2, 0.01 / var_);
  }

  // Optimal f (Ralph Vince)
  if (method === 'empirical_kelly' && riskMetrics.sample_size) {
    // Simplified optimal f calculation
    const avgReturn = riskMetrics.empirical_mean;
    const maxLoss = Math.abs(riskMetrics.avg_loss || 0.1);
    alternatives.optimal_f = maxLoss > 0 ? Math.min(0.3, avgReturn / maxLoss) : 0;
  }

  return alternatives;
}

function analyzeGrowthRate(kellyFraction, riskMetrics, method) {
  let expectedGrowthRate;
  let optimalGrowthRate;

  if (method === 'classic_kelly' || method === 'betting_kelly') {
    const p = riskMetrics.win_probability;
    const b = riskMetrics.win_loss_ratio || 1;
    
    // Growth rate for discrete Kelly
    const f = kellyFraction;
    expectedGrowthRate = p * Math.log(1 + f * b) + (1 - p) * Math.log(1 - f);
    optimalGrowthRate = p * Math.log(1 + (p * b - (1 - p)) * b / b) + (1 - p) * Math.log(1 - (p * b - (1 - p)));
  } else {
    // Continuous Kelly growth rate
    const mu = riskMetrics.expected_return || riskMetrics.empirical_mean || 0;
    const sigma2 = riskMetrics.variance || riskMetrics.empirical_variance || 0.01;
    
    const f = kellyFraction;
    expectedGrowthRate = f * mu - 0.5 * f * f * sigma2;
    optimalGrowthRate = 0.5 * mu * mu / sigma2;
  }

  return {
    expected_growth_rate: Number(expectedGrowthRate.toFixed(6)),
    optimal_growth_rate: Number(optimalGrowthRate.toFixed(6)),
    growth_efficiency: optimalGrowthRate !== 0 ? Number((expectedGrowthRate / optimalGrowthRate).toFixed(4)) : null,
    doubling_time_years: expectedGrowthRate > 0 ? Number((Math.log(2) / expectedGrowthRate).toFixed(2)) : null
  };
}

function generateKellyWarnings(kellyFraction, riskAssessment) {
  const warnings = [];

  if (kellyFraction <= 0) {
    warnings.push('AVOID: Negative expected value detected');
  }

  if (kellyFraction > 1) {
    warnings.push('EXTREME RISK: Position size exceeds 100% - use fractional Kelly');
  }

  if (kellyFraction > 0.5) {
    warnings.push('HIGH RISK: Large position size - consider 25% fractional Kelly');
  }

  if (riskAssessment.bankruptcy_probability > 0.1) {
    warnings.push('HIGH BANKRUPTCY RISK: Consider more conservative sizing');
  }

  if (riskAssessment.max_drawdown_estimate > 0.3) {
    warnings.push('LARGE DRAWDOWNS EXPECTED: Prepare for significant losses');
  }

  warnings.push('REMEMBER: Kelly assumes accurate probability estimates');
  warnings.push('CONSIDER: Transaction costs and market impact');

  return warnings;
}

// Box-Muller transformation for normal random variables
function boxMullerRandom() {
  if (boxMullerRandom.spare !== undefined) {
    const spare = boxMullerRandom.spare;
    delete boxMullerRandom.spare;
    return spare;
  }

  const u1 = Math.random();
  const u2 = Math.random();
  const mag = Math.sqrt(-2 * Math.log(u1));
  const z0 = mag * Math.cos(2 * Math.PI * u2);
  const z1 = mag * Math.sin(2 * Math.PI * u2);
  
  boxMullerRandom.spare = z1;
  return z0;
}