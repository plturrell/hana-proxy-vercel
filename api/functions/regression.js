/**
 * Regression Analysis Function
 * Linear and non-linear regression for prediction and analysis
 * Used by multiple agents for predictive modeling
 */

/**
 * Main regression function
 * @param {Object} params - Regression parameters
 * @param {Array} params.features - Independent variables (X)
 * @param {Array} params.target - Dependent variable (y)
 * @param {string} params.model - Regression model type ('linear', 'polynomial', 'ridge', 'lasso', 'logistic')
 * @param {number} params.degree - Polynomial degree (for polynomial regression)
 * @param {number} params.alpha - Regularization parameter (for ridge/lasso)
 * @param {Array} params.predict_features - Features for prediction (optional)
 * @returns {Object} Regression results with coefficients and predictions
 */
export async function performRegression(params) {
  try {
    const {
      features,
      target,
      model = 'linear_regression',
      degree = 2,
      alpha = 1.0,
      predict_features = null
    } = params;

    // Validate inputs
    if (!features || !Array.isArray(features) || features.length === 0) {
      throw new Error('Valid features array is required');
    }
    
    if (!target || !Array.isArray(target) || target.length === 0) {
      throw new Error('Valid target array is required');
    }
    
    if (features.length !== target.length) {
      throw new Error('Features and target must have the same length');
    }

    // Convert features to 2D array if needed
    const X = Array.isArray(features[0]) ? features : features.map(x => [x]);
    const y = target;

    let result = {
      status: 'success',
      model: model,
      n_samples: X.length,
      n_features: X[0].length
    };

    // Perform regression based on model type
    switch (model.toLowerCase()) {
      case 'linear':
      case 'linear_regression':
        result = { ...result, ...performLinearRegression(X, y, predict_features) };
        break;
      
      case 'polynomial':
      case 'polynomial_regression':
        result = { ...result, ...performPolynomialRegression(X, y, degree, predict_features) };
        break;
      
      case 'ridge':
      case 'ridge_regression':
        result = { ...result, ...performRidgeRegression(X, y, alpha, predict_features) };
        break;
      
      case 'lasso':
      case 'lasso_regression':
        result = { ...result, ...performLassoRegression(X, y, alpha, predict_features) };
        break;
      
      case 'logistic':
      case 'logistic_regression':
        result = { ...result, ...performLogisticRegression(X, y, predict_features) };
        break;
      
      default:
        throw new Error(`Unknown regression model: ${model}`);
    }

    // Add model evaluation metrics
    result.metrics = evaluateRegression(y, result.fitted_values, X[0].length);
    
    // Add feature importance (for linear models)
    if (result.coefficients) {
      result.feature_importance = calculateFeatureImportance(result.coefficients, X, y);
    }

    // Add interpretation
    result.interpretation = interpretRegressionResults(result);
    result.timestamp = new Date();

    return result;

  } catch (error) {
    console.error('Regression error:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date()
    };
  }
}

/**
 * Ordinary Least Squares Linear Regression
 */
