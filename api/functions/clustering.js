/**
 * Clustering Analysis Function
 * Implements K-means, hierarchical, and DBSCAN clustering for data analysis
 * Used by Client Learning Agent for behavioral segmentation
 */

/**
 * Main clustering function with multiple algorithms
 * @param {Object} params - Clustering parameters
 * @param {Array} params.data - Data points to cluster (array of arrays)
 * @param {string} params.method - Clustering method ('kmeans', 'hierarchical', 'dbscan')
 * @param {number} params.num_clusters - Number of clusters (for k-means)
 * @param {number} params.epsilon - Epsilon for DBSCAN
 * @param {number} params.min_points - Minimum points for DBSCAN
 * @param {number} params.max_iterations - Maximum iterations for k-means
 * @returns {Object} Clustering results with assignments and metrics
 */
export async function performClustering(params) {
  try {
    const {
      data,
      method = 'kmeans',
      num_clusters = 3,
      epsilon = 0.5,
      min_points = 5,
      max_iterations = 100
    } = params;

    // Validate inputs
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Valid data array is required');
    }

    if (!Array.isArray(data[0])) {
      throw new Error('Data must be an array of arrays (2D)');
    }

    let result;
    
    switch (method.toLowerCase()) {
      case 'kmeans':
        result = await performKMeans(data, num_clusters, max_iterations);
        break;
      
      case 'hierarchical':
        result = await performHierarchical(data, num_clusters);
        break;
      
      case 'dbscan':
        result = await performDBSCAN(data, epsilon, min_points);
        break;
      
      default:
        throw new Error(`Unknown clustering method: ${method}`);
    }

    return {
      status: 'success',
      method: method,
      ...result,
      quality_metrics: calculateClusteringQuality(data, result.assignments, result.centroids),
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Clustering error:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date()
    };
  }
}

/**
 * K-means clustering implementation
 */
async function performKMeans(data, k, maxIterations) {
  const n = data.length;
  const dimensions = data[0].length;
  
  // Initialize centroids using k-means++ method
  const centroids = initializeCentroidsKMeansPlusPlus(data, k);
  let assignments = new Array(n).fill(0);
  let previousAssignments;
  let iterations = 0;
  
  // Main k-means loop
  while (iterations < maxIterations) {
    previousAssignments = [...assignments];
    
    // Assignment step
    for (let i = 0; i < n; i++) {
      let minDistance = Infinity;
      let closestCentroid = 0;
      
      for (let j = 0; j < k; j++) {
        const distance = euclideanDistance(data[i], centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = j;
        }
      }
      
      assignments[i] = closestCentroid;
    }
    
    // Update step
    for (let j = 0; j < k; j++) {
      const clusterPoints = data.filter((_, i) => assignments[i] === j);
      
      if (clusterPoints.length > 0) {
        centroids[j] = calculateCentroid(clusterPoints);
      }
    }
    
    // Check for convergence
    if (arraysEqual(assignments, previousAssignments)) {
      break;
    }
    
    iterations++;
  }
  
  // Calculate within-cluster sum of squares
  const wcss = calculateWCSS(data, assignments, centroids);
  
  // Calculate silhouette score
  const silhouetteScore = calculateSilhouetteScore(data, assignments);
  
  return {
    assignments,
    centroids,
    num_clusters: k,
    iterations,
    wcss,
    silhouette_score: silhouetteScore,
    cluster_sizes: getClusterSizes(assignments, k)
  };
}

/**
 * Hierarchical clustering implementation
 */
async function performHierarchical(data, numClusters) {
  const n = data.length;
  
  // Calculate distance matrix
  const distanceMatrix = calculateDistanceMatrix(data);
  
  // Initialize clusters (each point is its own cluster)
  let clusters = data.map((_, i) => [i]);
  let clusterDistances = [...distanceMatrix.map(row => [...row])];
  
  // Agglomerative clustering
  while (clusters.length > numClusters) {
    // Find minimum distance
    let minDistance = Infinity;
    let mergeI = 0, mergeJ = 1;
    
    for (let i = 0; i < clusters.length - 1; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (clusterDistances[i][j] < minDistance) {
          minDistance = clusterDistances[i][j];
          mergeI = i;
          mergeJ = j;
        }
      }
    }
    
    // Merge clusters
    const newCluster = [...clusters[mergeI], ...clusters[mergeJ]];
    clusters[mergeI] = newCluster;
    clusters.splice(mergeJ, 1);
    
    // Update distance matrix (using average linkage)
    updateDistanceMatrix(clusterDistances, mergeI, mergeJ);
  }
  
  // Create assignments array
  const assignments = new Array(n);
  clusters.forEach((cluster, clusterIdx) => {
    cluster.forEach(pointIdx => {
      assignments[pointIdx] = clusterIdx;
    });
  });
  
  // Calculate centroids
  const centroids = [];
  for (let i = 0; i < numClusters; i++) {
    const clusterPoints = data.filter((_, idx) => assignments[idx] === i);
    if (clusterPoints.length > 0) {
      centroids.push(calculateCentroid(clusterPoints));
    }
  }
  
  return {
    assignments,
    centroids,
    num_clusters: numClusters,
    dendrogram: 'Hierarchical structure available',
    linkage_method: 'average'
  };
}

