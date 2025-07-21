/**
 * Time Series Analysis Function
 * Comprehensive time series decomposition, forecasting, and pattern detection
 * Used by Market Data Agent for trend analysis and prediction
 */

/**
 * Main time series analysis function
 * @param {Object} params - Analysis parameters
 * @param {Array} params.data - Time series data (array of values)
 * @param {Array} params.timestamps - Optional timestamps for irregular series
 * @param {string} params.method - Analysis method ('decomposition', 'forecast', 'fourier_transform', 'arima')
 * @param {string} params.frequency - Data frequency ('daily', 'hourly', 'monthly', etc.)
 * @param {number} params.forecast_periods - Number of periods to forecast
 * @param {Array} params.identify - Specific patterns to identify
 * @returns {Object} Time series analysis results
 */
export async function performTimeSeriesAnalysis(params) {
  try {
    const {
      data,
      timestamps = null,
      method = 'decomposition',
      frequency = 'daily',
      forecast_periods = 10,
      identify = ['trends', 'seasonality', 'anomalies']
    } = params;

    // Validate inputs
    if (!data || !Array.isArray(data) || data.length < 4) {
      throw new Error('Valid data array with at least 4 points is required');
    }

    let result = {
      status: 'success',
      method: method,
      data_points: data.length,
      frequency: frequency
    };

    // Perform requested analysis
    switch (method.toLowerCase()) {
      case 'decomposition':
        const decomposition = performDecomposition(data, frequency);
        result = { ...result, ...decomposition };
        break;

      case 'forecast':
        const forecast = performForecast(data, forecast_periods, frequency);
        result = { ...result, ...forecast };
        break;

      case 'fourier_transform':
        const fourier = performFourierTransform(data);
        result = { ...result, ...fourier };
        break;

      case 'arima':
        const arima = performARIMA(data, forecast_periods);
        result = { ...result, ...arima };
        break;

      default:
        // Comprehensive analysis
        const comprehensive = performComprehensiveAnalysis(data, frequency, forecast_periods, identify);
        result = { ...result, ...comprehensive };
    }

    // Add pattern identification
    if (identify && identify.length > 0) {
      result.identified_patterns = identifyPatterns(data, identify, frequency);
    }

    // Add statistical summary
    result.statistics = calculateTimeSeriesStatistics(data);
    result.timestamp = new Date();

    return result;

  } catch (error) {
    console.error('Time series analysis error:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date()
    };
  }
}

/**
 * Decompose time series into trend, seasonal, and residual components
 */
function performDecomposition(data, frequency) {
  const n = data.length;
  const period = getPeriodFromFrequency(frequency);
  
  // Moving average for trend
  const trend = calculateMovingAverage(data, period);
  
  // Detrended series
  const detrended = data.map((val, i) => val - (trend[i] || trend[trend.length - 1]));
  
  // Seasonal component
  const seasonal = calculateSeasonalComponent(detrended, period);
  
  // Residual component
  const residual = data.map((val, i) => {
    const trendVal = trend[i] || trend[trend.length - 1];
    const seasonalVal = seasonal[i % period];
    return val - trendVal - seasonalVal;
  });
  
  // Calculate strengths
  const trendStrength = calculateComponentStrength(data, trend);
  const seasonalStrength = calculateSeasonalStrength(detrended, seasonal, period);
  
  return {
    decomposition: {
      trend: trend,
      seasonal: seasonal,
      residual: residual,
      trend_strength: trendStrength,
      seasonal_strength: seasonalStrength,
      period: period
    },
    interpretation: interpretDecomposition(trendStrength, seasonalStrength)
  };
}

/**
 * Forecast future values using various methods
 */
function performForecast(data, periods, frequency) {
  const n = data.length;
  
  // Simple methods
  const naiveForecast = Array(periods).fill(data[n - 1]);
  const trendForecast = forecastWithTrend(data, periods);
  const exponentialSmoothing = performExponentialSmoothing(data, periods);
  
  // Seasonal naive (if applicable)
  const period = getPeriodFromFrequency(frequency);
  const seasonalNaive = forecastSeasonalNaive(data, periods, period);
  
  // Holt-Winters for trend and seasonality
  const holtWinters = performHoltWinters(data, periods, period);
  
  // Confidence intervals
  const residualStd = calculateResidualStandardError(data, exponentialSmoothing.fitted);
  const intervals = calculatePredictionIntervals(holtWinters.forecast, residualStd, periods);
  
  return {
    forecast: {
      values: holtWinters.forecast,
      method: 'Holt-Winters',
      confidence_intervals: intervals,
      alternative_forecasts: {
        naive: naiveForecast,
        trend: trendForecast,
        exponential_smoothing: exponentialSmoothing.forecast,
        seasonal_naive: seasonalNaive
      }
    },
    model_parameters: holtWinters.parameters,
    accuracy_metrics: calculateForecastAccuracy(data, holtWinters.fitted)
  };
}

