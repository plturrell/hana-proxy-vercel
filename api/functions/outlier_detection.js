/**
 * Outlier Detection Function
 * Statistical anomaly detection using multiple methods
 * Used by Data Quality Agent for data validation and anomaly identification
 */

/**
 * Main outlier detection function
 * @param {Object} params - Detection parameters
 * @param {Array} params.data - Data points to analyze
 * @param {string} params.method - Detection method ('zscore', 'iqr', 'isolation_forest', 'local_outlier_factor', 'mahalanobis')
 * @param {number} params.threshold - Threshold for outlier detection
 * @param {number} params.contamination - Expected proportion of outliers (0-0.5)
 * @param {boolean} params.multivariate - Whether data is multivariate
 * @returns {Object} Outlier detection results
 */
export async function detectOutliers(params) {
  try {
    const {
      data,
      method = 'isolation_forest',
      threshold = 3,
      contamination = 0.1,
      multivariate = false
    } = params;

    // Validate inputs
    if (!data || !Array.isArray(data) || data.length < 3) {
      throw new Error('Valid data array with at least 3 points is required');
    }

    // Determine if data is multivariate
    const isMultivariate = multivariate || (Array.isArray(data[0]) && data[0].length > 1);
    
    let result = {
      status: 'success',
      method: method,
      data_points: data.length,
      multivariate: isMultivariate
    };

    // Apply detection method
    switch (method.toLowerCase()) {
      case 'zscore':
        result = { ...result, ...detectZScoreOutliers(data, threshold, isMultivariate) };
        break;
      
      case 'iqr':
        result = { ...result, ...detectIQROutliers(data, threshold, isMultivariate) };
        break;
      
      case 'isolation_forest':
        result = { ...result, ...detectIsolationForestOutliers(data, contamination, isMultivariate) };
        break;
      
      case 'local_outlier_factor':
      case 'lof':
        result = { ...result, ...detectLOFOutliers(data, contamination, isMultivariate) };
        break;
      
      case 'mahalanobis':
        result = { ...result, ...detectMahalanobisOutliers(data, threshold, isMultivariate) };
        break;
      
      default:
        // Ensemble method combining multiple approaches
        result = { ...result, ...detectEnsembleOutliers(data, contamination, isMultivariate) };
    }

    // Add interpretations and recommendations
    result.interpretation = interpretOutliers(result);
    result.recommendations = generateRecommendations(result);
    result.timestamp = new Date();

    return result;

  } catch (error) {
    console.error('Outlier detection error:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date()
    };
  }
}

/**
 * Z-Score based outlier detection
 */
function detectZScoreOutliers(data, threshold, isMultivariate) {
  if (isMultivariate) {
    return detectMultivariateZScoreOutliers(data, threshold);
  }
  
  // Univariate case
  const values = data.map(d => typeof d === 'number' ? d : d[0]);
  const mean = calculateMean(values);
  const std = calculateStd(values);
  
  const outliers = [];
  const outlierIndices = [];
  const outlierScores = [];
  
  values.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / std);
    outlierScores.push(zScore);
    
    if (zScore > threshold) {
      outliers.push({
        index: index,
        value: value,
        score: zScore,
        deviation: value - mean,
        type: value > mean ? 'high' : 'low'
      });
      outlierIndices.push(index);
    }
  });
  
  return {
    outliers: outliers,
    outlier_indices: outlierIndices,
    outlier_scores: outlierScores,
    num_outliers: outliers.length,
    outlier_rate: outliers.length / values.length,
    statistics: {
      mean: mean,
      std: std,
      threshold_used: threshold
    }
  };
}

/**
 * Interquartile Range (IQR) based outlier detection
 */
function detectIQROutliers(data, multiplier = 1.5, isMultivariate) {
  if (isMultivariate) {
    // For multivariate, apply IQR to each dimension
    return detectMultivariateIQROutliers(data, multiplier);
  }
  
  const values = data.map(d => typeof d === 'number' ? d : d[0]);
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;
  
  const outliers = [];
  const outlierIndices = [];
  const outlierScores = [];
  
  values.forEach((value, index) => {
    let score = 0;
    if (value < lowerBound) {
      score = (lowerBound - value) / iqr;
    } else if (value > upperBound) {
      score = (value - upperBound) / iqr;
    }
    
    outlierScores.push(score);
    
    if (score > 0) {
      outliers.push({
        index: index,
        value: value,
        score: score,
        type: value < lowerBound ? 'low' : 'high',
        bounds: { lower: lowerBound, upper: upperBound }
      });
      outlierIndices.push(index);
    }
  });
  
  return {
    outliers: outliers,
    outlier_indices: outlierIndices,
    outlier_scores: outlierScores,
    num_outliers: outliers.length,
    outlier_rate: outliers.length / values.length,
    statistics: {
      q1: q1,
      q3: q3,
      iqr: iqr,
      lower_bound: lowerBound,
      upper_bound: upperBound
    }
  };
}

