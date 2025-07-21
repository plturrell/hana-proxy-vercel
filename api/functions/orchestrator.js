/**
 * Mathematical Function Orchestrator
 * Connects intelligent agents with mathematical calculation functions
 * Provides routing, caching, and batch processing capabilities
 */

import NodeCache from 'node-cache';

// Import all mathematical functions
import { calculateBlackScholes } from './black_scholes.js';
import { runMonteCarloSimulation } from './monte_carlo.js';
import { calculateValueAtRisk } from './value_at_risk.js';
import { calculateKellyCriterion } from './kelly_criterion.js';
import { calculateSharpeRatio } from './sharpe_ratio.js';
import { calculateSortinoRatio } from './sortino_ratio.js';
import { calculateTreynorRatio } from './treynor_ratio.js';
import { calculateInformationRatio } from './information_ratio.js';
import { calculateCalmarRatio } from './calmar_ratio.js';
import { calculateOmegaRatio } from './omega_ratio.js';
import { calculateCorrelationMatrix } from './correlation_matrix.js';
import { calculatePearsonCorrelation } from './pearson_correlation.js';
import { calculateTemporalCorrelations } from './temporal_correlations.js';
import { calculateTechnicalIndicators } from './technical_indicators.js';
import { calculateExpectedShortfall } from './expected_shortfall.js';
import { calculateMaximumDrawdown } from './maximum_drawdown.js';

// Import new implemented functions
import { calculateClustering } from './clustering.js';
import { calculateTimeSeriesAnalysis } from './time_series_analysis.js';
import { calculateOutlierDetection } from './outlier_detection.js';
import { calculateRegression } from './regression.js';

// Initialize cache with 15-minute TTL
const cache = new NodeCache({ 
  stdTTL: 900, // 15 minutes
  checkperiod: 120 // Check for expired keys every 2 minutes
});

// Function registry mapping function names to implementations
const functionRegistry = {
  // Options & Derivatives
  'black_scholes': calculateBlackScholes,
  
  // Risk Analytics
  'monte_carlo': runMonteCarloSimulation,
  'value_at_risk': calculateValueAtRisk,
  'var': calculateValueAtRisk, // Alias
  'expected_shortfall': calculateExpectedShortfall,
  'cvar': calculateExpectedShortfall, // Alias
  'maximum_drawdown': calculateMaximumDrawdown,
  
  // Portfolio Optimization
  'kelly_criterion': calculateKellyCriterion,
  
  // Performance Metrics
  'sharpe_ratio': calculateSharpeRatio,
  'sortino_ratio': calculateSortinoRatio,
  'treynor_ratio': calculateTreynorRatio,
  'information_ratio': calculateInformationRatio,
  'calmar_ratio': calculateCalmarRatio,
  'omega_ratio': calculateOmegaRatio,
  
  // Statistical Analysis
  'correlation_matrix': calculateCorrelationMatrix,
  'pearson_correlation': calculatePearsonCorrelation,
  'temporal_correlations': calculateTemporalCorrelations,
  
  // Technical Analysis
  'technical_indicators': calculateTechnicalIndicators,
  
  // Newly implemented functions
  'clustering': calculateClustering,
  'time_series_analysis': calculateTimeSeriesAnalysis,
  'time_series': calculateTimeSeriesAnalysis, // Alias
  'outlier_detection': calculateOutlierDetection,
  'outliers': calculateOutlierDetection, // Alias
  'regression': calculateRegression,
  'linear_regression': calculateRegression, // Alias
  
  // Placeholder for future functions
  'classification': null, // To be implemented
  'forecast': null // To be implemented (beyond time series)
};

/**
 * Main orchestrator class for mathematical functions
 */
