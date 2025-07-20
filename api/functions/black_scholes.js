/**
 * Black-Scholes Option Pricing Function
 * Calculates option prices and Greeks using Black-Scholes model
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
      S, // Current stock price
      K, // Strike price
      T, // Time to expiration (in years)
      r, // Risk-free rate
      sigma, // Volatility
      option_type = 'call',
      dividend_yield = 0
    } = req.body;

    // Validate inputs
    if (S <= 0 || K <= 0 || T < 0 || sigma <= 0) {
      return res.status(400).json({ 
        error: 'Invalid input: S, K, and sigma must be positive, T must be non-negative' 
      });
    }

    if (T === 0) {
      // At expiration
      const intrinsicValue = option_type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
      return res.json({
        option_price: Number(intrinsicValue.toFixed(4)),
        intrinsic_value: Number(intrinsicValue.toFixed(4)),
        time_value: 0,
        greeks: {
          delta: option_type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
          gamma: 0,
          theta: 0,
          vega: 0,
          rho: 0
        },
        moneyness: S / K,
        interpretation: 'Option at expiration - only intrinsic value remains',
        metadata: {
          function: 'black_scholes',
          option_type: option_type,
          at_expiration: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Calculate d1 and d2
    const d1 = (Math.log(S / K) + (r - dividend_yield + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    // Standard normal CDF
    const N_d1 = normalCDF(d1);
    const N_d2 = normalCDF(d2);
    const N_minus_d1 = normalCDF(-d1);
    const N_minus_d2 = normalCDF(-d2);

    // Option prices
    let optionPrice;
    if (option_type === 'call') {
      optionPrice = S * Math.exp(-dividend_yield * T) * N_d1 - K * Math.exp(-r * T) * N_d2;
    } else {
      optionPrice = K * Math.exp(-r * T) * N_minus_d2 - S * Math.exp(-dividend_yield * T) * N_minus_d1;
    }

    // Calculate Greeks
    const sqrt_T = Math.sqrt(T);
    const exp_minus_rT = Math.exp(-r * T);
    const exp_minus_qT = Math.exp(-dividend_yield * T);
    const phi_d1 = normalPDF(d1); // Standard normal PDF

    const delta = option_type === 'call' ? 
      exp_minus_qT * N_d1 : 
      exp_minus_qT * (N_d1 - 1);

    const gamma = exp_minus_qT * phi_d1 / (S * sigma * sqrt_T);

    const theta = option_type === 'call' ?
      -(S * phi_d1 * sigma * exp_minus_qT) / (2 * sqrt_T) - r * K * exp_minus_rT * N_d2 + dividend_yield * S * exp_minus_qT * N_d1 :
      -(S * phi_d1 * sigma * exp_minus_qT) / (2 * sqrt_T) + r * K * exp_minus_rT * N_minus_d2 - dividend_yield * S * exp_minus_qT * N_minus_d1;

    const vega = S * exp_minus_qT * phi_d1 * sqrt_T;

    const rho = option_type === 'call' ?
      K * T * exp_minus_rT * N_d2 :
      -K * T * exp_minus_rT * N_minus_d2;

    // Additional metrics
    const intrinsicValue = option_type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
    const timeValue = optionPrice - intrinsicValue;
    const moneyness = S / K;

    // Interpretation
    let moneyStatus;
    if (moneyness > 1.02) {
      moneyStatus = option_type === 'call' ? 'In-the-money' : 'Out-of-the-money';
    } else if (moneyness < 0.98) {
      moneyStatus = option_type === 'call' ? 'Out-of-the-money' : 'In-the-money';
    } else {
      moneyStatus = 'At-the-money';
    }

    let interpretation;
    if (timeValue / optionPrice > 0.8) {
      interpretation = 'High time value - significant premium for time and volatility';
    } else if (timeValue / optionPrice > 0.3) {
      interpretation = 'Moderate time value - balanced intrinsic and time premium';
    } else {
      interpretation = 'Low time value - mostly intrinsic value';
    }

    return res.json({
      option_price: Number(optionPrice.toFixed(4)),
      intrinsic_value: Number(intrinsicValue.toFixed(4)),
      time_value: Number(timeValue.toFixed(4)),
      greeks: {
        delta: Number(delta.toFixed(4)),
        gamma: Number(gamma.toFixed(6)),
        theta: Number((theta / 365).toFixed(4)), // Daily theta
        vega: Number((vega / 100).toFixed(4)), // Vega per 1% volatility change
        rho: Number((rho / 100).toFixed(4)) // Rho per 1% interest rate change
      },
      market_data: {
        moneyness: Number(moneyness.toFixed(4)),
        moneyness_status: moneyStatus,
        implied_volatility_input: Number((sigma * 100).toFixed(2)) + '%',
        time_to_expiration_days: Number((T * 365).toFixed(0))
      },
      risk_metrics: {
        leverage: Number((delta * S / optionPrice).toFixed(2)),
        time_decay_per_day: Number((theta / 365).toFixed(4)),
        volatility_sensitivity: Number((vega / 100).toFixed(4))
      },
      interpretation,
      metadata: {
        function: 'black_scholes',
        option_type: option_type,
        model: 'Black-Scholes-Merton',
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

// Standard normal cumulative distribution function
function normalCDF(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

// Standard normal probability density function
function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Error function approximation
function erf(x) {
  // Abramowitz and Stegun approximation
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