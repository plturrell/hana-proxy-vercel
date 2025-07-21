/**
 * Real Mathematical Client for Intelligent Agents
 * Connects agents to the mathematical function orchestrator
 */

// For server-side agents
class MathematicalClient {
  constructor(baseUrl = process.env.FUNCTION_API_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.endpoint = `${baseUrl}/api/functions/calculate`;
  }

  /**
   * Call a mathematical function
   * @param {string} functionName - Name of the function to call
   * @param {Object} parameters - Function parameters
   * @param {Object} options - Additional options (e.g., skipCache)
   * @returns {Promise<Object>} Function result
   */
  async callFunction(functionName, parameters, options = {}) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: functionName,
          parameters: parameters,
          options: options
        })
      });

      if (!response.ok) {
        throw new Error(`Function call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle orchestrator errors
      if (result.status === 'error') {
        console.error(`Function ${functionName} error:`, result.error);
        return null;
      }

      return result;

    } catch (error) {
      console.error(`Math function ${functionName} failed:`, error);
      return null;
    }
  }

  /**
   * Call multiple functions in batch
   * @param {Array} requests - Array of function requests
   * @param {Object} options - Batch options
   * @returns {Promise<Object>} Batch results
   */
  async callBatch(requests, options = {}) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: requests,
          options: options
        })
      });

      if (!response.ok) {
        throw new Error(`Batch call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Batch function call failed:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Get available functions
   * @returns {Promise<Object>} Available functions and their metadata
   */
  async getAvailableFunctions() {
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to get functions: ${response.status}`);
      }

      const data = await response.json();
      return data.functions;

    } catch (error) {
      console.error('Failed to get available functions:', error);
      return {};
    }
  }
}

// For browser-based agents (if running in browser context)
class BrowserMathClient {
  constructor(baseUrl = '') {
    this.endpoint = `${baseUrl}/api/functions/calculate`;
  }

  async callFunction(functionName, parameters, options = {}) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: functionName,
          parameters: parameters,
          options: options
        })
      });

      const result = await response.json();
      
      if (result.status === 'error') {
        console.error(`Function ${functionName} error:`, result.error);
        return null;
      }

      return result;

    } catch (error) {
      console.error(`Math function ${functionName} failed:`, error);
      return null;
    }
  }
}

// Example usage in agents:

/**
 * Example: Market Data Agent using real math functions
 */
class MarketDataAgentExample {
  constructor() {
    this.mathClient = new MathematicalClient();
  }

  async analyzeMarketRisk(marketData) {
    // Calculate VaR using real function
    const varResult = await this.mathClient.callFunction('value_at_risk', {
      returns: marketData.returns,
      confidence_level: 0.95,
      method: 'historical'
    });

    // Calculate correlations
    const correlationResult = await this.mathClient.callFunction('correlation_matrix', {
      data_matrix: marketData.assetReturns,
      asset_names: marketData.assetNames
    });

    // Batch call for performance metrics
    const performanceMetrics = await this.mathClient.callBatch([
      {
        function: 'sharpe_ratio',
        parameters: { returns: marketData.returns }
      },
      {
        function: 'sortino_ratio',
        parameters: { returns: marketData.returns }
      },
      {
        function: 'maximum_drawdown',
        parameters: { returns: marketData.returns }
      }
    ]);

    return {
      risk: varResult,
      correlations: correlationResult,
      performance: performanceMetrics
    };
  }
}

/**
 * Example: Data Quality Agent using real math functions
 */
class DataQualityAgentExample {
  constructor() {
    this.mathClient = new MathematicalClient();
  }

  async validateData(data) {
    // Detect outliers
    const outlierResult = await this.mathClient.callFunction('outlier_detection', {
      data: data.values,
      method: 'isolation_forest',
      contamination: 0.05
    });

    // Time series analysis for patterns
    const timeSeriesResult = await this.mathClient.callFunction('time_series_analysis', {
      data: data.timeSeries,
      method: 'decomposition',
      frequency: 'daily'
    });

    // Statistical validation
    const correlationResult = await this.mathClient.callFunction('pearson_correlation', {
      x: data.expected,
      y: data.actual
    });

    return {
      outliers: outlierResult,
      patterns: timeSeriesResult,
      correlation: correlationResult,
      dataQuality: this.assessQuality(outlierResult, correlationResult)
    };
  }

  assessQuality(outliers, correlation) {
    const outlierRate = outliers?.outlier_rate || 0;
    const correlationScore = correlation?.correlation || 0;

    if (outlierRate < 0.05 && correlationScore > 0.9) {
      return 'Excellent';
    } else if (outlierRate < 0.1 && correlationScore > 0.7) {
      return 'Good';
    } else {
      return 'Needs Review';
    }
  }
}

/**
 * Example: Client Learning Agent using real math functions
 */
class ClientLearningAgentExample {
  constructor() {
    this.mathClient = new MathematicalClient();
  }

  async segmentUsers(userData) {
    // Cluster users based on behavior
    const clusteringResult = await this.mathClient.callFunction('clustering', {
      data: userData.features,
      method: 'kmeans',
      num_clusters: 5
    });

    // Predict user satisfaction
    const regressionResult = await this.mathClient.callFunction('regression', {
      features: userData.behaviorFeatures,
      target: userData.satisfactionScores,
      model: 'ridge',
      alpha: 0.1
    });

    // Analyze engagement patterns
    const timeSeriesResult = await this.mathClient.callFunction('time_series_analysis', {
      data: userData.engagementTimeline,
      method: 'forecast',
      forecast_periods: 7
    });

    return {
      segments: clusteringResult,
      satisfactionModel: regressionResult,
      engagementForecast: timeSeriesResult
    };
  }
}

// Export clients
export { MathematicalClient, BrowserMathClient };

// Export example usage
export default MathematicalClient;