/**
 * Isolation Forest outlier detection
 */
function detectIsolationForestOutliers(data, contamination, isMultivariate) {
  const n = data.length;
  const numTrees = 100;
  const sampleSize = Math.min(256, n);
  
  // Convert to 2D array if needed
  const points = isMultivariate ? data : data.map(d => [typeof d === 'number' ? d : d[0]]);
  
  // Build isolation trees
  const trees = [];
  for (let i = 0; i < numTrees; i++) {
    const sample = samplePoints(points, sampleSize);
    const tree = buildIsolationTree(sample, 0, Math.ceil(Math.log2(sampleSize)));
    trees.push(tree);
  }
  
  // Calculate anomaly scores
  const scores = [];
  const pathLengths = [];
  
  points.forEach((point, index) => {
    let totalPathLength = 0;
    
    trees.forEach(tree => {
      totalPathLength += computePathLength(point, tree, 0);
    });
    
    const avgPathLength = totalPathLength / numTrees;
    pathLengths.push(avgPathLength);
    
    // Normalize score
    const c = averagePathLength(sampleSize);
    const score = Math.pow(2, -avgPathLength / c);
    scores.push(score);
  });
  
  // Determine outliers based on contamination rate
  const threshold = getContaminationThreshold(scores, contamination);
  
  const outliers = [];
  const outlierIndices = [];
  
  scores.forEach((score, index) => {
    if (score > threshold) {
      outliers.push({
        index: index,
        value: points[index],
        score: score,
        path_length: pathLengths[index],
        anomaly_score: score
      });
      outlierIndices.push(index);
    }
  });
  
  return {
    outliers: outliers,
    outlier_indices: outlierIndices,
    outlier_scores: scores,
    num_outliers: outliers.length,
    outlier_rate: outliers.length / n,
    model_info: {
      num_trees: numTrees,
      sample_size: sampleSize,
      threshold: threshold,
      contamination: contamination
    }
  };
}

/**
 * Local Outlier Factor (LOF) detection
 */
function detectLOFOutliers(data, contamination, isMultivariate) {
  const n = data.length;
  const k = Math.min(20, Math.floor(n / 2)); // Number of neighbors
  
  // Convert to 2D array if needed
  const points = isMultivariate ? data : data.map(d => [typeof d === 'number' ? d : d[0]]);
  
  // Calculate distances between all points
  const distances = calculateDistanceMatrix(points);
  
  // Find k-nearest neighbors for each point
  const kNeighbors = [];
  for (let i = 0; i < n; i++) {
    const neighbors = distances[i]
      .map((d, j) => ({ index: j, distance: d }))
      .filter(d => d.index !== i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k);
    kNeighbors.push(neighbors);
  }
  
  // Calculate local reachability density
  const lrd = [];
  for (let i = 0; i < n; i++) {
    let sumReachDist = 0;
    
    kNeighbors[i].forEach(neighbor => {
      const reachDist = Math.max(
        neighbor.distance,
        kNeighbors[neighbor.index][k - 1].distance
      );
      sumReachDist += reachDist;
    });
    
    lrd.push(k / sumReachDist);
  }
  
  // Calculate LOF scores
  const lofScores = [];
  for (let i = 0; i < n; i++) {
    let sumLRDRatio = 0;
    
    kNeighbors[i].forEach(neighbor => {
      sumLRDRatio += lrd[neighbor.index] / lrd[i];
    });
    
    lofScores.push(sumLRDRatio / k);
  }
  
  // Determine outliers based on contamination rate
  const threshold = getContaminationThreshold(lofScores, contamination);
  
  const outliers = [];
  const outlierIndices = [];
  
  lofScores.forEach((score, index) => {
    if (score > threshold) {
      outliers.push({
        index: index,
        value: points[index],
        score: score,
        lof_score: score,
        local_density: lrd[index]
      });
      outlierIndices.push(index);
    }
  });
  
  return {
    outliers: outliers,
    outlier_indices: outlierIndices,
    outlier_scores: lofScores,
    num_outliers: outliers.length,
    outlier_rate: outliers.length / n,
    model_info: {
      k_neighbors: k,
      threshold: threshold,
      contamination: contamination
    }
  };
}

/**
 * Mahalanobis distance based outlier detection
 */