function performLinearRegression(X, y, predictFeatures) {
  const n = X.length;
  const p = X[0].length;
  
  // Add intercept term
  const X_with_intercept = X.map(row => [1, ...row]);
  
  // Calculate X'X
  const XtX = matrixMultiply(transpose(X_with_intercept), X_with_intercept);
  
  // Calculate X'y
  const Xty = matrixVectorMultiply(transpose(X_with_intercept), y);
  
  // Solve for coefficients: beta = (X'X)^(-1) * X'y
  const XtX_inv = invertMatrix(XtX);
  if (!XtX_inv) {
    throw new Error('Matrix is singular, cannot compute inverse');
  }
  
  const coefficients = matrixVectorMultiply(XtX_inv, Xty);
  
  // Calculate fitted values
  const fittedValues = X_with_intercept.map(row => 
    row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
  );
  
  // Calculate residuals
  const residuals = y.map((val, i) => val - fittedValues[i]);
  
  // Calculate standard errors
  const residualSumSquares = residuals.reduce((sum, r) => sum + r * r, 0);
  const sigma2 = residualSumSquares / (n - p - 1);
  const standardErrors = XtX_inv.map((row, i) => Math.sqrt(sigma2 * XtX_inv[i][i]));
  
  // Calculate t-statistics and p-values
  const tStatistics = coefficients.map((coef, i) => coef / standardErrors[i]);
  const pValues = tStatistics.map(t => 2 * (1 - tDistributionCDF(Math.abs(t), n - p - 1)));
  
  // Make predictions if requested
  let predictions = null;
  if (predictFeatures) {
    const X_pred = Array.isArray(predictFeatures[0]) ? predictFeatures : predictFeatures.map(x => [x]);
    const X_pred_with_intercept = X_pred.map(row => [1, ...row]);
    predictions = X_pred_with_intercept.map(row => 
      row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
    );
  }
  
  return {
    coefficients: coefficients.slice(1), // Exclude intercept for main coefficients
    intercept: coefficients[0],
    fitted_values: fittedValues,
    residuals: residuals,
    standard_errors: standardErrors.slice(1),
    t_statistics: tStatistics.slice(1),
    p_values: pValues.slice(1),
    predictions: predictions,
    model_summary: {
      coefficients_with_intercept: coefficients,
      degrees_of_freedom: n - p - 1,
      residual_standard_error: Math.sqrt(sigma2)
    }
  };
}

/**
 * Polynomial Regression
 */
function performPolynomialRegression(X, y, degree, predictFeatures) {
  // Transform features to polynomial features
  const X_poly = createPolynomialFeatures(X, degree);
  
  // Perform linear regression on polynomial features
  const result = performLinearRegression(X_poly, y, 
    predictFeatures ? createPolynomialFeatures(
      Array.isArray(predictFeatures[0]) ? predictFeatures : predictFeatures.map(x => [x]), 
      degree
    ) : null
  );
  
  result.polynomial_degree = degree;
  result.n_polynomial_features = X_poly[0].length;
  
  return result;
}

/**
 * Ridge Regression (L2 regularization)
 */
function performRidgeRegression(X, y, alpha, predictFeatures) {
  const n = X.length;
  const p = X[0].length;
  
  // Add intercept term
  const X_with_intercept = X.map(row => [1, ...row]);
  
  // Calculate X'X
  const XtX = matrixMultiply(transpose(X_with_intercept), X_with_intercept);
  
  // Add ridge penalty (except for intercept)
  for (let i = 1; i <= p; i++) {
    XtX[i][i] += alpha;
  }
  
  // Calculate X'y
  const Xty = matrixVectorMultiply(transpose(X_with_intercept), y);
  
  // Solve for coefficients
  const XtX_inv = invertMatrix(XtX);
  if (!XtX_inv) {
    throw new Error('Matrix is singular even with ridge penalty');
  }
  
  const coefficients = matrixVectorMultiply(XtX_inv, Xty);
  
  // Calculate fitted values
  const fittedValues = X_with_intercept.map(row => 
    row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
  );
  
  // Calculate residuals
  const residuals = y.map((val, i) => val - fittedValues[i]);
  
  // Make predictions if requested
  let predictions = null;
  if (predictFeatures) {
    const X_pred = Array.isArray(predictFeatures[0]) ? predictFeatures : predictFeatures.map(x => [x]);
    const X_pred_with_intercept = X_pred.map(row => [1, ...row]);
    predictions = X_pred_with_intercept.map(row => 
      row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
    );
  }
  
  return {
    coefficients: coefficients.slice(1),
    intercept: coefficients[0],
    fitted_values: fittedValues,
    residuals: residuals,
    predictions: predictions,
    regularization_parameter: alpha,
    model_type: 'Ridge Regression',
    l2_norm: coefficients.slice(1).reduce((sum, c) => sum + c * c, 0)
  };
}

/**
 * Lasso Regression (L1 regularization) - Simplified coordinate descent
 */
