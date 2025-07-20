/**
 * Temporal Correlations Function
 * Calculates time-lagged correlations between time series
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
    const { time_series_1, time_series_2, max_lag = 10, method = 'pearson' } = req.body;

    if (!Array.isArray(time_series_1) || !Array.isArray(time_series_2)) {
      return res.status(400).json({ 
        error: 'Invalid input: time_series_1 and time_series_2 must be arrays' 
      });
    }

    if (time_series_1.length !== time_series_2.length) {
      return res.status(400).json({ 
        error: 'Invalid input: time series must have equal length' 
      });
    }

    if (time_series_1.length < Math.abs(max_lag) + 10) {
      return res.status(400).json({ 
        error: `Invalid input: time series too short for max_lag ${max_lag}` 
      });
    }

    const n = time_series_1.length;
    const correlations = [];
    const significanceTests = [];

    // Calculate correlations for different lags
    for (let lag = -max_lag; lag <= max_lag; lag++) {
      let x, y;
      
      if (lag >= 0) {
        // Positive lag: y leads x
        x = time_series_1.slice(lag);
        y = time_series_2.slice(0, n - lag);
      } else {
        // Negative lag: x leads y  
        x = time_series_1.slice(0, n + lag);
        y = time_series_2.slice(-lag);
      }

      const correlation = calculateCorrelation(x, y, method);
      const pValue = calculateSignificance(correlation, x.length);
      const isSignificant = pValue < 0.05;

      correlations.push({
        lag: lag,
        correlation: Number(correlation.toFixed(6)),
        p_value: Number(pValue.toFixed(6)),
        significant: isSignificant,
        sample_size: x.length
      });

      if (isSignificant) {
        significanceTests.push({
          lag: lag,
          correlation: correlation,
          interpretation: interpretLag(lag, correlation)
        });
      }
    }

    // Find maximum correlations
    const maxPositiveCorr = correlations.reduce((max, curr) => 
      curr.correlation > max.correlation ? curr : max
    );
    const maxNegativeCorr = correlations.reduce((min, curr) => 
      curr.correlation < min.correlation ? curr : min
    );
    const maxAbsoluteCorr = correlations.reduce((max, curr) => 
      Math.abs(curr.correlation) > Math.abs(max.correlation) ? curr : max
    );

    // Lead-lag analysis
    const leadLagAnalysis = analyzeLead_Lag(correlations);

    // Granger causality test (simplified)
    const grangerTest = performGrangerTest(time_series_1, time_series_2, max_lag);

    let interpretation;
    if (Math.abs(maxAbsoluteCorr.correlation) > 0.7) {
      interpretation = `Strong temporal relationship found at lag ${maxAbsoluteCorr.lag}`;
    } else if (Math.abs(maxAbsoluteCorr.correlation) > 0.3) {
      interpretation = `Moderate temporal relationship found at lag ${maxAbsoluteCorr.lag}`;
    } else {
      interpretation = 'Weak temporal relationships - series may be independent';
    }

    return res.json({
      correlations,
      summary: {
        max_positive_correlation: maxPositiveCorr,
        max_negative_correlation: maxNegativeCorr,
        max_absolute_correlation: maxAbsoluteCorr,
        significant_lags: significanceTests.length,
        total_lags_tested: correlations.length
      },
      lead_lag_analysis: leadLagAnalysis,
      granger_causality: grangerTest,
      interpretation,
      metadata: {
        function: 'temporal_correlations',
        method: method,
        max_lag: max_lag,
        series_length: n,
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

function calculateCorrelation(x, y, method) {
  if (method === 'pearson') {
    return calculatePearsonCorrelation(x, y);
  } else if (method === 'spearman') {
    return calculateSpearmanCorrelation(x, y);
  }
  throw new Error('Invalid method. Use "pearson" or "spearman"');
}

function calculatePearsonCorrelation(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateSpearmanCorrelation(x, y) {
  // Convert to ranks
  const rankX = getRanks(x);
  const rankY = getRanks(y);
  return calculatePearsonCorrelation(rankX, rankY);
}

function getRanks(arr) {
  const sorted = arr.map((val, idx) => ({val, idx})).sort((a, b) => a.val - b.val);
  const ranks = new Array(arr.length);
  
  for (let i = 0; i < sorted.length; i++) {
    ranks[sorted[i].idx] = i + 1;
  }
  
  return ranks;
}

function calculateSignificance(correlation, sampleSize) {
  // t-test for correlation significance
  if (sampleSize <= 2) return 1;
  
  const t = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
  const df = sampleSize - 2;
  
  // Approximate p-value using t-distribution
  const pValue = 2 * (1 - studentTCDF(Math.abs(t), df));
  return Math.min(pValue, 1);
}

function studentTCDF(t, df) {
  // Approximation of Student's t CDF
  if (df === 1) return 0.5 + Math.atan(t) / Math.PI;
  if (df === 2) return 0.5 + t / (2 * Math.sqrt(2 + t * t));
  
  // General approximation
  const x = t / Math.sqrt(df);
  return 0.5 + 0.5 * Math.sign(t) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI));
}

function interpretLag(lag, correlation) {
  const direction = correlation > 0 ? 'positive' : 'negative';
  
  if (lag > 0) {
    return `Series 2 leads Series 1 by ${lag} periods with ${direction} correlation`;
  } else if (lag < 0) {
    return `Series 1 leads Series 2 by ${Math.abs(lag)} periods with ${direction} correlation`;
  } else {
    return `Contemporaneous ${direction} correlation`;
  }
}

function analyzeLead_Lag(correlations) {
  const positiveLags = correlations.filter(c => c.lag > 0);
  const negativeLags = correlations.filter(c => c.lag < 0);
  const zeroLag = correlations.find(c => c.lag === 0);

  const maxPositiveLag = positiveLags.reduce((max, curr) => 
    Math.abs(curr.correlation) > Math.abs(max.correlation) ? curr : max
  , {correlation: 0});

  const maxNegativeLag = negativeLags.reduce((max, curr) => 
    Math.abs(curr.correlation) > Math.abs(max.correlation) ? curr : max
  , {correlation: 0});

  let leadingVariable = 'unclear';
  if (Math.abs(maxPositiveLag.correlation) > Math.abs(maxNegativeLag.correlation) && 
      Math.abs(maxPositiveLag.correlation) > Math.abs(zeroLag.correlation)) {
    leadingVariable = 'series_2';
  } else if (Math.abs(maxNegativeLag.correlation) > Math.abs(zeroLag.correlation)) {
    leadingVariable = 'series_1';
  } else {
    leadingVariable = 'contemporaneous';
  }

  return {
    leading_variable: leadingVariable,
    strongest_lead_lag: maxPositiveLag.correlation !== 0 ? maxPositiveLag : maxNegativeLag,
    contemporaneous_correlation: zeroLag
  };
}

function performGrangerTest(x, y, maxLag) {
  // Simplified Granger causality test
  try {
    const n = Math.min(x.length, y.length);
    const testLag = Math.min(maxLag, Math.floor(n / 10));
    
    // This is a very simplified version
    // In practice, you'd need to fit autoregressive models
    
    const correlation_x_to_y = calculatePearsonCorrelation(
      x.slice(0, n - testLag),
      y.slice(testLag)
    );
    
    const correlation_y_to_x = calculatePearsonCorrelation(
      y.slice(0, n - testLag),
      x.slice(testLag)
    );

    return {
      x_granger_causes_y: Math.abs(correlation_x_to_y) > 0.1,
      y_granger_causes_x: Math.abs(correlation_y_to_x) > 0.1,
      x_to_y_strength: Math.abs(correlation_x_to_y),
      y_to_x_strength: Math.abs(correlation_y_to_x),
      test_lag: testLag,
      note: 'Simplified Granger test - use dedicated econometric software for rigorous analysis'
    };
  } catch (error) {
    return {
      error: 'Granger test failed',
      note: 'Insufficient data or other issues prevented Granger causality testing'
    };
  }
}