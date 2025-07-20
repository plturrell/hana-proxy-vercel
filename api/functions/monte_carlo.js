/**
 * Monte Carlo Simulation Function  
 * Runs Monte Carlo simulations for risk analysis
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
      initial_value = 100,
      drift = 0.05, // Annual expected return
      volatility = 0.2, // Annual volatility
      time_horizon = 1, // Years
      time_steps = 252, // Daily steps for 1 year
      simulations = 10000,
      simulation_type = 'geometric_brownian_motion',
      confidence_levels = [0.95, 0.99]
    } = req.body;

    if (initial_value <= 0 || volatility <= 0 || time_horizon <= 0 || simulations <= 0) {
      return res.status(400).json({ 
        error: 'Invalid input: initial_value, volatility, time_horizon, and simulations must be positive' 
      });
    }

    if (simulations > 50000) {
      return res.status(400).json({ 
        error: 'Invalid input: maximum 50,000 simulations allowed' 
      });
    }

    const dt = time_horizon / time_steps;
    const sqrt_dt = Math.sqrt(dt);
    
    // Arrays to store results
    const finalValues = [];
    const paths = []; // Store some sample paths
    const storePaths = simulations <= 1000; // Only store paths for small simulations

    // Run Monte Carlo simulations
    for (let sim = 0; sim < simulations; sim++) {
      let currentValue = initial_value;
      const path = storePaths ? [currentValue] : null;

      for (let step = 0; step < time_steps; step++) {
        const randomShock = boxMullerRandom();
        
        if (simulation_type === 'geometric_brownian_motion') {
          // Geometric Brownian Motion (standard for stock prices)
          currentValue *= Math.exp((drift - 0.5 * volatility * volatility) * dt + volatility * sqrt_dt * randomShock);
        } else if (simulation_type === 'arithmetic_brownian_motion') {
          // Arithmetic Brownian Motion
          currentValue += drift * currentValue * dt + volatility * currentValue * sqrt_dt * randomShock;
        } else {
          throw new Error('Invalid simulation_type. Use "geometric_brownian_motion" or "arithmetic_brownian_motion"');
        }

        if (storePaths && (step % 10 === 0 || step === time_steps - 1)) {
          path.push(currentValue);
        }
      }

      finalValues.push(currentValue);
      if (storePaths && sim < 100) { // Store first 100 paths
        paths.push(path);
      }
    }

    // Sort final values for percentile calculations
    finalValues.sort((a, b) => a - b);

    // Calculate statistics
    const mean = finalValues.reduce((sum, val) => sum + val, 0) / simulations;
    const variance = finalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (simulations - 1);
    const standardDeviation = Math.sqrt(variance);
    
    const median = finalValues[Math.floor(simulations / 2)];
    const min = finalValues[0];
    const max = finalValues[simulations - 1];

    // Calculate percentiles and VaR
    const percentiles = {};
    const varResults = {};
    
    [0.01, 0.05, 0.1, 0.25, 0.75, 0.9, 0.95, 0.99].forEach(p => {
      const index = Math.floor(p * simulations);
      percentiles[`p${Math.round(p * 100)}`] = Number(finalValues[index].toFixed(2));
    });

    confidence_levels.forEach(cl => {
      const varIndex = Math.floor((1 - cl) * simulations);
      const varValue = finalValues[varIndex];
      const varLoss = initial_value - varValue;
      const varPercent = (varLoss / initial_value) * 100;
      
      varResults[`var_${Math.round(cl * 100)}`] = {
        value: Number(varValue.toFixed(2)),
        loss: Number(varLoss.toFixed(2)),
        loss_percentage: Number(varPercent.toFixed(2))
      };
    });

    // Expected Shortfall (CVaR)
    const expectedShortfall = {};
    confidence_levels.forEach(cl => {
      const tailIndex = Math.floor((1 - cl) * simulations);
      const tailValues = finalValues.slice(0, tailIndex + 1);
      const avgTailValue = tailValues.reduce((sum, val) => sum + val, 0) / tailValues.length;
      const esLoss = initial_value - avgTailValue;
      
      expectedShortfall[`es_${Math.round(cl * 100)}`] = {
        value: Number(avgTailValue.toFixed(2)),
        loss: Number(esLoss.toFixed(2)),
        loss_percentage: Number((esLoss / initial_value * 100).toFixed(2))
      };
    });

    // Probability of loss
    const lossProbability = finalValues.filter(val => val < initial_value).length / simulations;
    const profitProbability = 1 - lossProbability;

    // Expected return
    const expectedReturn = (mean - initial_value) / initial_value;
    const annualizedReturn = Math.pow(mean / initial_value, 1 / time_horizon) - 1;

    // Risk-return metrics
    const sharpeRatio = (annualizedReturn - 0.02) / (standardDeviation / initial_value); // Assuming 2% risk-free rate
    
    // Interpretation
    let interpretation;
    if (expectedReturn > 0.15) {
      interpretation = 'High return potential with significant upside scenarios';
    } else if (expectedReturn > 0.05) {
      interpretation = 'Moderate return potential with balanced risk-reward';
    } else if (expectedReturn > -0.05) {
      interpretation = 'Low return potential with limited upside';
    } else {
      interpretation = 'High risk of losses with negative expected returns';
    }

    return res.json({
      simulation_results: {
        initial_value: initial_value,
        mean_final_value: Number(mean.toFixed(2)),
        median_final_value: Number(median.toFixed(2)),
        standard_deviation: Number(standardDeviation.toFixed(2)),
        min_value: Number(min.toFixed(2)),
        max_value: Number(max.toFixed(2))
      },
      percentiles,
      value_at_risk: varResults,
      expected_shortfall: expectedShortfall,
      probabilities: {
        loss_probability: Number(lossProbability.toFixed(4)),
        profit_probability: Number(profitProbability.toFixed(4))
      },
      return_metrics: {
        expected_return: Number(expectedReturn.toFixed(4)),
        annualized_return: Number(annualizedReturn.toFixed(4)),
        sharpe_ratio: Number(sharpeRatio.toFixed(4))
      },
      sample_paths: paths.slice(0, 10), // Return first 10 paths if available
      interpretation,
      simulation_parameters: {
        simulations: simulations,
        time_horizon: time_horizon,
        time_steps: time_steps,
        drift: drift,
        volatility: volatility,
        simulation_type: simulation_type
      },
      metadata: {
        function: 'monte_carlo',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Simulation failed',
      details: error.message
    });
  }
}

// Box-Muller transformation for generating normal random variables
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