function performLassoRegression(X, y, alpha, predictFeatures) {
  const n = X.length;
  const p = X[0].length;
  const maxIterations = 1000;
  const tolerance = 1e-4;
  
  // Standardize features
  const { X_scaled, X_mean, X_std } = standardizeFeatures(X);
  const y_mean = y.reduce((sum, val) => sum + val, 0) / n;
  const y_centered = y.map(val => val - y_mean);
  
  // Initialize coefficients
  let coefficients = new Array(p).fill(0);
  let intercept = 0;
  
  // Coordinate descent
  for (let iter = 0; iter < maxIterations; iter++) {
    const oldCoefficients = [...coefficients];
    
    // Update each coefficient
    for (let j = 0; j < p; j++) {
      let rho = 0;
      for (let i = 0; i < n; i++) {
        let prediction = 0;
        for (let k = 0; k < p; k++) {
          if (k !== j) {
            prediction += X_scaled[i][k] * coefficients[k];
          }
        }
        rho += X_scaled[i][j] * (y_centered[i] - prediction);
      }
      rho /= n;
      
      // Soft thresholding
      if (rho > alpha) {
        coefficients[j] = rho - alpha;
      } else if (rho < -alpha) {
        coefficients[j] = rho + alpha;
      } else {
        coefficients[j] = 0;
      }
    }
    
    // Check convergence
    const change = coefficients.reduce((sum, c, i) => 
      sum + Math.abs(c - oldCoefficients[i]), 0
    );
    if (change < tolerance) break;
  }
  
  // Transform coefficients back to original scale
  const originalCoefficients = coefficients.map((c, i) => c / X_std[i]);
  intercept = y_mean - originalCoefficients.reduce((sum, c, i) => 
    sum + c * X_mean[i], 0
  );
  
  // Calculate fitted values
  const fittedValues = X.map(row => 
    intercept + row.reduce((sum, val, i) => sum + val * originalCoefficients[i], 0)
  );
  
  // Calculate residuals
  const residuals = y.map((val, i) => val - fittedValues[i]);
  
  // Make predictions if requested
  let predictions = null;
  if (predictFeatures) {
    const X_pred = Array.isArray(predictFeatures[0]) ? predictFeatures : predictFeatures.map(x => [x]);
    predictions = X_pred.map(row => 
      intercept + row.reduce((sum, val, i) => sum + val * originalCoefficients[i], 0)
    );
  }
  
  // Count non-zero coefficients
  const nonZeroCoefficients = originalCoefficients.filter(c => Math.abs(c) > 1e-6).length;
  
  return {
    coefficients: originalCoefficients,
    intercept: intercept,
    fitted_values: fittedValues,
    residuals: residuals,
    predictions: predictions,
    regularization_parameter: alpha,
    model_type: 'Lasso Regression',
    l1_norm: originalCoefficients.reduce((sum, c) => sum + Math.abs(c), 0),
    non_zero_coefficients: nonZeroCoefficients,
    sparsity: (p - nonZeroCoefficients) / p
  };
}

/**
 * Logistic Regression for classification
 */
function performLogisticRegression(X, y, predictFeatures) {
  const n = X.length;
  const p = X[0].length;
  const maxIterations = 100;
  const learningRate = 0.1;
  
  // Add intercept term
  const X_with_intercept = X.map(row => [1, ...row]);
  
  // Initialize coefficients
  let coefficients = new Array(p + 1).fill(0);
  
  // Gradient descent
  for (let iter = 0; iter < maxIterations; iter++) {
    // Calculate predictions
    const logits = X_with_intercept.map(row => 
      row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
    );
    const predictions = logits.map(logit => sigmoid(logit));
    
    // Calculate gradients
    const gradients = new Array(p + 1).fill(0);
    for (let j = 0; j <= p; j++) {
      for (let i = 0; i < n; i++) {
        gradients[j] += X_with_intercept[i][j] * (predictions[i] - y[i]);
      }
      gradients[j] /= n;
    }
    
    // Update coefficients
    for (let j = 0; j <= p; j++) {
      coefficients[j] -= learningRate * gradients[j];
    }
    
    // Check convergence
    const gradientNorm = Math.sqrt(gradients.reduce((sum, g) => sum + g * g, 0));
    if (gradientNorm < 1e-4) break;
  }
  
  // Calculate final predictions
  const fittedLogits = X_with_intercept.map(row => 
    row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
  );
  const fittedProbabilities = fittedLogits.map(logit => sigmoid(logit));
  const fittedClasses = fittedProbabilities.map(p => p >= 0.5 ? 1 : 0);
  
  // Calculate log-likelihood
  const logLikelihood = y.reduce((sum, yi, i) => {
    const pi = fittedProbabilities[i];
    return sum + yi * Math.log(pi + 1e-10) + (1 - yi) * Math.log(1 - pi + 1e-10);
  }, 0);
  
  // Make predictions if requested
  let predictions = null;
  let predictedProbabilities = null;
  if (predictFeatures) {
    const X_pred = Array.isArray(predictFeatures[0]) ? predictFeatures : predictFeatures.map(x => [x]);
    const X_pred_with_intercept = X_pred.map(row => [1, ...row]);
    const predLogits = X_pred_with_intercept.map(row => 
      row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
    );
    predictedProbabilities = predLogits.map(logit => sigmoid(logit));
    predictions = predictedProbabilities.map(p => p >= 0.5 ? 1 : 0);
  }
  
  return {
    coefficients: coefficients.slice(1),
    intercept: coefficients[0],
    fitted_probabilities: fittedProbabilities,
    fitted_classes: fittedClasses,
    predictions: predictions,
    predicted_probabilities: predictedProbabilities,
    log_likelihood: logLikelihood,
    model_type: 'Logistic Regression',
    classification_accuracy: fittedClasses.filter((pred, i) => pred === y[i]).length / n
  };
}