/**
 * DBSCAN clustering implementation
 */
async function performDBSCAN(data, epsilon, minPoints) {
  const n = data.length;
  const assignments = new Array(n).fill(-1); // -1 means unassigned
  let currentCluster = 0;
  
  for (let i = 0; i < n; i++) {
    if (assignments[i] !== -1) continue; // Already processed
    
    const neighbors = getNeighbors(data, i, epsilon);
    
    if (neighbors.length < minPoints) {
      assignments[i] = -2; // Mark as noise
      continue;
    }
    
    // Start new cluster
    assignments[i] = currentCluster;
    const seedSet = [...neighbors];
    
    for (let j = 0; j < seedSet.length; j++) {
      const currentPoint = seedSet[j];
      
      if (assignments[currentPoint] === -2) {
        assignments[currentPoint] = currentCluster; // Change noise to border point
      }
      
      if (assignments[currentPoint] !== -1) continue; // Already processed
      
      assignments[currentPoint] = currentCluster;
      const currentNeighbors = getNeighbors(data, currentPoint, epsilon);
      
      if (currentNeighbors.length >= minPoints) {
        seedSet.push(...currentNeighbors.filter(p => !seedSet.includes(p)));
      }
    }
    
    currentCluster++;
  }
  
  // Calculate centroids for each cluster
  const centroids = [];
  const numClusters = Math.max(...assignments.filter(a => a >= 0)) + 1;
  
  for (let i = 0; i < numClusters; i++) {
    const clusterPoints = data.filter((_, idx) => assignments[idx] === i);
    if (clusterPoints.length > 0) {
      centroids.push(calculateCentroid(clusterPoints));
    }
  }
  
  const noisePoints = assignments.filter(a => a === -2).length;
  
  return {
    assignments: assignments.map(a => a === -2 ? -1 : a), // Convert noise to -1
    centroids,
    num_clusters: numClusters,
    noise_points: noisePoints,
    epsilon,
    min_points: minPoints
  };
}

// Helper functions

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function calculateCentroid(points) {
  const dimensions = points[0].length;
  const centroid = new Array(dimensions).fill(0);
  
  points.forEach(point => {
    point.forEach((val, i) => {
      centroid[i] += val;
    });
  });
  
  return centroid.map(val => val / points.length);
}

function initializeCentroidsKMeansPlusPlus(data, k) {
  const centroids = [];
  const n = data.length;
  
  // Choose first centroid randomly
  centroids.push([...data[Math.floor(Math.random() * n)]]);
  
  // Choose remaining centroids
  for (let i = 1; i < k; i++) {
    const distances = data.map(point => {
      const minDist = Math.min(...centroids.map(c => euclideanDistance(point, c)));
      return minDist * minDist; // Square the distance for probability
    });
    
    const totalDistance = distances.reduce((a, b) => a + b, 0);
    const probabilities = distances.map(d => d / totalDistance);
    
    // Choose point based on probability
    const r = Math.random();
    let cumulativeProbability = 0;
    for (let j = 0; j < n; j++) {
      cumulativeProbability += probabilities[j];
      if (r <= cumulativeProbability) {
        centroids.push([...data[j]]);
        break;
      }
    }
  }
  
  return centroids;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

function calculateWCSS(data, assignments, centroids) {
  return data.reduce((sum, point, i) => {
    const centroid = centroids[assignments[i]];
    return sum + Math.pow(euclideanDistance(point, centroid), 2);
  }, 0);
}

function calculateSilhouetteScore(data, assignments) {
  const n = data.length;
  let totalScore = 0;
  
  for (let i = 0; i < n; i++) {
    const clusterIdx = assignments[i];
    
    // Calculate average distance to points in same cluster
    const sameCluster = data.filter((_, j) => j !== i && assignments[j] === clusterIdx);
    const a = sameCluster.length > 0
      ? sameCluster.reduce((sum, p) => sum + euclideanDistance(data[i], p), 0) / sameCluster.length
      : 0;
    
    // Calculate average distance to points in nearest other cluster
    let b = Infinity;
    const uniqueClusters = [...new Set(assignments)].filter(c => c !== clusterIdx);
    
    for (const otherCluster of uniqueClusters) {
      const otherPoints = data.filter((_, j) => assignments[j] === otherCluster);
      if (otherPoints.length > 0) {
        const avgDist = otherPoints.reduce((sum, p) => sum + euclideanDistance(data[i], p), 0) / otherPoints.length;
        b = Math.min(b, avgDist);
      }
    }
    
    const s = b === Infinity ? 0 : (b - a) / Math.max(a, b);
    totalScore += s;
  }
  
  return totalScore / n;
}

function getClusterSizes(assignments, k) {
  const sizes = new Array(k).fill(0);
  assignments.forEach(a => {
    if (a >= 0 && a < k) sizes[a]++;
  });
  return sizes;
}

function calculateDistanceMatrix(data) {
  const n = data.length;
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = euclideanDistance(data[i], data[j]);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }
  
  return matrix;
}

