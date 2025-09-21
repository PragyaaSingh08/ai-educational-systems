"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Brain, Users, MessageSquare, Target, Zap, BarChart3, Cpu } from "lucide-react"

interface MLAnalysisResults {
  timestamp: string
  usability_metrics: Record<string, number[]>
  pca_analysis: {
    n_components: number
    explained_variance: number[]
    cumulative_variance: number[]
  }
  ols_regression: {
    r2_score: number
    coefficients: number[]
    intercept: number
  }
  algorithm_comparison: Record<string, any>
}

interface AlgorithmPerformance {
  name: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
}

export function AdvancedMLDashboard() {
  const [analysisResults, setAnalysisResults] = useState<MLAnalysisResults | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("GBM")
  const [chatbotQuery, setChatbotQuery] = useState("")
  const [chatbotResponse, setChatbotResponse] = useState("")

  const [mlMetrics, setMLMetrics] = useState({
    faceRecognitionAccuracy: 94.2,
    resourceOptimization: 87.5,
    usabilityScore: 4.3,
    recommendationPrecision: 91.8,
  })

  const algorithmComparison: AlgorithmPerformance[] = [
    { name: "GBM", accuracy: 94.2, precision: 92.1, recall: 95.3, f1_score: 93.7 },
    { name: "Random Forest", accuracy: 89.7, precision: 88.4, recall: 91.2, f1_score: 89.8 },
    { name: "KNN", accuracy: 82.3, precision: 80.1, recall: 84.7, f1_score: 82.4 },
    { name: "PCA + GBM", accuracy: 91.5, precision: 90.2, recall: 92.8, f1_score: 91.5 },
    { name: "Neural CF", accuracy: 88.9, precision: 87.6, recall: 90.3, f1_score: 88.9 },
  ]

  const usabilityMetrics = [
    { metric: "Effectiveness", score: 4.2, iso_standard: "ISO 25010" },
    { metric: "Efficiency", score: 4.0, iso_standard: "ISO 25010" },
    { metric: "Satisfaction", score: 4.5, iso_standard: "ISO 25010" },
    { metric: "Learnability", score: 4.1, iso_standard: "ISO 25010" },
    { metric: "Operability", score: 4.3, iso_standard: "ISO 25010" },
    { metric: "User Error Protection", score: 3.9, iso_standard: "ISO 25010" },
    { metric: "UI Aesthetics", score: 4.4, iso_standard: "ISO 25010" },
    { metric: "Accessibility", score: 4.0, iso_standard: "ISO 25010" },
  ]

  const pcaVarianceData = [
    { component: "PC1", variance: 0.342, cumulative: 0.342 },
    { component: "PC2", variance: 0.287, cumulative: 0.629 },
    { component: "PC3", variance: 0.198, cumulative: 0.827 },
    { component: "PC4", variance: 0.123, cumulative: 0.95 },
    { component: "PC5", variance: 0.05, cumulative: 1.0 },
  ]

  const runAdvancedAnalysis = async () => {
    setIsAnalyzing(true)
    console.log("[v0] Starting advanced ML analysis...")

    try {
      // Simulate running Python ML analysis
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const mockResults: MLAnalysisResults = {
        timestamp: new Date().toISOString(),
        usability_metrics: {
          effectiveness: [4, 5, 3, 4, 5],
          efficiency: [3, 4, 5, 4, 3],
          satisfaction: [5, 4, 3, 5, 4],
          learnability: [4, 5, 4, 3, 4],
        },
        pca_analysis: {
          n_components: 4,
          explained_variance: [0.342, 0.287, 0.198, 0.123],
          cumulative_variance: [0.342, 0.629, 0.827, 0.95],
        },
        ols_regression: {
          r2_score: 0.847,
          coefficients: [0.23, -0.15, 0.41, 0.32, -0.08],
          intercept: 2.14,
        },
        algorithm_comparison: {
          GBM: { mean_score: 0.942, std_score: 0.023 },
          RF: { mean_score: 0.897, std_score: 0.031 },
          KNN: { mean_score: 0.823, std_score: 0.045 },
        },
      }

      setAnalysisResults(mockResults)
      console.log("[v0] Advanced ML analysis completed successfully")
    } catch (error) {
      console.error("[v0] Error in ML analysis:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleChatbotQuery = () => {
    console.log("[v0] Processing chatbot query:", chatbotQuery)

    const query = chatbotQuery.toLowerCase()
    let response = ""

    if (query.includes("attendance")) {
      response = "Your current attendance is 87.5%. You have attended 35 out of 40 classes this semester."
    } else if (query.includes("schedule") || query.includes("timetable")) {
      response = "Your next class is Machine Learning at 2:00 PM in Room 301."
    } else if (query.includes("grade") || query.includes("marks")) {
      response = "Your current grade in AI Systems is A- (87%). Keep up the excellent work!"
    } else if (query.includes("recommendation")) {
      response = "Based on your performance, I recommend focusing on Neural Networks and Deep Learning modules."
    } else {
      response =
        "I can help you with attendance, schedules, grades, and personalized recommendations. What would you like to know?"
    }

    setChatbotResponse(response)
    setChatbotQuery("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Advanced ML Framework</h2>
          <p className="text-muted-foreground">ISO 25010 guided analysis with CNNs, GBM, and NLP integration</p>
        </div>
        <Button onClick={runAdvancedAnalysis} disabled={isAnalyzing} className="bg-primary hover:bg-primary/90">
          {isAnalyzing ? (
            <>
              <Cpu className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Face Recognition</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlMetrics.faceRecognitionAccuracy}%</div>
            <p className="text-xs text-muted-foreground">CNN + FaceNet accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Optimization</CardTitle>
            <Zap className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlMetrics.resourceOptimization}%</div>
            <p className="text-xs text-muted-foreground">ML scheduling efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usability Score</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlMetrics.usabilityScore}/5</div>
            <p className="text-xs text-muted-foreground">ISO 25010 compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GBM Precision</CardTitle>
            <BarChart3 className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlMetrics.recommendationPrecision}%</div>
            <p className="text-xs text-muted-foreground">Recommendation accuracy</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="algorithms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="algorithms">Algorithm Comparison</TabsTrigger>
          <TabsTrigger value="usability">ISO 25010 Analysis</TabsTrigger>
          <TabsTrigger value="pca">PCA & Regression</TabsTrigger>
          <TabsTrigger value="chatbot">NLP Chatbot</TabsTrigger>
          <TabsTrigger value="recommendations">GBM Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="algorithms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Performance Comparison</CardTitle>
              <CardDescription>GBM vs RF vs KNN vs PCA vs Neural Collaborative Filtering</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={algorithmComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#10b981" name="Accuracy" />
                  <Bar dataKey="precision" fill="#f59e0b" name="Precision" />
                  <Bar dataKey="recall" fill="#ef4444" name="Recall" />
                  <Bar dataKey="f1_score" fill="#8b5cf6" name="F1 Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {algorithmComparison.map((algo) => (
              <Card key={algo.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{algo.name}</CardTitle>
                  <Badge variant={algo.name === "GBM" ? "default" : "secondary"}>
                    {algo.name === "GBM" ? "Best Performance" : "Comparison"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-semibold">{algo.accuracy}%</span>
                  </div>
                  <Progress value={algo.accuracy} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Precision: {algo.precision}%</span>
                    <span>Recall: {algo.recall}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ISO 25010 Usability Model Analysis</CardTitle>
              <CardDescription>
                Mixed-methods analysis with structured surveys and statistical evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={usabilityMetrics} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 5]} />
                  <YAxis dataKey="metric" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {usabilityMetrics.map((metric) => (
              <Card key={metric.metric}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{metric.metric}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {metric.iso_standard}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.score}/5</div>
                  <Progress value={(metric.score / 5) * 100} className="h-2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pca" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Principal Component Analysis</CardTitle>
                <CardDescription>Dimensionality reduction and variance explanation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pcaVarianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="component" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="variance" stroke="#10b981" name="Individual Variance" />
                    <Line type="monotone" dataKey="cumulative" stroke="#f59e0b" name="Cumulative Variance" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OLS Regression Analysis</CardTitle>
                <CardDescription>Ordinary Least Squares regression results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisResults && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>R² Score:</span>
                      <Badge variant="default">{(analysisResults.ols_regression.r2_score * 100).toFixed(1)}%</Badge>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Model Coefficients:</span>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {analysisResults.ols_regression.coefficients.map((coef, index) => (
                          <div key={index} className="flex justify-between">
                            <span>β{index + 1}:</span>
                            <span>{coef.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Intercept:</span>
                      <span className="font-mono">{analysisResults.ols_regression.intercept.toFixed(3)}</span>
                    </div>
                  </>
                )}
                {!analysisResults && (
                  <div className="text-center text-muted-foreground">Run analysis to see regression results</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chatbot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Educational NLP Chatbot</CardTitle>
              <CardDescription>Natural Language Processing for student queries and support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ask about attendance, schedule, grades, or recommendations..."
                  value={chatbotQuery}
                  onChange={(e) => setChatbotQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyPress={(e) => e.key === "Enter" && handleChatbotQuery()}
                />
                <Button onClick={handleChatbotQuery} disabled={!chatbotQuery.trim()}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask
                </Button>
              </div>

              {chatbotResponse && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary rounded-full p-2">
                        <MessageSquare className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{chatbotResponse}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["Check attendance", "View schedule", "See grades", "Get recommendations"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setChatbotQuery(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gradient Boosting Machine Recommendations</CardTitle>
              <CardDescription>Personalized educational content recommendations using GBM</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                    <CardHeader>
                      <CardTitle className="text-lg">Recommended Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Advanced Neural Networks</span>
                        <Badge>95% match</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Deep Learning Applications</span>
                        <Badge>92% match</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Computer Vision</span>
                        <Badge>89% match</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-secondary/10 to-accent/10">
                    <CardHeader>
                      <CardTitle className="text-lg">Study Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>ML Research Papers</span>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Python ML Tutorials</span>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>TensorFlow Guides</span>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">GBM Model Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">91.8%</div>
                        <div className="text-xs text-muted-foreground">Precision</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-secondary">88.4%</div>
                        <div className="text-xs text-muted-foreground">Recall</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-accent">0.23</div>
                        <div className="text-xs text-muted-foreground">RMSE</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running Advanced ML Analysis...</span>
                <span>Processing</span>
              </div>
              <Progress value={66} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Executing PCA, OLS regression, GBM training, and algorithm comparison
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