/**
 * Perform Fourier Transform for frequency analysis
 */
function performFourierTransform(data) {
  const n = data.length;
  const fft = computeFFT(data);
  
  // Calculate power spectrum
  const powerSpectrum = fft.map(complex => 
    Math.sqrt(complex.real * complex.real + complex.imag * complex.imag)
  );
  
  // Find dominant frequencies
  const frequencies = [];
  const halfN = Math.floor(n / 2);
  
  for (let i = 1; i < halfN; i++) {
    frequencies.push({
      frequency: i / n,
      period: n / i,
      power: powerSpectrum[i],
      amplitude: powerSpectrum[i] * 2 / n
    });
  }
  
  // Sort by power and get top frequencies
  frequencies.sort((a, b) => b.power - a.power);
  const dominantFrequencies = frequencies.slice(0, 5);
  
  return {
    fourier_analysis: {
      power_spectrum: powerSpectrum.slice(0, halfN),
      dominant_frequencies: dominantFrequencies,
      periodogram: createPeriodogram(powerSpectrum, n),
      spectral_density: calculateSpectralDensity(powerSpectrum, n)
    }
  };
}

/**
 * ARIMA modeling (simplified)
 */
function performARIMA(data, forecastPeriods) {
  // Determine ARIMA parameters using simple heuristics
  const { p, d, q } = determineARIMAParameters(data);
  
  // Difference the series if needed
  let workingData = [...data];
  for (let i = 0; i < d; i++) {
    workingData = difference(workingData);
  }
  
  // Fit AR and MA components (simplified)
  const arCoefficients = fitAR(workingData, p);
  const maCoefficients = fitMA(workingData, q);
  
  // Generate forecasts
  const forecasts = [];
  const lastValues = workingData.slice(-Math.max(p, q));
  
  for (let i = 0; i < forecastPeriods; i++) {
    let forecast = 0;
    
    // AR component
    for (let j = 0; j < p && j < lastValues.length; j++) {
      forecast += arCoefficients[j] * lastValues[lastValues.length - 1 - j];
    }
    
    forecasts.push(forecast);
    lastValues.push(forecast);
    if (lastValues.length > Math.max(p, q)) lastValues.shift();
  }
  
  // Integrate forecasts if differenced
  let integratedForecasts = [...forecasts];
  for (let i = 0; i < d; i++) {
    integratedForecasts = integrate(integratedForecasts, data[data.length - 1]);
  }
  
  return {
    arima_model: {
      parameters: { p, d, q },
      ar_coefficients: arCoefficients,
      ma_coefficients: maCoefficients,
      forecast: integratedForecasts,
      model_type: `ARIMA(${p},${d},${q})`
    }
  };
}

/**
 * Comprehensive analysis combining multiple methods
 */
function performComprehensiveAnalysis(data, frequency, forecastPeriods, identify) {
  const decomposition = performDecomposition(data, frequency);
  const forecast = performForecast(data, forecastPeriods, frequency);
  const fourier = performFourierTransform(data);
  
  // Additional analyses
  const changePoints = detectChangePoints(data);
  const outliers = detectTimeSeriesOutliers(data);
  const stationarity = testStationarity(data);
  
  return {
    decomposition: decomposition.decomposition,
    forecast: forecast.forecast,
    frequency_analysis: fourier.fourier_analysis,
    change_points: changePoints,
    outliers: outliers,
    stationarity: stationarity,
    summary: {
      trend_direction: getTrendDirection(decomposition.decomposition.trend),
      seasonality_type: getSeasonalityType(decomposition.decomposition.seasonal_strength),
      forecast_confidence: calculateForecastConfidence(forecast.accuracy_metrics),
      data_quality: assessDataQuality(outliers, stationarity)
    }
  };
}

// Helper functions

function getPeriodFromFrequency(frequency) {
  const periodMap = {
    'hourly': 24,
    'daily': 7,
    'weekly': 4,
    'monthly': 12,
    'quarterly': 4,
    'yearly': 1
  };
  return periodMap[frequency.toLowerCase()] || 7;
}

