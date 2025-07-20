/**
 * Comprehensive Function Registry
 * Catalog all computational functions with parameters and outputs
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { category, search } = req.query;

  // Comprehensive function registry
  const FUNCTION_REGISTRY = {
    // Statistical Functions
    'pearson_correlation': {
      category: 'statistical',
      description: 'Calculates Pearson correlation coefficient between two variables',
      endpoint: '/api/functions/pearson_correlation',
      method: 'POST',
      status: 'active',
      inputs: {
        x_values: { type: 'array', required: true, description: 'First dataset' },
        y_values: { type: 'array', required: true, description: 'Second dataset' }
      },
      outputs: {
        correlation: { type: 'number', description: 'Correlation coefficient (-1 to 1)' },
        p_value: { type: 'number', description: 'Statistical significance' }
      },
      example: {
        input: { x_values: [1, 2, 3, 4, 5], y_values: [2, 4, 6, 8, 10] },
        output: { correlation: 1.0, p_value: 0.001 }
      }
    },
    'correlation_matrix': {
      category: 'statistical',
      description: 'Generates correlation matrix for multiple variables',
      endpoint: '/api/functions/correlation_matrix',
      method: 'POST', 
      status: 'planned',
      inputs: {
        data_matrix: { type: 'array', required: true, description: 'Matrix of datasets' }
      },
      outputs: {
        correlation_matrix: { type: 'array', description: 'NxN correlation matrix' }
      }
    },
    'temporal_correlations': {
      category: 'statistical',
      description: 'Calculates time-lagged correlations',
      endpoint: '/api/functions/temporal_correlations',
      method: 'POST',
      status: 'planned',
      inputs: {
        time_series_1: { type: 'array', required: true },
        time_series_2: { type: 'array', required: true },
        max_lag: { type: 'number', required: false, default: 10 }
      },
      outputs: {
        correlations: { type: 'array', description: 'Correlations at each lag' }
      }
    },

    // Performance Ratios
    'sharpe_ratio': {
      category: 'performance',
      description: 'Calculates risk-adjusted returns using Sharpe ratio',
      endpoint: '/api/functions/sharpe_ratio',
      method: 'POST',
      status: 'active',
      inputs: {
        returns: { type: 'array', required: true, description: 'Return series' },
        risk_free_rate: { type: 'number', required: false, default: 0.02 }
      },
      outputs: {
        sharpe_ratio: { type: 'number', description: 'Risk-adjusted return ratio' }
      },
      example: {
        input: { returns: [0.01, -0.02, 0.015], risk_free_rate: 0.02 },
        output: { sharpe_ratio: 0.85 }
      }
    },
    'sortino_ratio': {
      category: 'performance',
      description: 'Calculates downside risk-adjusted returns',
      endpoint: '/api/functions/sortino_ratio',
      method: 'POST',
      status: 'planned',
      inputs: {
        returns: { type: 'array', required: true },
        target_return: { type: 'number', required: false, default: 0 }
      },
      outputs: {
        sortino_ratio: { type: 'number' }
      }
    },
    'treynor_ratio': {
      category: 'performance',
      description: 'Calculates systematic risk-adjusted returns',
      endpoint: '/api/functions/treynor_ratio',
      method: 'POST',
      status: 'planned',
      inputs: {
        returns: { type: 'array', required: true },
        beta: { type: 'number', required: true },
        risk_free_rate: { type: 'number', required: false, default: 0.02 }
      },
      outputs: {
        treynor_ratio: { type: 'number' }
      }
    },
    'information_ratio': {
      category: 'performance',
      description: 'Measures risk-adjusted active returns',
      endpoint: '/api/functions/information_ratio',
      method: 'POST',
      status: 'planned',
      inputs: {
        portfolio_returns: { type: 'array', required: true },
        benchmark_returns: { type: 'array', required: true }
      },
      outputs: {
        information_ratio: { type: 'number' }
      }
    },
    'calmar_ratio': {
      category: 'performance', 
      description: 'Measures return over maximum drawdown',
      endpoint: '/api/functions/calmar_ratio',
      method: 'POST',
      status: 'planned',
      inputs: {
        returns: { type: 'array', required: true }
      },
      outputs: {
        calmar_ratio: { type: 'number' }
      }
    },
    'omega_ratio': {
      category: 'performance',
      description: 'Calculates probability-weighted risk-return ratio',
      endpoint: '/api/functions/omega_ratio',
      method: 'POST',
      status: 'planned',
      inputs: {
        returns: { type: 'array', required: true },
        threshold: { type: 'number', required: false, default: 0 }
      },
      outputs: {
        omega_ratio: { type: 'number' }
      }
    },

    // Risk Metrics
    'value_at_risk': {
      category: 'risk',
      description: 'Calculates Value at Risk using multiple methods',
      endpoint: '/api/functions/value_at_risk',
      method: 'POST',
      status: 'active',
      inputs: {
        returns: { type: 'array', required: true, description: 'Return series' },
        confidence_level: { type: 'number', required: false, default: 0.95 },
        method: { type: 'string', required: false, default: 'historical' }
      },
      outputs: {
        var: { type: 'number', description: 'Value at Risk' },
        expected_shortfall: { type: 'number', description: 'Conditional VaR' }
      },
      example: {
        input: { returns: [0.01, -0.02, 0.015], confidence_level: 0.95 },
        output: { var: -0.018, expected_shortfall: -0.02 }
      }
    },
    'expected_shortfall': {
      category: 'risk',
      description: 'Calculates conditional VaR and expected shortfall',
      endpoint: '/api/functions/expected_shortfall',
      method: 'POST',
      status: 'planned',
      inputs: {
        returns: { type: 'array', required: true },
        confidence_level: { type: 'number', required: false, default: 0.95 }
      },
      outputs: {
        expected_shortfall: { type: 'number' }
      }
    },
    'maximum_drawdown': {
      category: 'risk',
      description: 'Analyzes maximum portfolio drawdowns',
      endpoint: '/api/functions/maximum_drawdown',
      method: 'POST',
      status: 'planned',
      inputs: {
        price_series: { type: 'array', required: true }
      },
      outputs: {
        max_drawdown: { type: 'number' },
        drawdown_duration: { type: 'number' }
      }
    },
    'conditional_drawdown': {
      category: 'risk',
      description: 'Calculates conditional drawdown at risk',
      endpoint: '/api/functions/conditional_drawdown',
      method: 'POST',
      status: 'planned',
      inputs: {
        price_series: { type: 'array', required: true },
        confidence_level: { type: 'number', required: false, default: 0.95 }
      },
      outputs: {
        conditional_drawdown: { type: 'number' }
      }
    },
    'ulcer_index': {
      category: 'risk',
      description: 'Measures downside volatility and stress',
      endpoint: '/api/functions/ulcer_index',
      method: 'POST',
      status: 'planned',
      inputs: {
        price_series: { type: 'array', required: true }
      },
      outputs: {
        ulcer_index: { type: 'number' }
      }
    },
    'portfolio_volatility': {
      category: 'risk',
      description: 'Calculates portfolio volatility and standard deviation',
      endpoint: '/api/functions/portfolio_volatility',
      method: 'POST',
      status: 'planned',
      inputs: {
        weights: { type: 'array', required: true },
        covariance_matrix: { type: 'array', required: true }
      },
      outputs: {
        volatility: { type: 'number' }
      }
    },

    // Advanced Analytics
    'black_scholes': {
      category: 'derivatives',
      description: 'Calculates option prices using Black-Scholes model',
      endpoint: '/api/functions/black_scholes',
      method: 'POST',
      status: 'planned',
      inputs: {
        S: { type: 'number', required: true, description: 'Current stock price' },
        K: { type: 'number', required: true, description: 'Strike price' },
        T: { type: 'number', required: true, description: 'Time to expiration' },
        r: { type: 'number', required: true, description: 'Risk-free rate' },
        sigma: { type: 'number', required: true, description: 'Volatility' },
        option_type: { type: 'string', required: false, default: 'call' }
      },
      outputs: {
        option_price: { type: 'number' },
        delta: { type: 'number' },
        gamma: { type: 'number' },
        theta: { type: 'number' },
        vega: { type: 'number' }
      }
    },
    'monte_carlo': {
      category: 'simulation',
      description: 'Runs Monte Carlo simulations for risk analysis',
      endpoint: '/api/functions/monte_carlo',
      method: 'POST',
      status: 'planned',
      inputs: {
        initial_value: { type: 'number', required: true },
        drift: { type: 'number', required: true },
        volatility: { type: 'number', required: true },
        time_horizon: { type: 'number', required: true },
        simulations: { type: 'number', required: false, default: 10000 }
      },
      outputs: {
        final_values: { type: 'array' },
        statistics: { type: 'object' }
      }
    },
    'kelly_criterion': {
      category: 'optimization',
      description: 'Calculates optimal position sizing using Kelly Criterion',
      endpoint: '/api/functions/kelly_criterion',
      method: 'POST',
      status: 'planned',
      inputs: {
        win_probability: { type: 'number', required: true },
        win_loss_ratio: { type: 'number', required: true }
      },
      outputs: {
        kelly_fraction: { type: 'number' }
      }
    },
    'hurst_exponent': {
      category: 'time_series',
      description: 'Calculates Hurst exponent for time series',
      endpoint: '/api/functions/hurst_exponent',
      method: 'POST',
      status: 'planned',
      inputs: {
        time_series: { type: 'array', required: true }
      },
      outputs: {
        hurst_exponent: { type: 'number' }
      }
    },
    'technical_indicators': {
      category: 'technical',
      description: 'Calculates various technical indicators',
      endpoint: '/api/functions/technical_indicators',
      method: 'POST',
      status: 'planned',
      inputs: {
        prices: { type: 'array', required: true },
        indicator: { type: 'string', required: true },
        period: { type: 'number', required: false, default: 14 }
      },
      outputs: {
        values: { type: 'array' }
      }
    }
  };

  // Filter functions based on query parameters
  let functions = { ...FUNCTION_REGISTRY };
  
  if (category) {
    functions = Object.fromEntries(
      Object.entries(functions).filter(([_, func]) => func.category === category)
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    functions = Object.fromEntries(
      Object.entries(functions).filter(([name, func]) => 
        name.includes(searchLower) || 
        func.description.toLowerCase().includes(searchLower)
      )
    );
  }

  const categories = [...new Set(Object.values(FUNCTION_REGISTRY).map(f => f.category))];
  const totalFunctions = Object.keys(FUNCTION_REGISTRY).length;
  const activeFunctions = Object.values(FUNCTION_REGISTRY).filter(f => f.status === 'active').length;

  return res.json({
    success: true,
    functions,
    categories,
    metadata: {
      total_functions: totalFunctions,
      active_functions: activeFunctions,
      planned_functions: totalFunctions - activeFunctions,
      categories: categories.length
    }
  });
}