export class FunctionOrchestrator {
  constructor() {
    this.registry = functionRegistry;
    this.cache = cache;
    this.metrics = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Execute a mathematical function with caching and error handling
   */
  async executeFunction(functionName, parameters, options = {}) {
    const startTime = Date.now();
    this.metrics.totalCalls++;

    try {
      // Validate function exists
      if (!this.registry[functionName]) {
        throw new Error(`Function '${functionName}' not found in registry`);
      }

      // Check if function is implemented
      if (this.registry[functionName] === null) {
        throw new Error(`Function '${functionName}' is not yet implemented`);
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(functionName, parameters);
      
      // Check cache unless explicitly disabled
      if (!options.skipCache) {
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
          this.metrics.cacheHits++;
          return {
            ...cachedResult,
            cached: true,
            executionTime: Date.now() - startTime
          };
        }
      }
      
      this.metrics.cacheMisses++;

      // Execute the function
      const result = await this.registry[functionName](parameters);

      // Add metadata
      const enrichedResult = {
        ...result,
        function: functionName,
        parameters: parameters,
        timestamp: new Date(),
        executionTime: Date.now() - startTime,
        cached: false
      };

      // Cache the result
      if (!options.skipCache && result.status !== 'error') {
        this.cache.set(cacheKey, enrichedResult);
      }

      // Update metrics
      this.updateMetrics(Date.now() - startTime);

      return enrichedResult;

    } catch (error) {
      this.metrics.errors++;
      console.error(`Function execution error for ${functionName}:`, error);
      
      return {
        status: 'error',
        function: functionName,
        error: error.message,
        timestamp: new Date(),
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute multiple functions in parallel (batch processing)
   */
  async executeBatch(requests, options = {}) {
    const startTime = Date.now();
    
    try {
      const promises = requests.map(request => 
        this.executeFunction(
          request.function,
          request.parameters,
          { ...options, ...request.options }
        )
      );

      const results = await Promise.allSettled(promises);

      return {
        status: 'completed',
        results: results.map((result, index) => ({
          request: requests[index],
          result: result.status === 'fulfilled' ? result.value : result.reason,
          status: result.status
        })),
        totalExecutionTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Batch execution error:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get available functions and their metadata
   */
  getAvailableFunctions() {
    const functions = {};
    
    for (const [name, implementation] of Object.entries(this.registry)) {
      functions[name] = {
        name: name,
        implemented: implementation !== null,
        category: this.categorizeFunction(name),
        description: this.getFunctionDescription(name)
      };
    }

    return functions;
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics() {
    const cacheStats = this.cache.getStats();
    
    return {
      ...this.metrics,
      cacheSize: cacheStats.keys,
      cacheHitRate: this.metrics.totalCalls > 0 
        ? (this.metrics.cacheHits / this.metrics.totalCalls * 100).toFixed(2) + '%'
        : '0%',
      errorRate: this.metrics.totalCalls > 0
        ? (this.metrics.errors / this.metrics.totalCalls * 100).toFixed(2) + '%'
        : '0%',
      timestamp: new Date()
    };
  }

  /**
   * Clear cache for specific function or all
   */
  clearCache(functionName = null) {
    if (functionName) {
      const keys = this.cache.keys();
      keys.forEach(key => {
        if (key.startsWith(`${functionName}:`)) {
          this.cache.del(key);
        }
      });
    } else {
      this.cache.flushAll();
    }
    
    return { 
      status: 'success', 
      message: functionName 
        ? `Cache cleared for function: ${functionName}`
        : 'All cache cleared' 
    };
  }

  /**
   * Generate cache key from function name and parameters
   */
  generateCacheKey(functionName, parameters) {
    const paramString = JSON.stringify(parameters, Object.keys(parameters).sort());
    return `${functionName}:${Buffer.from(paramString).toString('base64')}`;
  }

  /**
   * Update execution metrics
   */
  updateMetrics(executionTime) {
    const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalCalls - 1);
    this.metrics.averageExecutionTime = (totalTime + executionTime) / this.metrics.totalCalls;
  }

  /**
   * Categorize function by type
   */
  categorizeFunction(functionName) {
    const categories = {
      'Options & Derivatives': ['black_scholes'],
      'Risk Analytics': ['monte_carlo', 'value_at_risk', 'var', 'expected_shortfall', 'cvar', 'maximum_drawdown'],
      'Portfolio Optimization': ['kelly_criterion'],
      'Performance Metrics': ['sharpe_ratio', 'sortino_ratio', 'treynor_ratio', 'information_ratio', 'calmar_ratio', 'omega_ratio'],
      'Statistical Analysis': ['correlation_matrix', 'pearson_correlation', 'temporal_correlations', 'clustering', 'regression', 'classification'],
      'Technical Analysis': ['technical_indicators'],
      'Time Series': ['time_series_analysis', 'forecast'],
      'Data Quality': ['outlier_detection']
    };

    for (const [category, functions] of Object.entries(categories)) {
      if (functions.includes(functionName)) {
        return category;
      }
    }

    return 'Uncategorized';
  }

  /**
   * Get function description
   */
  getFunctionDescription(functionName) {
    const descriptions = {
      'black_scholes': 'Option pricing using Black-Scholes model with Greeks',
      'monte_carlo': 'Monte Carlo simulation for risk and pricing analysis',
      'value_at_risk': 'Value at Risk calculation with multiple methods',
      'kelly_criterion': 'Optimal position sizing for portfolio growth',
      'sharpe_ratio': 'Risk-adjusted return performance metric',
      'correlation_matrix': 'Multi-asset correlation analysis',
      'technical_indicators': 'Comprehensive technical analysis indicators',
      'clustering': 'Data clustering for pattern recognition',
      'time_series_analysis': 'Time series decomposition and analysis',
      'outlier_detection': 'Statistical anomaly detection',
      'regression': 'Linear and non-linear regression analysis'
    };

    return descriptions[functionName] || 'Mathematical calculation function';
  }
}

// Create singleton instance
const orchestrator = new FunctionOrchestrator();

// Express middleware for API endpoints
export function orchestratorMiddleware(req, res) {
  const { function: functionName, parameters, options } = req.body;

  if (!functionName) {
    return res.status(400).json({
      error: 'Function name is required'
    });
  }

  orchestrator.executeFunction(functionName, parameters || {}, options || {})
    .then(result => res.json(result))
    .catch(error => res.status(500).json({
      error: error.message,
      function: functionName
    }));
}

// Batch processing endpoint
export function batchMiddleware(req, res) {
  const { requests, options } = req.body;

  if (!requests || !Array.isArray(requests)) {
    return res.status(400).json({
      error: 'Requests array is required'
    });
  }

  orchestrator.executeBatch(requests, options || {})
    .then(result => res.json(result))
    .catch(error => res.status(500).json({
      error: error.message
    }));
}

// Export the orchestrator instance
export default orchestrator;