function calculateMovingAverage(data, window) {
  const ma = [];
  const halfWindow = Math.floor(window / 2);
  
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    
    for (let j = Math.max(0, i - halfWindow); j <= Math.min(data.length - 1, i + halfWindow); j++) {
      sum += data[j];
      count++;
    }
    
    ma.push(sum / count);
  }
  
  return ma;
}

function calculateSeasonalComponent(detrended, period) {
  const seasonal = new Array(period).fill(0);
  const counts = new Array(period).fill(0);
  
  detrended.forEach((val, i) => {
    const seasonIndex = i % period;
    seasonal[seasonIndex] += val;
    counts[seasonIndex]++;
  });
  
  // Average seasonal values
  for (let i = 0; i < period; i++) {
    seasonal[i] = counts[i] > 0 ? seasonal[i] / counts[i] : 0;
  }
  
  // Center seasonal component
  const meanSeasonal = seasonal.reduce((a, b) => a + b, 0) / period;
  return seasonal.map(s => s - meanSeasonal);
}

function calculateComponentStrength(data, component) {
  const dataVar = variance(data);
  const componentVar = variance(component.filter(x => x !== null));
  return Math.min(componentVar / dataVar, 1);
}

function calculateSeasonalStrength(detrended, seasonal, period) {
  const detrendedVar = variance(detrended);
  const seasonalVar = variance(seasonal);
  return Math.min(seasonalVar * period / detrendedVar, 1);
}

function performExponentialSmoothing(data, periods, alpha = 0.3) {
  const n = data.length;
  const fitted = [data[0]];
  
  // Fit model
  for (let i = 1; i < n; i++) {
    fitted.push(alpha * data[i] + (1 - alpha) * fitted[i - 1]);
  }
  
  // Forecast
  const lastValue = fitted[n - 1];
  const forecast = Array(periods).fill(lastValue);
  
  return { fitted, forecast };
}

function performHoltWinters(data, periods, seasonPeriod) {
  // Simplified Holt-Winters implementation
  const alpha = 0.3; // Level smoothing
  const beta = 0.1;  // Trend smoothing
  const gamma = 0.3; // Seasonal smoothing
  
  const n = data.length;
  const nSeasons = Math.floor(n / seasonPeriod);
  
  // Initialize
  let level = data.slice(0, seasonPeriod).reduce((a, b) => a + b, 0) / seasonPeriod;
  let trend = (data.slice(seasonPeriod, 2 * seasonPeriod).reduce((a, b) => a + b, 0) / seasonPeriod - level) / seasonPeriod;
  const seasonal = calculateInitialSeasonal(data, seasonPeriod);
  
  const fitted = [];
  const levels = [level];
  const trends = [trend];
  
  // Fit model
  for (let i = 0; i < n; i++) {
    const seasonIndex = i % seasonPeriod;
    const prevSeason = i >= seasonPeriod ? seasonal[seasonIndex] : seasonal[seasonIndex];
    
    const value = (level + trend) * prevSeason;
    fitted.push(value);
    
    const newLevel = alpha * (data[i] / prevSeason) + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    
    seasonal[seasonIndex] = gamma * (data[i] / newLevel) + (1 - gamma) * prevSeason;
    
    level = newLevel;
    trend = newTrend;
    levels.push(level);
    trends.push(trend);
  }
  
  // Forecast
  const forecast = [];
  for (let i = 0; i < periods; i++) {
    const seasonIndex = (n + i) % seasonPeriod;
    forecast.push((level + trend * (i + 1)) * seasonal[seasonIndex]);
  }
  
  return {
    fitted,
    forecast,
    parameters: { alpha, beta, gamma, level, trend }
  };
}

function computeFFT(data) {
  // Simplified FFT implementation (DFT for small datasets)
  const n = data.length;
  const fft = [];
  
  for (let k = 0; k < n; k++) {
    let real = 0;
    let imag = 0;
    
    for (let t = 0; t < n; t++) {
      const angle = -2 * Math.PI * k * t / n;
      real += data[t] * Math.cos(angle);
      imag += data[t] * Math.sin(angle);
    }
    
    fft.push({ real, imag });
  }
  
  return fft;
}

