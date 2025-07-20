/**
 * Information Ratio Function
 * Measures risk-adjusted active returns vs benchmark
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
    const { portfolio_returns, benchmark_returns, risk_free_rate = 0.02 } = req.body;

    if (!Array.isArray(portfolio_returns) || !Array.isArray(benchmark_returns)) {
      return res.status(400).json({ 
        error: 'Invalid input: portfolio_returns and benchmark_returns must be arrays' 
      });
    }

    if (portfolio_returns.length !== benchmark_returns.length) {
      return res.status(400).json({ 
        error: 'Invalid input: portfolio_returns and benchmark_returns must have same length' 
      });
    }

    if (portfolio_returns.length < 5) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 5 return observations required' 
      });
    }

    // Calculate active returns (portfolio - benchmark)
    const activeReturns = portfolio_returns.map((pr, i) => pr - benchmark_returns[i]);
    
    // Calculate mean active return (alpha)
    const meanActiveReturn = activeReturns.reduce((sum, ar) => sum + ar, 0) / activeReturns.length;
    
    // Calculate tracking error (standard deviation of active returns)
    const trackingErrorVariance = activeReturns.reduce((sum, ar) => 
      sum + Math.pow(ar - meanActiveReturn, 2), 0
    ) / (activeReturns.length - 1);
    const trackingError = Math.sqrt(trackingErrorVariance);
    
    // Calculate Information Ratio
    const informationRatio = trackingError === 0 ? 
      (meanActiveReturn === 0 ? 0 : Infinity) : 
      meanActiveReturn / trackingError;
    
    // Annualized values
    const annualizedActiveReturn = meanActiveReturn * 252;
    const annualizedTrackingError = trackingError * Math.sqrt(252);
    const annualizedInformationRatio = annualizedTrackingError === 0 ? 
      (annualizedActiveReturn === 0 ? 0 : Infinity) : 
      annualizedActiveReturn / annualizedTrackingError;

    // Portfolio and benchmark statistics
    const portfolioMean = portfolio_returns.reduce((sum, r) => sum + r, 0) / portfolio_returns.length;
    const benchmarkMean = benchmark_returns.reduce((sum, r) => sum + r, 0) / benchmark_returns.length;
    
    const portfolioVolatility = Math.sqrt(
      portfolio_returns.reduce((sum, r) => sum + Math.pow(r - portfolioMean, 2), 0) / 
      (portfolio_returns.length - 1)
    );
    const benchmarkVolatility = Math.sqrt(
      benchmark_returns.reduce((sum, r) => sum + Math.pow(r - benchmarkMean, 2), 0) / 
      (benchmark_returns.length - 1)
    );

    // Risk-adjusted metrics for comparison
    const periodicRiskFreeRate = risk_free_rate / 252;
    const portfolioSharpe = (portfolioMean - periodicRiskFreeRate) / portfolioVolatility;
    const benchmarkSharpe = (benchmarkMean - periodicRiskFreeRate) / benchmarkVolatility;

    // Hit rate analysis
    const outperformancePeriods = activeReturns.filter(ar => ar > 0).length;
    const hitRate = outperformancePeriods / activeReturns.length;
    
    // Up/down capture ratios
    const upCapture = calculateCaptureRatio(portfolio_returns, benchmark_returns, true);
    const downCapture = calculateCaptureRatio(portfolio_returns, benchmark_returns, false);

    // Active risk decomposition
    const maxActiveReturn = Math.max(...activeReturns);
    const minActiveReturn = Math.min(...activeReturns);
    const activeReturnRange = maxActiveReturn - minActiveReturn;
    
    // Consistency analysis
    const positiveActiveReturns = activeReturns.filter(ar => ar > 0);
    const negativeActiveReturns = activeReturns.filter(ar => ar < 0);
    const avgPositiveActive = positiveActiveReturns.length > 0 ? 
      positiveActiveReturns.reduce((sum, ar) => sum + ar, 0) / positiveActiveReturns.length : 0;
    const avgNegativeActive = negativeActiveReturns.length > 0 ? 
      negativeActiveReturns.reduce((sum, ar) => sum + ar, 0) / negativeActiveReturns.length : 0;

    // t-statistic for significance testing
    const tStatistic = Math.sqrt(activeReturns.length) * meanActiveReturn / trackingError;
    const pValue = calculateTTestPValue(tStatistic, activeReturns.length - 1);

    // Interpretation
    let interpretation;
    if (informationRatio > 0.75) {
      interpretation = 'Excellent - very high risk-adjusted outperformance';
    } else if (informationRatio > 0.5) {
      interpretation = 'Good - solid risk-adjusted outperformance';
    } else if (informationRatio > 0.25) {
      interpretation = 'Moderate - some risk-adjusted outperformance';
    } else if (informationRatio > 0) {
      interpretation = 'Weak - minimal risk-adjusted outperformance';
    } else if (informationRatio > -0.25) {
      interpretation = 'Poor - slight risk-adjusted underperformance';
    } else {
      interpretation = 'Very poor - significant risk-adjusted underperformance';
    }

    let consistencyInterpretation;
    if (hitRate > 0.6) {
      consistencyInterpretation = 'High consistency - frequently outperforms benchmark';
    } else if (hitRate > 0.4) {
      consistencyInterpretation = 'Moderate consistency - mixed outperformance';
    } else {
      consistencyInterpretation = 'Low consistency - frequently underperforms benchmark';
    }

    return res.json({
      information_ratio: Number(informationRatio.toFixed(6)),
      active_return: Number(meanActiveReturn.toFixed(6)),
      tracking_error: Number(trackingError.toFixed(6)),
      interpretation,
      annualized: {
        information_ratio: Number(annualizedInformationRatio.toFixed(6)),
        active_return: Number(annualizedActiveReturn.toFixed(6)),
        tracking_error: Number(annualizedTrackingError.toFixed(6))
      },
      performance_attribution: {
        portfolio_return: Number(portfolioMean.toFixed(6)),
        benchmark_return: Number(benchmarkMean.toFixed(6)),
        excess_return: Number(meanActiveReturn.toFixed(6)),
        portfolio_volatility: Number(portfolioVolatility.toFixed(6)),
        benchmark_volatility: Number(benchmarkVolatility.toFixed(6))
      },
      consistency_metrics: {
        hit_rate: Number(hitRate.toFixed(4)),
        hit_rate_percentage: Number((hitRate * 100).toFixed(2)),
        outperformance_periods: outperformancePeriods,
        underperformance_periods: activeReturns.length - outperformancePeriods,
        consistency_interpretation: consistencyInterpretation
      },
      capture_ratios: {
        up_capture: Number(upCapture.toFixed(4)),
        down_capture: Number(downCapture.toFixed(4)),
        capture_ratio: Number((upCapture / downCapture).toFixed(4))
      },
      active_return_statistics: {
        max_active_return: Number(maxActiveReturn.toFixed(6)),
        min_active_return: Number(minActiveReturn.toFixed(6)),
        active_return_range: Number(activeReturnRange.toFixed(6)),
        avg_positive_active: Number(avgPositiveActive.toFixed(6)),
        avg_negative_active: Number(avgNegativeActive.toFixed(6))
      },
      statistical_significance: {
        t_statistic: Number(tStatistic.toFixed(4)),
        p_value: Number(pValue.toFixed(6)),
        significant_at_5_percent: pValue < 0.05,
        significant_at_1_percent: pValue < 0.01
      },
      comparison_metrics: {
        portfolio_sharpe_ratio: Number(portfolioSharpe.toFixed(6)),
        benchmark_sharpe_ratio: Number(benchmarkSharpe.toFixed(6)),
        sharpe_difference: Number((portfolioSharpe - benchmarkSharpe).toFixed(6))
      },
      metadata: {
        function: 'information_ratio',
        observations: activeReturns.length,
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

function calculateCaptureRatio(portfolioReturns, benchmarkReturns, upside) {
  const relevantPeriods = [];
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    if (upside ? benchmarkReturns[i] > 0 : benchmarkReturns[i] < 0) {
      relevantPeriods.push({
        portfolio: portfolioReturns[i],
        benchmark: benchmarkReturns[i]
      });
    }
  }
  
  if (relevantPeriods.length === 0) return 1;
  
  const portfolioSum = relevantPeriods.reduce((sum, p) => sum + p.portfolio, 0);
  const benchmarkSum = relevantPeriods.reduce((sum, p) => sum + p.benchmark, 0);
  
  return benchmarkSum === 0 ? 1 : portfolioSum / benchmarkSum;
}

function calculateTTestPValue(tStat, degreesOfFreedom) {
  // Simplified t-test p-value calculation
  const absTStat = Math.abs(tStat);
  
  if (degreesOfFreedom <= 0) return 1;
  if (absTStat === 0) return 1;
  
  // Rough approximation for two-tailed test
  if (absTStat > 3) return 0.001;
  if (absTStat > 2.58) return 0.01;
  if (absTStat > 2.33) return 0.02;
  if (absTStat > 1.96) return 0.05;
  if (absTStat > 1.65) return 0.1;
  if (absTStat > 1.28) return 0.2;
  
  return Math.max(0.2 - (absTStat / 10), 0.001);
}