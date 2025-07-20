/**
 * Calmar Ratio Function
 * Measures return over maximum drawdown
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
      returns = null, 
      price_series = null, 
      risk_free_rate = 0.02,
      lookback_period = 36 // months
    } = req.body;

    if (!Array.isArray(returns) && !Array.isArray(price_series)) {
      return res.status(400).json({ 
        error: 'Invalid input: either returns or price_series must be provided as an array' 
      });
    }

    let prices;
    let returnSeries;

    // Convert to price series if returns provided
    if (returns) {
      returnSeries = returns;
      prices = [100]; // Start with base value of 100
      for (let i = 0; i < returns.length; i++) {
        prices.push(prices[prices.length - 1] * (1 + returns[i]));
      }
    } else {
      prices = price_series;
      returnSeries = [];
      for (let i = 1; i < prices.length; i++) {
        returnSeries.push((prices[i] - prices[i-1]) / prices[i-1]);
      }
    }

    if (prices.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 10 observations required' 
      });
    }

    // Calculate maximum drawdown
    const drawdownResult = calculateMaximumDrawdown(prices);
    const maxDrawdown = drawdownResult.max_drawdown;

    if (maxDrawdown === 0) {
      return res.json({
        calmar_ratio: Infinity,
        annualized_return: calculateAnnualizedReturn(returnSeries, risk_free_rate),
        max_drawdown: 0,
        interpretation: 'Perfect performance - no drawdowns occurred',
        metadata: {
          function: 'calmar_ratio',
          observations: prices.length,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Calculate annualized return
    const periodicRiskFreeRate = risk_free_rate / 252; // Assuming daily returns
    const excessReturns = returnSeries.map(r => r - periodicRiskFreeRate);
    const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    const annualizedExcessReturn = meanExcessReturn * 252;

    // Calculate Calmar ratio
    const calmarRatio = annualizedExcessReturn / maxDrawdown;

    // Calculate rolling Calmar ratios for stability analysis
    const rollingCalmarRatios = calculateRollingCalmarRatios(prices, lookback_period);

    // Additional drawdown statistics
    const drawdownStats = analyzeDrawdownStatistics(prices);

    // Risk-adjusted return metrics for comparison
    const volatility = Math.sqrt(
      excessReturns.reduce((sum, r) => sum + Math.pow(r - meanExcessReturn, 2), 0) / 
      (excessReturns.length - 1)
    ) * Math.sqrt(252);

    const sharpeRatio = volatility === 0 ? Infinity : annualizedExcessReturn / volatility;
    const sterlingRatio = calculateSterlingRatio(annualizedExcessReturn, drawdownStats.avg_drawdown);

    // Time-based analysis
    const timeAnalysis = analyzeTimeToRecovery(drawdownResult, prices);

    // Risk-return profile
    const riskReturnProfile = {
      return_to_volatility: volatility === 0 ? Infinity : annualizedExcessReturn / volatility,
      return_to_max_drawdown: calmarRatio,
      volatility_to_max_drawdown: maxDrawdown === 0 ? Infinity : volatility / maxDrawdown
    };

    // Interpretation
    let interpretation;
    if (calmarRatio > 3.0) {
      interpretation = 'Excellent - very high return relative to maximum drawdown';
    } else if (calmarRatio > 1.5) {
      interpretation = 'Good - solid return-to-drawdown ratio';
    } else if (calmarRatio > 0.8) {
      interpretation = 'Moderate - reasonable return-to-drawdown ratio';
    } else if (calmarRatio > 0) {
      interpretation = 'Poor - low return relative to maximum drawdown';
    } else {
      interpretation = 'Very poor - negative returns with significant drawdowns';
    }

    // Stability assessment
    const calmarStability = assessCalmarStability(rollingCalmarRatios);

    return res.json({
      calmar_ratio: Number(calmarRatio.toFixed(6)),
      annualized_return: Number(annualizedExcessReturn.toFixed(6)),
      max_drawdown: Number(maxDrawdown.toFixed(6)),
      max_drawdown_percentage: Number((maxDrawdown * 100).toFixed(2)),
      interpretation,
      drawdown_analysis: {
        max_drawdown_period: drawdownResult.max_drawdown_period,
        recovery_time: timeAnalysis.recovery_time,
        avg_drawdown: Number(drawdownStats.avg_drawdown.toFixed(6)),
        drawdown_frequency: Number(drawdownStats.drawdown_frequency.toFixed(4)),
        longest_drawdown_duration: drawdownStats.longest_duration
      },
      rolling_analysis: {
        rolling_calmar_ratios: rollingCalmarRatios.slice(-12), // Last 12 periods
        calmar_stability: calmarStability,
        min_rolling_calmar: Math.min(...rollingCalmarRatios),
        max_rolling_calmar: Math.max(...rollingCalmarRatios),
        avg_rolling_calmar: rollingCalmarRatios.reduce((sum, r) => sum + r, 0) / rollingCalmarRatios.length
      },
      comparison_metrics: {
        sharpe_ratio: Number(sharpeRatio.toFixed(6)),
        sterling_ratio: Number(sterlingRatio.toFixed(6)),
        calmar_vs_sharpe: Number((calmarRatio / sharpeRatio).toFixed(4))
      },
      risk_return_profile: {
        return_to_volatility_ratio: Number(riskReturnProfile.return_to_volatility.toFixed(4)),
        return_to_max_drawdown_ratio: Number(riskReturnProfile.return_to_max_drawdown.toFixed(4)),
        volatility_to_max_drawdown_ratio: Number(riskReturnProfile.volatility_to_max_drawdown.toFixed(4))
      },
      performance_metrics: {
        total_return: Number(((prices[prices.length - 1] / prices[0] - 1) * 100).toFixed(2)),
        volatility: Number(volatility.toFixed(6)),
        win_rate: Number((returnSeries.filter(r => r > 0).length / returnSeries.length).toFixed(4))
      },
      metadata: {
        function: 'calmar_ratio',
        observations: prices.length,
        lookback_period: lookback_period,
        risk_free_rate: risk_free_rate,
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

function calculateMaximumDrawdown(prices) {
  let runningMax = prices[0];
  let maxDrawdown = 0;
  let maxDrawdownStart = 0;
  let maxDrawdownEnd = 0;
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > runningMax) {
      runningMax = prices[i];
    }
    
    const drawdown = (runningMax - prices[i]) / runningMax;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownEnd = i;
      
      // Find start of this drawdown
      for (let j = i; j >= 0; j--) {
        if (prices[j] === runningMax) {
          maxDrawdownStart = j;
          break;
        }
      }
    }
  }
  
  return {
    max_drawdown: maxDrawdown,
    max_drawdown_period: {
      start_index: maxDrawdownStart,
      end_index: maxDrawdownEnd,
      duration: maxDrawdownEnd - maxDrawdownStart,
      peak_value: prices[maxDrawdownStart],
      trough_value: prices[maxDrawdownEnd]
    }
  };
}

function calculateAnnualizedReturn(returns, riskFreeRate) {
  const periodicRiskFreeRate = riskFreeRate / 252;
  const excessReturns = returns.map(r => r - periodicRiskFreeRate);
  const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
  return meanExcessReturn * 252;
}

function calculateRollingCalmarRatios(prices, lookbackMonths) {
  const lookbackDays = lookbackMonths * 21; // Approximate trading days per month
  const rollingRatios = [];
  
  for (let i = lookbackDays; i < prices.length; i++) {
    const windowPrices = prices.slice(i - lookbackDays, i + 1);
    const windowReturns = [];
    
    for (let j = 1; j < windowPrices.length; j++) {
      windowReturns.push((windowPrices[j] - windowPrices[j-1]) / windowPrices[j-1]);
    }
    
    const annualizedReturn = calculateAnnualizedReturn(windowReturns, 0.02);
    const drawdownResult = calculateMaximumDrawdown(windowPrices);
    
    const calmarRatio = drawdownResult.max_drawdown === 0 ? 
      (annualizedReturn > 0 ? 100 : 0) : 
      annualizedReturn / drawdownResult.max_drawdown;
    
    rollingRatios.push(calmarRatio);
  }
  
  return rollingRatios;
}

function analyzeDrawdownStatistics(prices) {
  let runningMax = prices[0];
  const drawdowns = [];
  let currentDrawdownStart = null;
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > runningMax) {
      // End of drawdown period
      if (currentDrawdownStart !== null) {
        drawdowns.push({
          start: currentDrawdownStart,
          end: i - 1,
          duration: i - 1 - currentDrawdownStart,
          magnitude: (runningMax - Math.min(...prices.slice(currentDrawdownStart, i))) / runningMax
        });
        currentDrawdownStart = null;
      }
      runningMax = prices[i];
    } else if (currentDrawdownStart === null) {
      // Start of new drawdown
      currentDrawdownStart = i - 1;
    }
  }
  
  // Handle case where we end in a drawdown
  if (currentDrawdownStart !== null) {
    drawdowns.push({
      start: currentDrawdownStart,
      end: prices.length - 1,
      duration: prices.length - 1 - currentDrawdownStart,
      magnitude: (runningMax - Math.min(...prices.slice(currentDrawdownStart))) / runningMax
    });
  }
  
  const avgDrawdown = drawdowns.length > 0 ? 
    drawdowns.reduce((sum, dd) => sum + dd.magnitude, 0) / drawdowns.length : 0;
  
  const longestDuration = drawdowns.length > 0 ? 
    Math.max(...drawdowns.map(dd => dd.duration)) : 0;
  
  return {
    total_drawdowns: drawdowns.length,
    avg_drawdown: avgDrawdown,
    drawdown_frequency: drawdowns.length / prices.length,
    longest_duration: longestDuration,
    drawdowns: drawdowns.slice(0, 5) // Return top 5 largest drawdowns
  };
}

function calculateSterlingRatio(annualizedReturn, avgDrawdown) {
  return avgDrawdown === 0 ? Infinity : annualizedReturn / avgDrawdown;
}

function analyzeTimeToRecovery(drawdownResult, prices) {
  const endIndex = drawdownResult.max_drawdown_period.end_index;
  const peakValue = drawdownResult.max_drawdown_period.peak_value;
  
  // Look for recovery after the trough
  for (let i = endIndex + 1; i < prices.length; i++) {
    if (prices[i] >= peakValue) {
      return {
        recovery_time: i - endIndex,
        recovered: true,
        recovery_index: i
      };
    }
  }
  
  return {
    recovery_time: null,
    recovered: false,
    current_recovery_progress: endIndex < prices.length - 1 ? 
      (prices[prices.length - 1] - prices[endIndex]) / (peakValue - prices[endIndex]) : 0
  };
}

function assessCalmarStability(rollingRatios) {
  if (rollingRatios.length < 3) return 'insufficient_data';
  
  const mean = rollingRatios.reduce((sum, r) => sum + r, 0) / rollingRatios.length;
  const variance = rollingRatios.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rollingRatios.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean === 0 ? Infinity : stdDev / Math.abs(mean);
  
  if (coefficientOfVariation < 0.2) return 'very_stable';
  if (coefficientOfVariation < 0.5) return 'stable';
  if (coefficientOfVariation < 1.0) return 'moderate';
  return 'unstable';
}