// Helper functions

function matrixMultiply(A, B) {
  const m = A.length;
  const n = A[0].length;
  const p = B[0].length;
  
  const C = Array(m).fill(null).map(() => Array(p).fill(0));
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < n; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  
  return C;
}

function matrixVectorMultiply(A, b) {
  return A.map(row => row.reduce((sum, val, i) => sum + val * b[i], 0));
}

function transpose(A) {
  const m = A.length;
  const n = A[0].length;
  const At = Array(n).fill(null).map(() => Array(m).fill(0));
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      At[j][i] = A[i][j];
    }
  }
  
  return At;
}

function invertMatrix(A) {
  const n = A.length;
  
  // Create augmented matrix [A | I]
  const augmented = A.map((row, i) => 
    [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]
  );
  
  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      return null;
    }
    
    // Scale pivot row
    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  // Extract inverse from augmented matrix
  return augmented.map(row => row.slice(n));
}

function createPolynomialFeatures(X, degree) {
  const n = X.length;
  const p = X[0].length;
  const polyFeatures = [];
  
  for (let i = 0; i < n; i++) {
    const features = [];
    
    // Add original features
    features.push(...X[i]);
    
    // Add polynomial terms
    for (let d = 2; d <= degree; d++) {
      for (let j = 0; j < p; j++) {
        features.push(Math.pow(X[i][j], d));
      }
      
      // Add interaction terms for degree 2
      if (d === 2 && p > 1) {
        for (let j = 0; j < p - 1; j++) {
          for (let k = j + 1; k < p; k++) {
            features.push(X[i][j] * X[i][k]);
          }
        }
      }
    }
    
    polyFeatures.push(features);
  }
  
  return polyFeatures;
}

