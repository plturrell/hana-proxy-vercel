/**
 * Maximum Drawdown Function
 * Analyzes maximum portfolio drawdowns
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
    const { price_series, returns = null } = req.body;

    if (!Array.isArray(price_series) && !Array.isArray(returns)) {
      return res.status(400).json({ 
        error: 'Invalid input: either price_series or returns must be provided as an array' 
      });
    }

    let prices;
    if (price_series) {
      prices = price_series;
    } else {
      // Convert returns to price series
      prices = [100]; // Start with base value of 100
      for (let i = 0; i < returns.length; i++) {
        prices.push(prices[prices.length - 1] * (1 + returns[i]));
      }
    }

    if (prices.length < 5) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 5 price observations required' 
      });
    }

    // Calculate running maximum (peak) and drawdowns
    let runningMax = prices[0];
    let maxDrawdown = 0;
    let maxDrawdownStart = 0;
    let maxDrawdownEnd = 0;
    let currentDrawdownStart = 0;
    let inDrawdown = false;
    
    const drawdowns = [];
    const peaks = [];
    const underwaterPeriods = [];
    
    for (let i = 0; i < prices.length; i++) {
      const currentPrice = prices[i];
      
      if (currentPrice > runningMax) {
        runningMax = currentPrice;
        
        // End of drawdown period
        if (inDrawdown) {
          underwaterPeriods.push({
            start: currentDrawdownStart,
            end: i - 1,
            duration: i - currentDrawdownStart,
            peak_value: peaks[peaks.length - 1],
            trough_value: Math.min(...prices.slice(currentDrawdownStart, i))
          });
          inDrawdown = false;
        }
        
        peaks.push(currentPrice);
      }
      
      const drawdown = (runningMax - currentPrice) / runningMax;
      drawdowns.push(drawdown);
      
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownEnd = i;
        
        // Find the start of this drawdown (when we were at the peak)
        for (let j = i; j >= 0; j--) {
          if (prices[j] === runningMax) {
            maxDrawdownStart = j;
            break;
          }
        }
      }
      
      // Track if we're in a drawdown
      if (drawdown > 0 && !inDrawdown) {
        currentDrawdownStart = i;
        inDrawdown = true;
      }
    }
    
    // If still in drawdown at the end
    if (inDrawdown) {
      underwaterPeriods.push({
        start: currentDrawdownStart,
        end: prices.length - 1,
        duration: prices.length - currentDrawdownStart,
        peak_value: runningMax,
        trough_value: Math.min(...prices.slice(currentDrawdownStart))
      });
    }
    
    // Calculate additional statistics
    const maxDrawdownDuration = maxDrawdownEnd - maxDrawdownStart;
    const avgDrawdown = drawdowns.filter(d => d > 0).reduce((sum, d) => sum + d, 0) / drawdowns.filter(d => d > 0).length || 0;
    const drawdownFrequency = drawdowns.filter(d => d > 0).length / drawdowns.length;
    
    // Recovery analysis
    const recoveryTime = calculateRecoveryTime(prices, maxDrawdownStart, maxDrawdownEnd);
    
    // Current status
    const currentDrawdown = drawdowns[drawdowns.length - 1];
    const isCurrentlyInDrawdown = currentDrawdown > 0;
    
    // Risk interpretation
    let interpretation;
    if (maxDrawdown < 0.05) {
      interpretation = 'Low risk - minimal historical losses';
    } else if (maxDrawdown < 0.15) {
      interpretation = 'Moderate risk - manageable historical drawdowns';
    } else if (maxDrawdown < 0.30) {
      interpretation = 'High risk - significant historical losses';
    } else {
      interpretation = 'Very high risk - severe historical drawdowns';
    }

    return res.json({
      max_drawdown: Number(maxDrawdown.toFixed(6)),
      max_drawdown_percentage: Number((maxDrawdown * 100).toFixed(2)),
      max_drawdown_period: {
        start_index: maxDrawdownStart,
        end_index: maxDrawdownEnd,
        duration: maxDrawdownDuration,
        peak_value: Number(prices[maxDrawdownStart].toFixed(4)),
        trough_value: Number(prices[maxDrawdownEnd].toFixed(4))
      },
      recovery_time: recoveryTime,
      current_status: {
        current_drawdown: Number(currentDrawdown.toFixed(6)),
        currently_underwater: isCurrentlyInDrawdown,
        current_price: Number(prices[prices.length - 1].toFixed(4)),
        all_time_high: Number(Math.max(...prices).toFixed(4))
      },
      statistics: {
        average_drawdown: Number(avgDrawdown.toFixed(6)),
        drawdown_frequency: Number(drawdownFrequency.toFixed(4)),
        total_underwater_periods: underwaterPeriods.length,
        longest_underwater_period: underwaterPeriods.length > 0 ? Math.max(...underwaterPeriods.map(p => p.duration)) : 0
      },
      underwater_periods: underwaterPeriods.slice(0, 5), // Return top 5 longest periods
      interpretation,
      metadata: {
        function: 'maximum_drawdown',
        observations: prices.length,
        analysis_date: new Date().toISOString()
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Calculation failed',
      details: error.message
    });
  }
}

function calculateRecoveryTime(prices, drawdownStart, drawdownEnd) {
  const peakValue = prices[drawdownStart];
  
  // Look for recovery after the drawdown end
  for (let i = drawdownEnd + 1; i < prices.length; i++) {
    if (prices[i] >= peakValue) {
      return i - drawdownEnd;
    }
  }
  
  // Not yet recovered
  return null;
}