function identifyPatterns(data, patterns, frequency) {
  const identified = {};
  
  if (patterns.includes('trends')) {
    identified.trends = identifyTrends(data);
  }
  
  if (patterns.includes('seasonality')) {
    identified.seasonality = identifySeasonality(data, getPeriodFromFrequency(frequency));
  }
  
  if (patterns.includes('anomalies')) {
    identified.anomalies = detectTimeSeriesOutliers(data);
  }
  
  if (patterns.includes('cycles')) {
    identified.cycles = identifyCycles(data);
  }
  
  if (patterns.includes('volatility_clusters')) {
    identified.volatility_clusters = identifyVolatilityClusters(data);
  }
  
  return identified;
}

function identifyTrends(data) {
  const ma = calculateMovingAverage(data, Math.min(7, Math.floor(data.length / 4)));
  const slope = linearRegression(ma).slope;
  
  return {
    direction: slope > 0.01 ? 'upward' : slope < -0.01 ? 'downward' : 'sideways',
    strength: Math.abs(slope),
    change_points: detectChangePoints(data)
  };
}

function identifySeasonality(data, period) {
  const seasonal = calculateSeasonalComponent(data, period);
  const strength = variance(seasonal) / variance(data);
  
  return {
    detected: strength > 0.1,
    period: period,
    strength: strength,
    pattern: seasonal
  };
}

function detectTimeSeriesOutliers(data) {
  const ma = calculateMovingAverage(data, 5);
  const residuals = data.map((val, i) => val - ma[i]);
  const std = Math.sqrt(variance(residuals));
  const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  
  const outliers = [];
  residuals.forEach((res, i) => {
    const zScore = Math.abs((res - mean) / std);
    if (zScore > 3) {
      outliers.push({
        index: i,
        value: data[i],
        z_score: zScore,
        type: res > mean ? 'spike' : 'dip'
      });
    }
  });
  
  return outliers;
}

function calculateTimeSeriesStatistics(data) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance_val = variance(data);
  const std = Math.sqrt(variance_val);
  
  // Autocorrelation at lag 1
  const acf1 = calculateAutocorrelation(data, 1);
  
  // Trend statistics
  const { slope, intercept } = linearRegression(data);
  
  return {
    mean,
    variance: variance_val,
    standard_deviation: std,
    min: Math.min(...data),
    max: Math.max(...data),
    range: Math.max(...data) - Math.min(...data),
    coefficient_of_variation: std / Math.abs(mean),
    autocorrelation_lag1: acf1,
    trend_slope: slope,
    trend_pvalue: calculateTrendPValue(data, slope)
  };
}

// Utility functions
function variance(data) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
}

function linearRegression(data) {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

function calculateAutocorrelation(data, lag) {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  
  let cov = 0;
  let var1 = 0;
  let var2 = 0;
  
  for (let i = 0; i < n - lag; i++) {
    cov += (data[i] - mean) * (data[i + lag] - mean);
    var1 += Math.pow(data[i] - mean, 2);
    var2 += Math.pow(data[i + lag] - mean, 2);
  }
  
  return cov / Math.sqrt(var1 * var2);
}

function interpretDecomposition(trendStrength, seasonalStrength) {
  let interpretation = '';
  
  if (trendStrength > 0.7) interpretation += 'Strong trend present. ';
  else if (trendStrength > 0.3) interpretation += 'Moderate trend present. ';
  else interpretation += 'Weak or no trend. ';
  
  if (seasonalStrength > 0.7) interpretation += 'Strong seasonal pattern. ';
  else if (seasonalStrength > 0.3) interpretation += 'Moderate seasonal pattern. ';
  else interpretation += 'Weak or no seasonality. ';
  
  return interpretation.trim();
}

// Additional helper functions for completeness
function detectChangePoints(data) {
  // Simplified change point detection
  const changePoints = [];
  const windowSize = Math.max(5, Math.floor(data.length / 10));
  
  for (let i = windowSize; i < data.length - windowSize; i++) {
    const before = data.slice(i - windowSize, i);
    const after = data.slice(i, i + windowSize);
    
    const meanBefore = before.reduce((a, b) => a + b, 0) / before.length;
    const meanAfter = after.reduce((a, b) => a + b, 0) / after.length;
    
    const change = Math.abs(meanAfter - meanBefore);
    const threshold = Math.sqrt(variance(data)) * 2;
    
    if (change > threshold) {
      changePoints.push({
        index: i,
        magnitude: change,
        direction: meanAfter > meanBefore ? 'increase' : 'decrease'
      });
    }
  }
  
  return changePoints;
}

// Export main function
export { performTimeSeriesAnalysis as calculateTimeSeriesAnalysis };