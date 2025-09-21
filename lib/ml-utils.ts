export interface DataPoint {
  [key: string]: number | string
}

export interface MLMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  confusionMatrix?: number[][]
}

// Normalize numeric data for ML processing
export function normalizeData(data: DataPoint[], numericColumns: string[]): DataPoint[] {
  const normalized = [...data]

  numericColumns.forEach((column) => {
    const values = data.map((row) => Number(row[column])).filter((val) => !isNaN(val))
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min

    if (range > 0) {
      normalized.forEach((row) => {
        const val = Number(row[column])
        if (!isNaN(val)) {
          row[column] = (val - min) / range
        }
      })
    }
  })

  return normalized
}

// Split data into training and testing sets
export function trainTestSplit(
  data: DataPoint[],
  testSize = 0.2,
): {
  trainData: DataPoint[]
  testData: DataPoint[]
} {
  const shuffled = [...data].sort(() => Math.random() - 0.5)
  const splitIndex = Math.floor(data.length * (1 - testSize))

  return {
    trainData: shuffled.slice(0, splitIndex),
    testData: shuffled.slice(splitIndex),
  }
}

// Calculate correlation between two numeric arrays
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let sumXSquared = 0
  let sumYSquared = 0

  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX
    const deltaY = y[i] - meanY
    numerator += deltaX * deltaY
    sumXSquared += deltaX * deltaX
    sumYSquared += deltaY * deltaY
  }

  const denominator = Math.sqrt(sumXSquared * sumYSquared)
  return denominator === 0 ? 0 : numerator / denominator
}

// Simple linear regression implementation
export function linearRegression(
  x: number[],
  y: number[],
): {
  slope: number
  intercept: number
  rSquared: number
} {
  const n = Math.min(x.length, y.length)
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 }

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY)
    denominator += (x[i] - meanX) ** 2
  }

  const slope = denominator === 0 ? 0 : numerator / denominator
  const intercept = meanY - slope * meanX

  // Calculate R-squared
  let totalSumSquares = 0
  let residualSumSquares = 0

  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept
    totalSumSquares += (y[i] - meanY) ** 2
    residualSumSquares += (y[i] - predicted) ** 2
  }

  const rSquared = totalSumSquares === 0 ? 0 : 1 - residualSumSquares / totalSumSquares

  return { slope, intercept, rSquared }
}

// K-means clustering implementation
export function kMeansClustering(
  data: number[][],
  k: number,
  maxIterations = 100,
): {
  centroids: number[][]
  labels: number[]
  inertia: number
} {
  if (data.length === 0 || k <= 0) {
    return { centroids: [], labels: [], inertia: 0 }
  }

  const dimensions = data[0].length

  // Initialize centroids randomly
  let centroids: number[][] = []
  for (let i = 0; i < k; i++) {
    const centroid: number[] = []
    for (let j = 0; j < dimensions; j++) {
      const values = data.map((point) => point[j])
      const min = Math.min(...values)
      const max = Math.max(...values)
      centroid.push(min + Math.random() * (max - min))
    }
    centroids.push(centroid)
  }

  let labels: number[] = new Array(data.length).fill(0)

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign points to nearest centroid
    const newLabels: number[] = []

    for (let i = 0; i < data.length; i++) {
      let minDistance = Number.POSITIVE_INFINITY
      let closestCentroid = 0

      for (let j = 0; j < k; j++) {
        const distance = euclideanDistance(data[i], centroids[j])
        if (distance < minDistance) {
          minDistance = distance
          closestCentroid = j
        }
      }

      newLabels.push(closestCentroid)
    }

    // Check for convergence
    if (JSON.stringify(labels) === JSON.stringify(newLabels)) {
      break
    }

    labels = newLabels

    // Update centroids
    const newCentroids: number[][] = []

    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, index) => labels[index] === i)

      if (clusterPoints.length > 0) {
        const centroid: number[] = []
        for (let j = 0; j < dimensions; j++) {
          const sum = clusterPoints.reduce((acc, point) => acc + point[j], 0)
          centroid.push(sum / clusterPoints.length)
        }
        newCentroids.push(centroid)
      } else {
        newCentroids.push(centroids[i]) // Keep old centroid if no points assigned
      }
    }

    centroids = newCentroids
  }

  // Calculate inertia (within-cluster sum of squares)
  let inertia = 0
  for (let i = 0; i < data.length; i++) {
    const centroid = centroids[labels[i]]
    inertia += euclideanDistance(data[i], centroid) ** 2
  }

  return { centroids, labels, inertia }
}

