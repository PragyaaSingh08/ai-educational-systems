import {
  normalizeData,
  trainTestSplit,
  calculateCorrelation,
  linearRegression,
  kMeansClustering,
  buildDecisionTree,
  randomForestPredict,
  type DataPoint,
} from "../lib/ml-utils"

// Generate sample dataset for demonstration
function generateSampleDataset(size = 1000): DataPoint[] {
  const data: DataPoint[] = []

  for (let i = 0; i < size; i++) {
    // Generate correlated features for realistic ML scenario
    const age = Math.floor(Math.random() * 60) + 18
    const experience = Math.max(0, age - 22 + Math.random() * 5)
    const education = Math.floor(Math.random() * 4) + 1 // 1-4 scale
    const salary = 30000 + experience * 2000 + education * 5000 + Math.random() * 10000
    const performance = Math.min(100, 60 + experience * 2 + education * 5 + Math.random() * 20)

    data.push({
      age,
      experience,
      education,
      salary,
      performance,
      category: performance > 80 ? "high" : performance > 60 ? "medium" : "low",
    })
  }

  return data
}

// Demonstrate hybrid ML pipeline
function demonstrateHybridML() {
  console.log("🤖 Starting Hybrid Machine Learning Demonstration")
  console.log("=".repeat(50))

  // Generate sample data
  const rawData = generateSampleDataset(1000)
  console.log(`📊 Generated dataset with ${rawData.length} samples`)

  // Extract numeric features
  const numericColumns = ["age", "experience", "education", "salary"]
  const targetColumn = "performance"

  // Normalize data
  const normalizedData = normalizeData(rawData, numericColumns)
  console.log("🔧 Data normalized for ML processing")

  // Split data
  const { trainData, testData } = trainTestSplit(normalizedData, 0.2)
  console.log(`📈 Data split: ${trainData.length} training, ${testData.length} testing`)

  // Demonstrate correlation analysis
  const ageValues = rawData.map((d) => Number(d.age))
  const salaryValues = rawData.map((d) => Number(d.salary))
  const correlation = calculateCorrelation(ageValues, salaryValues)
  console.log(`🔗 Age-Salary correlation: ${correlation.toFixed(3)}`)

  // Demonstrate linear regression
  const experienceValues = rawData.map((d) => Number(d.experience))
  const performanceValues = rawData.map((d) => Number(d.performance))
  const regression = linearRegression(experienceValues, performanceValues)
  console.log(`📊 Linear Regression - R²: ${regression.rSquared.toFixed(3)}, Slope: ${regression.slope.toFixed(3)}`)

  // Demonstrate clustering
  const clusteringData = rawData.map((d) => [
    Number(d.age),
    Number(d.experience),
    Number(d.salary) / 1000, // Scale salary
  ])
  const clustering = kMeansClustering(clusteringData, 3, 50)
  console.log(`🎯 K-Means Clustering - Inertia: ${clustering.inertia.toFixed(2)}`)

  // Demonstrate decision tree
  const treeData = rawData.map((d) => [Number(d.age), Number(d.experience), Number(d.education)])
  const treeLabels = rawData.map((d) => (Number(d.performance) > 80 ? 1 : 0))
  const decisionTree = buildDecisionTree(treeData, treeLabels, 5, 10)
  console.log(`🌳 Decision Tree built with ${decisionTree.samples} samples`)

  // Demonstrate ensemble prediction
  const trees = [decisionTree] // In practice, you'd have multiple trees
  const samplePoint = [35, 10, 3] // age=35, experience=10, education=3
  const prediction = randomForestPredict(trees, samplePoint)
  console.log(`🔮 Ensemble Prediction for [35, 10, 3]: ${prediction === 1 ? "High Performance" : "Low Performance"}`)

  console.log("=".repeat(50))
  console.log("✅ Hybrid ML demonstration completed successfully!")

  return {
    datasetSize: rawData.length,
    correlation,
    regression,
    clustering: {
      clusters: clustering.centroids.length,
      inertia: clustering.inertia,
    },
    decisionTree: {
      samples: decisionTree.samples,
    },
  }
}

function demonstrateFacialRecognition() {
  console.log("👤 Starting Facial Recognition Demonstration")
  console.log("=".repeat(50))

  // Simulate facial recognition processing
  const mockFaces = [
    { id: "student_001", name: "John Doe", confidence: 0.92, attendance: true },
    { id: "student_002", name: "Jane Smith", confidence: 0.87, attendance: true },
    { id: "unknown_001", name: null, confidence: 0.65, attendance: false },
  ]

  console.log(`📸 Processed ${mockFaces.length} detected faces`)

  mockFaces.forEach((face, index) => {
    const status = face.name ? "✅ Recognized" : "❓ Unknown"
    const attendanceStatus = face.attendance ? "Present" : "Absent"
    console.log(
      `Face ${index + 1}: ${status} - ${face.name || "Unknown"} (${(face.confidence * 100).toFixed(1)}%) - ${attendanceStatus}`,
    )
  })

  const recognizedCount = mockFaces.filter((f) => f.name).length
  const recognitionRate = (recognizedCount / mockFaces.length) * 100

  console.log(`🎯 Recognition Rate: ${recognitionRate.toFixed(1)}%`)
  console.log(`📊 Attendance Marked: ${mockFaces.filter((f) => f.attendance).length} students`)

  return {
    totalFaces: mockFaces.length,
    recognizedFaces: recognizedCount,
    recognitionRate,
    attendanceMarked: mockFaces.filter((f) => f.attendance).length,
  }
}

// Run the demonstration
const results = demonstrateHybridML()
const faceResults = demonstrateFacialRecognition()

console.log("📋 Final Results:", JSON.stringify({ ...results, facialRecognition: faceResults }, null, 2))
