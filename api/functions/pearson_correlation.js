/**
 * Pearson Correlation Function
 * Computational utility - not an A2A agent
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
    const { x_values, y_values } = req.body;

    if (!Array.isArray(x_values) || !Array.isArray(y_values)) {
      return res.status(400).json({ 
        error: 'Invalid input: x_values and y_values must be arrays' 
      });
    }

    if (x_values.length !== y_values.length) {
      return res.status(400).json({ 
        error: 'Invalid input: x_values and y_values must have same length' 
      });
    }

    if (x_values.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid input: at least 2 data points required' 
      });
    }

    // Calculate Pearson correlation coefficient
    const n = x_values.length;
    const sum_x = x_values.reduce((a, b) => a + b, 0);
    const sum_y = y_values.reduce((a, b) => a + b, 0);
    const sum_xx = x_values.reduce((a, b) => a + b * b, 0);
    const sum_yy = y_values.reduce((a, b) => a + b * b, 0);
    const sum_xy = x_values.reduce((a, b, i) => a + b * y_values[i], 0);

    const numerator = n * sum_xy - sum_x * sum_y;
    const denominator = Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y));

    if (denominator === 0) {
      return res.json({
        correlation: 0,
        p_value: 1,
        interpretation: 'No correlation (zero variance)',
        metadata: {
          n: n,
          function: 'pearson_correlation',
          timestamp: new Date().toISOString()
        }
      });
    }

    const correlation = numerator / denominator;

    // Calculate approximate p-value (simplified)
    const t_stat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    const p_value = 2 * (1 - studentTCDF(Math.abs(t_stat), n - 2));

    // Interpretation
    let interpretation;
    if (Math.abs(correlation) >= 0.7) {
      interpretation = 'Strong correlation';
    } else if (Math.abs(correlation) >= 0.3) {
      interpretation = 'Moderate correlation';
    } else {
      interpretation = 'Weak correlation';
    }

    return res.json({
      correlation: Number(correlation.toFixed(6)),
      p_value: Number(p_value.toFixed(6)),
      interpretation,
      metadata: {
        n: n,
        function: 'pearson_correlation',
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

// Simplified Student's t-distribution CDF
function studentTCDF(t, df) {
  // Approximation for p-value calculation
  if (df === 1) return 0.5 + Math.atan(t) / Math.PI;
  if (df === 2) return 0.5 + t / (2 * Math.sqrt(2 + t * t));
  
  // For larger df, use normal approximation
  return normalCDF(t);
}

function normalCDF(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}