// Helper function to calculate Euclidean distance
function euclideanDistance(point1: number[], point2: number[]): number {
  let sum = 0
  for (let i = 0; i < Math.min(point1.length, point2.length); i++) {
    sum += (point1[i] - point2[i]) ** 2
  }
  return Math.sqrt(sum)
}

// Decision tree node for classification
export interface DecisionTreeNode {
  feature?: number
  threshold?: number
  left?: DecisionTreeNode
  right?: DecisionTreeNode
  prediction?: number
  samples?: number
}

// Simple decision tree implementation
export function buildDecisionTree(data: number[][], labels: number[], maxDepth = 5, minSamples = 2): DecisionTreeNode {
  if (data.length === 0) {
    return { prediction: 0, samples: 0 }
  }

  // If all labels are the same or we've reached constraints
  const uniqueLabels = [...new Set(labels)]
  if (uniqueLabels.length === 1 || data.length < minSamples || maxDepth === 0) {
    const prediction = mode(labels)
    return { prediction, samples: data.length }
  }

  // Find best split
  let bestGini = Number.POSITIVE_INFINITY
  let bestFeature = -1
  let bestThreshold = 0
  let bestLeftIndices: number[] = []
  let bestRightIndices: number[] = []

  const features = data[0].length

  for (let feature = 0; feature < features; feature++) {
    const values = data.map((row) => row[feature])
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b)

    for (let i = 0; i < uniqueValues.length - 1; i++) {
      const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2

      const leftIndices: number[] = []
      const rightIndices: number[] = []

      for (let j = 0; j < data.length; j++) {
        if (data[j][feature] <= threshold) {
          leftIndices.push(j)
        } else {
          rightIndices.push(j)
        }
      }

      if (leftIndices.length === 0 || rightIndices.length === 0) continue

      const leftLabels = leftIndices.map((i) => labels[i])
      const rightLabels = rightIndices.map((i) => labels[i])

      const gini =
        (leftLabels.length / labels.length) * calculateGini(leftLabels) +
        (rightLabels.length / labels.length) * calculateGini(rightLabels)

      if (gini < bestGini) {
        bestGini = gini
        bestFeature = feature
        bestThreshold = threshold
        bestLeftIndices = leftIndices
        bestRightIndices = rightIndices
      }
    }
  }

  if (bestFeature === -1) {
    const prediction = mode(labels)
    return { prediction, samples: data.length }
  }

  // Recursively build left and right subtrees
  const leftData = bestLeftIndices.map((i) => data[i])
  const leftLabels = bestLeftIndices.map((i) => labels[i])
  const rightData = bestRightIndices.map((i) => data[i])
  const rightLabels = bestRightIndices.map((i) => labels[i])

  const left = buildDecisionTree(leftData, leftLabels, maxDepth - 1, minSamples)
  const right = buildDecisionTree(rightData, rightLabels, maxDepth - 1, minSamples)

  return {
    feature: bestFeature,
    threshold: bestThreshold,
    left,
    right,
    samples: data.length,
  }
}

// Helper functions
function mode(arr: number[]): number {
  const counts: { [key: number]: number } = {}
  arr.forEach((val) => (counts[val] = (counts[val] || 0) + 1))
  return Number(Object.keys(counts).reduce((a, b) => (counts[Number(a)] > counts[Number(b)] ? a : b)))
}

function calculateGini(labels: number[]): number {
  const counts: { [key: number]: number } = {}
  labels.forEach((label) => (counts[label] = (counts[label] || 0) + 1))

  let gini = 1
  const total = labels.length

  Object.values(counts).forEach((count) => {
    const probability = count / total
    gini -= probability * probability
  })

  return gini
}

// Ensemble methods
export function randomForestPredict(trees: DecisionTreeNode[], dataPoint: number[]): number {
  const predictions = trees.map((tree) => predictWithTree(tree, dataPoint))
  return mode(predictions)
}

function predictWithTree(node: DecisionTreeNode, dataPoint: number[]): number {
  if (node.prediction !== undefined) {
    return node.prediction
  }

  if (node.feature !== undefined && node.threshold !== undefined) {
    if (dataPoint[node.feature] <= node.threshold) {
      return node.left ? predictWithTree(node.left, dataPoint) : 0
    } else {
      return node.right ? predictWithTree(node.right, dataPoint) : 0
    }
  }

  return 0
}