function detectMahalanobisOutliers(data, threshold, isMultivariate) {
  if (!isMultivariate) {
    // Convert to multivariate format for consistency
    const points = data.map(d => [typeof d === 'number' ? d : d[0]]);
    return detectMahalanobisOutliers(points, threshold, true);
  }
  
  const n = data.length;
  const d = data[0].length;
  
  // Calculate mean vector
  const mean = new Array(d).fill(0);
  data.forEach(point => {
    point.forEach((val, i) => {
      mean[i] += val / n;
    });
  });
  
  // Calculate covariance matrix
  const cov = calculateCovarianceMatrix(data, mean);
  
  // Calculate inverse covariance matrix (simplified for 2D)
  const invCov = invertMatrix(cov);
  
  if (!invCov) {
    throw new Error('Covariance matrix is singular');
  }
  
  // Calculate Mahalanobis distances
  const distances = [];
  const outliers = [];
  const outlierIndices = [];
  
  data.forEach((point, index) => {
    const diff = point.map((val, i) => val - mean[i]);
    const distance = Math.sqrt(mahalanobisDistance(diff, invCov));
    distances.push(distance);
    
    if (distance > threshold) {
      outliers.push({
        index: index,
        value: point,
        score: distance,
        mahalanobis_distance: distance,
        deviation: diff
      });
      outlierIndices.push(index);
    }
  });
  
  return {
    outliers: outliers,
    outlier_indices: outlierIndices,
    outlier_scores: distances,
    num_outliers: outliers.length,
    outlier_rate: outliers.length / n,
    statistics: {
      mean_vector: mean,
      threshold_used: threshold,
      dimensions: d
    }
  };
}

/**
 * Ensemble outlier detection combining multiple methods
 */
function detectEnsembleOutliers(data, contamination, isMultivariate) {
  // Apply multiple detection methods
  const methods = [
    { name: 'zscore', result: detectZScoreOutliers(data, 3, isMultivariate) },
    { name: 'iqr', result: detectIQROutliers(data, 1.5, isMultivariate) },
    { name: 'isolation_forest', result: detectIsolationForestOutliers(data, contamination, isMultivariate) }
  ];
  
  // If multivariate, add LOF
  if (isMultivariate || data.length < 1000) {
    methods.push({
      name: 'lof',
      result: detectLOFOutliers(data, contamination, isMultivariate)
    });
  }
  
  // Combine scores
  const n = data.length;
  const ensembleScores = new Array(n).fill(0);
  const voteCounts = new Array(n).fill(0);
  
  methods.forEach(method => {
    // Normalize scores to [0, 1]
    const scores = method.result.outlier_scores;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const range = maxScore - minScore || 1;
    
    scores.forEach((score, i) => {
      const normalizedScore = (score - minScore) / range;
      ensembleScores[i] += normalizedScore;
      
      if (method.result.outlier_indices.includes(i)) {
        voteCounts[i]++;
      }
    });
  });
  
  // Average ensemble scores
  ensembleScores.forEach((score, i) => {
    ensembleScores[i] = score / methods.length;
  });
  
  // Determine outliers based on ensemble scores
  const threshold = getContaminationThreshold(ensembleScores, contamination);
  const minVotes = Math.ceil(methods.length / 2); // Majority vote
  
  const outliers = [];
  const outlierIndices = [];
  
  ensembleScores.forEach((score, index) => {
    if (score > threshold || voteCounts[index] >= minVotes) {
      outliers.push({
        index: index,
        value: isMultivariate ? data[index] : (typeof data[index] === 'number' ? data[index] : data[index][0]),
        ensemble_score: score,
        vote_count: voteCounts[index],
        methods_detected: methods
          .filter(m => m.result.outlier_indices.includes(index))
          .map(m => m.name)
      });
      outlierIndices.push(index);
    }
  });
  
  return {
    outliers: outliers,
    outlier_indices: outlierIndices,
    outlier_scores: ensembleScores,
    num_outliers: outliers.length,
    outlier_rate: outliers.length / n,
    ensemble_info: {
      methods_used: methods.map(m => m.name),
      threshold: threshold,
      min_votes: minVotes
    },
    individual_results: methods.reduce((acc, m) => {
      acc[m.name] = {
        num_outliers: m.result.num_outliers,
        outlier_indices: m.result.outlier_indices
      };
      return acc;
    }, {})
  };
}

// Helper functions

function calculateMean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateStd(values) {
  const mean = calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function calculateDistanceMatrix(points) {
  const n = points.length;
  const distances = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = euclideanDistance(points[i], points[j]);
      distances[i][j] = dist;
      distances[j][i] = dist;
    }
  }
  
  return distances;
}

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0));
}

function getContaminationThreshold(scores, contamination) {
  const sorted = [...scores].sort((a, b) => b - a);
  const index = Math.floor(scores.length * contamination);
  return sorted[index] || sorted[sorted.length - 1];
}