function standardizeFeatures(X) {
  const n = X.length;
  const p = X[0].length;
  
  const X_mean = new Array(p).fill(0);
  const X_std = new Array(p).fill(0);
  
  // Calculate means
  for (let j = 0; j < p; j++) {
    for (let i = 0; i < n; i++) {
      X_mean[j] += X[i][j];
    }
    X_mean[j] /= n;
  }
  
  // Calculate standard deviations
  for (let j = 0; j < p; j++) {
    for (let i = 0; i < n; i++) {
      X_std[j] += Math.pow(X[i][j] - X_mean[j], 2);
    }
    X_std[j] = Math.sqrt(X_std[j] / (n - 1));
    if (X_std[j] === 0) X_std[j] = 1; // Avoid division by zero
  }
  
  // Standardize
  const X_scaled = X.map(row => 
    row.map((val, j) => (val - X_mean[j]) / X_std[j])
  );
  
  return { X_scaled, X_mean, X_std };
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function tDistributionCDF(t, df) {
  // Simplified approximation for t-distribution CDF
  // In practice, use a statistical library
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;
  
  // Beta distribution approximation
  return 0.5 + 0.5 * Math.sign(t) * (1 - incompleteBeta(x, a, b));
}

function incompleteBeta(x, a, b) {
  // Simplified approximation
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  
  // For small a and b, use series expansion
  let sum = 0;
  let term = 1;
  for (let n = 0; n < 50; n++) {
    sum += term;
    term *= x * (a + n) / (n + 1);
    if (Math.abs(term) < 1e-10) break;
  }
  
  return Math.pow(x, a) * sum;
}

function evaluateRegression(yTrue, yPred, nFeatures) {
  const n = yTrue.length;
  
  // Mean Squared Error
  const mse = yTrue.reduce((sum, y, i) => sum + Math.pow(y - yPred[i], 2), 0) / n;
  
  // Root Mean Squared Error
  const rmse = Math.sqrt(mse);
  
  // Mean Absolute Error
  const mae = yTrue.reduce((sum, y, i) => sum + Math.abs(y - yPred[i]), 0) / n;
  
  // R-squared
  const yMean = yTrue.reduce((sum, y) => sum + y, 0) / n;
  const ssTotal = yTrue.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = yTrue.reduce((sum, y, i) => sum + Math.pow(y - yPred[i], 2), 0);
  const r2 = 1 - ssResidual / ssTotal;
  
  // Adjusted R-squared
  const adjR2 = 1 - (1 - r2) * (n - 1) / (n - nFeatures - 1);
  
  // Mean Absolute Percentage Error (if no zeros in yTrue)
  let mape = null;
  if (yTrue.every(y => Math.abs(y) > 1e-6)) {
    mape = yTrue.reduce((sum, y, i) => sum + Math.abs((y - yPred[i]) / y), 0) / n * 100;
  }
  
  return {
    mse,
    rmse,
    mae,
    r2,
    adjusted_r2: adjR2,
    mape
  };
}

function calculateFeatureImportance(coefficients, X, y) {
  // Calculate standardized coefficients for importance
  const p = X[0].length;
  const importance = [];
  
  // Calculate standard deviations
  const { X_std } = standardizeFeatures(X);
  const yStd = Math.sqrt(
    y.reduce((sum, val) => sum + Math.pow(val - y.reduce((a, b) => a + b, 0) / y.length, 2), 0) / (y.length - 1)
  );
  
  // Standardized coefficients
  for (let i = 0; i < p; i++) {
    const stdCoef = Math.abs(coefficients[i]) * X_std[i] / yStd;
    importance.push({
      feature: `Feature_${i + 1}`,
      coefficient: coefficients[i],
      standardized_coefficient: stdCoef,
      importance_score: stdCoef,
      rank: 0
    });
  }
  
  // Rank features
  importance.sort((a, b) => b.importance_score - a.importance_score);
  importance.forEach((feat, i) => feat.rank = i + 1);
  
  return importance;
}

function interpretRegressionResults(result) {
  let interpretation = '';
  
  // Model fit interpretation
  if (result.metrics) {
    const r2 = result.metrics.r2;
    if (r2 > 0.9) {
      interpretation += 'Excellent model fit. ';
    } else if (r2 > 0.7) {
      interpretation += 'Good model fit. ';
    } else if (r2 > 0.5) {
      interpretation += 'Moderate model fit. ';
    } else {
      interpretation += 'Poor model fit. ';
    }
    interpretation += `The model explains ${(r2 * 100).toFixed(1)}% of the variance. `;
  }
  
  // Feature importance
  if (result.feature_importance && result.feature_importance.length > 0) {
    const topFeature = result.feature_importance[0];
    interpretation += `${topFeature.feature} is the most important predictor. `;
  }
  
  // Regularization interpretation
  if (result.model_type === 'Lasso Regression' && result.sparsity) {
    interpretation += `Lasso selected ${result.non_zero_coefficients} features (${((1 - result.sparsity) * 100).toFixed(1)}% of total). `;
  }
  
  // Classification accuracy
  if (result.classification_accuracy !== undefined) {
    interpretation += `Classification accuracy: ${(result.classification_accuracy * 100).toFixed(1)}%. `;
  }
  
  return interpretation.trim();
}

// Export functions
export { performRegression as calculateRegression };