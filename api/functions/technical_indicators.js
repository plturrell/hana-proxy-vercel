/**
 * Technical Indicators Function
 * Calculates various technical analysis indicators
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
      prices,
      high_prices = null,
      low_prices = null,
      volumes = null,
      indicator = 'sma',
      period = 14,
      short_period = 12,
      long_period = 26,
      signal_period = 9
    } = req.body;

    if (!Array.isArray(prices)) {
      return res.status(400).json({ 
        error: 'Invalid input: prices must be an array' 
      });
    }

    if (prices.length < period) {
      return res.status(400).json({ 
        error: `Invalid input: at least ${period} price observations required for ${indicator}` 
      });
    }

    let result;
    const supportedIndicators = [
      'sma', 'ema', 'rsi', 'macd', 'bollinger', 'stochastic', 
      'williams_r', 'atr', 'cci', 'momentum', 'roc', 'obv'
    ];

    if (!supportedIndicators.includes(indicator)) {
      return res.status(400).json({ 
        error: `Invalid indicator: ${indicator}. Supported: ${supportedIndicators.join(', ')}` 
      });
    }

    switch (indicator) {
      case 'sma':
        result = calculateSMA(prices, period);
        break;
      case 'ema':
        result = calculateEMA(prices, period);
        break;
      case 'rsi':
        result = calculateRSI(prices, period);
        break;
      case 'macd':
        result = calculateMACD(prices, short_period, long_period, signal_period);
        break;
      case 'bollinger':
        result = calculateBollingerBands(prices, period);
        break;
      case 'stochastic':
        if (!high_prices || !low_prices) {
          return res.status(400).json({ 
            error: 'Stochastic oscillator requires high_prices and low_prices arrays' 
          });
        }
        result = calculateStochastic(prices, high_prices, low_prices, period);
        break;
      case 'williams_r':
        if (!high_prices || !low_prices) {
          return res.status(400).json({ 
            error: 'Williams %R requires high_prices and low_prices arrays' 
          });
        }
        result = calculateWilliamsR(prices, high_prices, low_prices, period);
        break;
      case 'atr':
        if (!high_prices || !low_prices) {
          return res.status(400).json({ 
            error: 'ATR requires high_prices and low_prices arrays' 
          });
        }
        result = calculateATR(prices, high_prices, low_prices, period);
        break;
      case 'cci':
        if (!high_prices || !low_prices) {
          return res.status(400).json({ 
            error: 'CCI requires high_prices and low_prices arrays' 
          });
        }
        result = calculateCCI(prices, high_prices, low_prices, period);
        break;
      case 'momentum':
        result = calculateMomentum(prices, period);
        break;
      case 'roc':
        result = calculateROC(prices, period);
        break;
      case 'obv':
        if (!volumes) {
          return res.status(400).json({ 
            error: 'OBV requires volumes array' 
          });
        }
        result = calculateOBV(prices, volumes);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported indicator' });
    }

    // Generate trading signals
    const signals = generateTradingSignals(result, indicator);
    
    // Calculate indicator statistics
    const statistics = calculateIndicatorStatistics(result, indicator);

    return res.json({
      indicator: indicator,
      period: period,
      values: result.values || result,
      signals: signals,
      statistics: statistics,
      current_value: getCurrentValue(result),
      interpretation: interpretIndicator(result, indicator, statistics),
      parameters: {
        period: period,
        short_period: short_period,
        long_period: long_period,
        signal_period: signal_period
      },
      metadata: {
        function: 'technical_indicators',
        indicator: indicator,
        observations: prices.length,
        valid_values: countValidValues(result),
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

// Simple Moving Average
function calculateSMA(prices, period) {
  const sma = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(Number((sum / period).toFixed(6)));
  }
  
  return sma;
}

// Exponential Moving Average
function calculateEMA(prices, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  ema[0] = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema.push(Number((prices[i] * multiplier + ema[ema.length - 1] * (1 - multiplier)).toFixed(6)));
  }
  
  return ema;
}

// Relative Strength Index
function calculateRSI(prices, period) {
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const rsi = [];
  let avgGain = 0;
  let avgLoss = 0;
  
  // Calculate initial averages
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  avgGain /= period;
  avgLoss /= period;
  
  // Calculate RSI
  for (let i = period; i < changes.length; i++) {
    const currentChange = changes[i];
    const gain = currentChange > 0 ? currentChange : 0;
    const loss = currentChange < 0 ? Math.abs(currentChange) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(Number((100 - (100 / (1 + rs))).toFixed(2)));
  }
  
  return rsi;
}

// MACD
function calculateMACD(prices, shortPeriod, longPeriod, signalPeriod) {
  const emaShort = calculateEMA(prices, shortPeriod);
  const emaLong = calculateEMA(prices, longPeriod);
  
  // Align arrays (emaLong starts later)
  const startIndex = longPeriod - shortPeriod;
  const macdLine = [];
  
  for (let i = startIndex; i < emaShort.length; i++) {
    macdLine.push(Number((emaShort[i] - emaLong[i - startIndex]).toFixed(6)));
  }
  
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = [];
  
  const signalStart = signalPeriod - 1;
  for (let i = signalStart; i < macdLine.length; i++) {
    histogram.push(Number((macdLine[i] - signalLine[i - signalStart]).toFixed(6)));
  }
  
  return {
    macd_line: macdLine,
    signal_line: signalLine,
    histogram: histogram
  };
}

// Bollinger Bands
function calculateBollingerBands(prices, period, stdDev = 2) {
  const sma = calculateSMA(prices, period);
  const upperBand = [];
  const lowerBand = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    upperBand.push(Number((mean + stdDev * std).toFixed(6)));
    lowerBand.push(Number((mean - stdDev * std).toFixed(6)));
  }
  
  return {
    middle_band: sma,
    upper_band: upperBand,
    lower_band: lowerBand
  };
}

// Stochastic Oscillator
function calculateStochastic(closes, highs, lows, period) {
  const k_values = [];
  
  for (let i = period - 1; i < closes.length; i++) {
    const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
    const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
    const currentClose = closes[i];
    
    const k = lowestLow === highestHigh ? 50 : 
      ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    k_values.push(Number(k.toFixed(2)));
  }
  
  // %D is 3-period SMA of %K
  const d_values = calculateSMA(k_values, 3);
  
  return {
    k_values: k_values,
    d_values: d_values
  };
}

// Williams %R
function calculateWilliamsR(closes, highs, lows, period) {
  const williamsR = [];
  
  for (let i = period - 1; i < closes.length; i++) {
    const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
    const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
    const currentClose = closes[i];
    
    const wr = highestHigh === lowestLow ? -50 :
      ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
    
    williamsR.push(Number(wr.toFixed(2)));
  }
  
  return williamsR;
}

// Average True Range
function calculateATR(closes, highs, lows, period) {
  const trueRanges = [];
  
  for (let i = 1; i < closes.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  return calculateSMA(trueRanges, period);
}

// Commodity Channel Index
function calculateCCI(closes, highs, lows, period) {
  const cci = [];
  
  for (let i = period - 1; i < closes.length; i++) {
    const typicalPrices = [];
    
    for (let j = i - period + 1; j <= i; j++) {
      typicalPrices.push((highs[j] + lows[j] + closes[j]) / 3);
    }
    
    const smaTP = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - smaTP), 0) / period;
    
    const currentTP = (highs[i] + lows[i] + closes[i]) / 3;
    const cciValue = meanDeviation === 0 ? 0 : (currentTP - smaTP) / (0.015 * meanDeviation);
    
    cci.push(Number(cciValue.toFixed(2)));
  }
  
  return cci;
}

// Momentum
function calculateMomentum(prices, period) {
  const momentum = [];
  
  for (let i = period; i < prices.length; i++) {
    momentum.push(Number((prices[i] - prices[i - period]).toFixed(6)));
  }
  
  return momentum;
}

// Rate of Change
function calculateROC(prices, period) {
  const roc = [];
  
  for (let i = period; i < prices.length; i++) {
    const rocValue = prices[i - period] === 0 ? 0 : 
      ((prices[i] - prices[i - period]) / prices[i - period]) * 100;
    
    roc.push(Number(rocValue.toFixed(4)));
  }
  
  return roc;
}

// On-Balance Volume
function calculateOBV(prices, volumes) {
  const obv = [volumes[0]];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      obv.push(obv[obv.length - 1] + volumes[i]);
    } else if (prices[i] < prices[i - 1]) {
      obv.push(obv[obv.length - 1] - volumes[i]);
    } else {
      obv.push(obv[obv.length - 1]);
    }
  }
  
  return obv;
}

function generateTradingSignals(result, indicator) {
  const signals = [];
  
  switch (indicator) {
    case 'rsi':
      const latestRSI = result[result.length - 1];
      if (latestRSI > 70) signals.push('overbought');
      if (latestRSI < 30) signals.push('oversold');
      break;
      
    case 'macd':
      const latestHistogram = result.histogram[result.histogram.length - 1];
      const prevHistogram = result.histogram[result.histogram.length - 2];
      if (latestHistogram > 0 && prevHistogram <= 0) signals.push('bullish_crossover');
      if (latestHistogram < 0 && prevHistogram >= 0) signals.push('bearish_crossover');
      break;
      
    case 'stochastic':
      const latestK = result.k_values[result.k_values.length - 1];
      if (latestK > 80) signals.push('overbought');
      if (latestK < 20) signals.push('oversold');
      break;
      
    case 'williams_r':
      const latestWR = result[result.length - 1];
      if (latestWR > -20) signals.push('overbought');
      if (latestWR < -80) signals.push('oversold');
      break;
      
    default:
      signals.push('no_standard_signals');
  }
  
  return signals;
}

function calculateIndicatorStatistics(result, indicator) {
  let values;
  
  if (Array.isArray(result)) {
    values = result;
  } else if (result.values) {
    values = result.values;
  } else if (result.macd_line) {
    values = result.macd_line;
  } else {
    values = [];
  }
  
  if (values.length === 0) return {};
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return {
    mean: Number(mean.toFixed(6)),
    std_dev: Number(Math.sqrt(variance).toFixed(6)),
    min: Number(Math.min(...values).toFixed(6)),
    max: Number(Math.max(...values).toFixed(6)),
    latest: Number(values[values.length - 1].toFixed(6))
  };
}

function getCurrentValue(result) {
  if (Array.isArray(result)) {
    return result[result.length - 1];
  } else if (result.macd_line) {
    return {
      macd: result.macd_line[result.macd_line.length - 1],
      signal: result.signal_line[result.signal_line.length - 1],
      histogram: result.histogram[result.histogram.length - 1]
    };
  } else if (result.k_values) {
    return {
      k: result.k_values[result.k_values.length - 1],
      d: result.d_values[result.d_values.length - 1]
    };
  } else if (result.middle_band) {
    return {
      middle: result.middle_band[result.middle_band.length - 1],
      upper: result.upper_band[result.upper_band.length - 1],
      lower: result.lower_band[result.lower_band.length - 1]
    };
  }
  
  return null;
}

function interpretIndicator(result, indicator, statistics) {
  switch (indicator) {
    case 'rsi':
      const rsi = statistics.latest;
      if (rsi > 70) return 'Overbought - potential sell signal';
      if (rsi < 30) return 'Oversold - potential buy signal';
      if (rsi > 50) return 'Bullish momentum';
      return 'Bearish momentum';
      
    case 'macd':
      const currentHist = result.histogram[result.histogram.length - 1];
      if (currentHist > 0) return 'Bullish momentum - MACD above signal';
      return 'Bearish momentum - MACD below signal';
      
    case 'sma':
    case 'ema':
      return 'Moving average - use for trend identification and support/resistance';
      
    case 'bollinger':
      return 'Price bands - use for volatility and mean reversion analysis';
      
    case 'stochastic':
      const k = result.k_values[result.k_values.length - 1];
      if (k > 80) return 'Overbought conditions';
      if (k < 20) return 'Oversold conditions';
      return 'Neutral momentum';
      
    default:
      return 'Technical indicator calculated - analyze in context of price action';
  }
}

function countValidValues(result) {
  if (Array.isArray(result)) {
    return result.filter(val => val !== null && val !== undefined && !isNaN(val)).length;
  } else if (result.macd_line) {
    return result.macd_line.length;
  } else if (result.k_values) {
    return result.k_values.length;
  }
  return 0;
}