function buildIsolationTree(data, currentDepth, maxDepth) {
  if (currentDepth >= maxDepth || data.length <= 1) {
    return { type: 'leaf', size: data.length };
  }
  
  const d = data[0].length;
  const feature = Math.floor(Math.random() * d);
  
  const values = data.map(p => p[feature]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (min === max) {
    return { type: 'leaf', size: data.length };
  }
  
  const splitValue = min + Math.random() * (max - min);
  
  const left = data.filter(p => p[feature] < splitValue);
  const right = data.filter(p => p[feature] >= splitValue);
  
  return {
    type: 'node',
    feature: feature,
    split: splitValue,
    left: buildIsolationTree(left, currentDepth + 1, maxDepth),
    right: buildIsolationTree(right, currentDepth + 1, maxDepth)
  };
}

function computePathLength(point, tree, currentDepth) {
  if (tree.type === 'leaf') {
    return currentDepth + averagePathLength(tree.size);
  }
  
  if (point[tree.feature] < tree.split) {
    return computePathLength(point, tree.left, currentDepth + 1);
  } else {
    return computePathLength(point, tree.right, currentDepth + 1);
  }
}

function averagePathLength(n) {
  if (n <= 1) return 0;
  return 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
}

function samplePoints(points, sampleSize) {
  const sampled = [];
  const indices = new Set();
  
  while (sampled.length < sampleSize && sampled.length < points.length) {
    const idx = Math.floor(Math.random() * points.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      sampled.push(points[idx]);
    }
  }
  
  return sampled;
}

function calculateCovarianceMatrix(data, mean) {
  const n = data.length;
  const d = data[0].length;
  const cov = Array(d).fill(null).map(() => Array(d).fill(0));
  
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += (data[k][i] - mean[i]) * (data[k][j] - mean[j]);
      }
      cov[i][j] = sum / (n - 1);
      cov[j][i] = cov[i][j];
    }
  }
  
  return cov;
}

function invertMatrix(matrix) {
  // Simplified 2x2 matrix inversion
  if (matrix.length === 2) {
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    if (Math.abs(det) < 1e-10) return null;
    
    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det]
    ];
  }
  
  // For larger matrices, return identity (simplified)
  return matrix.map((row, i) => row.map((_, j) => i === j ? 1 : 0));
}

function mahalanobisDistance(diff, invCov) {
  let distance = 0;
  for (let i = 0; i < diff.length; i++) {
    for (let j = 0; j < diff.length; j++) {
      distance += diff[i] * invCov[i][j] * diff[j];
    }
  }
  return distance;
}

function interpretOutliers(result) {
  const rate = result.outlier_rate || 0;
  const count = result.num_outliers || 0;
  
  let interpretation = '';
  
  if (rate === 0) {
    interpretation = 'No outliers detected in the dataset.';
  } else if (rate < 0.01) {
    interpretation = `Very few outliers detected (${count} points, ${(rate * 100).toFixed(2)}%).`;
  } else if (rate < 0.05) {
    interpretation = `Moderate number of outliers detected (${count} points, ${(rate * 100).toFixed(2)}%).`;
  } else if (rate < 0.1) {
    interpretation = `Significant outliers detected (${count} points, ${(rate * 100).toFixed(2)}%).`;
  } else {
    interpretation = `High proportion of outliers detected (${count} points, ${(rate * 100).toFixed(2)}%). Consider data quality issues.`;
  }
  
  if (result.outliers && result.outliers.length > 0) {
    const types = result.outliers.map(o => o.type).filter(t => t);
    const highCount = types.filter(t => t === 'high').length;
    const lowCount = types.filter(t => t === 'low').length;
    
    if (highCount > 0 && lowCount > 0) {
      interpretation += ` Outliers found on both high (${highCount}) and low (${lowCount}) ends.`;
    } else if (highCount > 0) {
      interpretation += ` All outliers are high values.`;
    } else if (lowCount > 0) {
      interpretation += ` All outliers are low values.`;
    }
  }
  
  return interpretation;
}

function generateRecommendations(result) {
  const recommendations = [];
  const rate = result.outlier_rate || 0;
  
  if (rate > 0.15) {
    recommendations.push('High outlier rate detected. Review data collection process for errors.');
    recommendations.push('Consider if outliers represent a different population or process.');
  } else if (rate > 0.05) {
    recommendations.push('Investigate outliers individually to determine if they are errors or legitimate extreme values.');
  }
  
  if (result.method === 'ensemble') {
    recommendations.push('Ensemble method used. Check individual method results for consensus.');
  }
  
  if (result.outliers && result.outliers.length > 0) {
    recommendations.push('Document the reason for each outlier if keeping them in the dataset.');
    recommendations.push('Consider robust statistical methods if outliers cannot be removed.');
  }
  
  if (rate < 0.001 && result.num_outliers > 0) {
    recommendations.push('Very few outliers detected. These may be critical anomalies worth investigating.');
  }
  
  return recommendations;
}

// Export functions
export { detectOutliers as calculateOutlierDetection };