function updateDistanceMatrix(matrix, mergeI, mergeJ) {
  // Remove merged cluster row/column
  matrix.splice(mergeJ, 1);
  matrix.forEach(row => row.splice(mergeJ, 1));
  
  // Update distances for merged cluster (average linkage)
  for (let i = 0; i < matrix.length; i++) {
    if (i !== mergeI) {
      const avgDist = (matrix[mergeI][i] + matrix[Math.min(mergeJ, i)][Math.max(mergeJ, i)]) / 2;
      matrix[mergeI][i] = avgDist;
      matrix[i][mergeI] = avgDist;
    }
  }
}

function getNeighbors(data, pointIdx, epsilon) {
  const neighbors = [];
  for (let i = 0; i < data.length; i++) {
    if (i !== pointIdx && euclideanDistance(data[pointIdx], data[i]) <= epsilon) {
      neighbors.push(i);
    }
  }
  return neighbors;
}

function calculateClusteringQuality(data, assignments, centroids) {
  const silhouette = calculateSilhouetteScore(data, assignments);
  const wcss = calculateWCSS(data, assignments, centroids);
  const numClusters = centroids.length;
  
  // Davies-Bouldin Index (lower is better)
  let dbIndex = 0;
  for (let i = 0; i < numClusters; i++) {
    let maxRatio = 0;
    const clusterI = data.filter((_, idx) => assignments[idx] === i);
    const scatterI = calculateIntraClusterDistance(clusterI, centroids[i]);
    
    for (let j = 0; j < numClusters; j++) {
      if (i !== j) {
        const clusterJ = data.filter((_, idx) => assignments[idx] === j);
        const scatterJ = calculateIntraClusterDistance(clusterJ, centroids[j]);
        const separation = euclideanDistance(centroids[i], centroids[j]);
        const ratio = (scatterI + scatterJ) / separation;
        maxRatio = Math.max(maxRatio, ratio);
      }
    }
    dbIndex += maxRatio;
  }
  dbIndex /= numClusters;
  
  return {
    silhouette_coefficient: silhouette,
    davies_bouldin_index: dbIndex,
    within_cluster_sum_squares: wcss,
    interpretation: interpretClusteringQuality(silhouette, dbIndex)
  };
}

function calculateIntraClusterDistance(clusterPoints, centroid) {
  if (clusterPoints.length === 0) return 0;
  return Math.sqrt(
    clusterPoints.reduce((sum, p) => sum + Math.pow(euclideanDistance(p, centroid), 2), 0) / clusterPoints.length
  );
}

function interpretClusteringQuality(silhouette, dbIndex) {
  let quality = '';
  
  if (silhouette > 0.7) quality = 'Excellent clustering';
  else if (silhouette > 0.5) quality = 'Good clustering';
  else if (silhouette > 0.25) quality = 'Fair clustering';
  else quality = 'Poor clustering';
  
  if (dbIndex < 0.5) quality += ' with well-separated clusters';
  else if (dbIndex < 1.0) quality += ' with moderately separated clusters';
  else quality += ' with overlapping clusters';
  
  return quality;
}

// Export main function
export { performClustering as calculateClustering };