"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormattedAnalysisDisplay } from "./formatted-analysis-display"
import {
  Brain,
  MessageSquare,
  TrendingUp,
  Users,
  AlertTriangle,
  Lightbulb,
  Send,
  Loader2,
  BarChart3,
  Target,
} from "lucide-react"

interface AIAnalysisDashboardProps {
  studentData?: any[]
  attendanceData?: any[]
  performanceData?: any[]
  modelResults?: any[]
}

interface AnalysisResult {
  analysis: string
  timestamp: string
  context: string
}

interface StudentInsight {
  insights: string
  studentId: string
  timestamp: string
}

interface PredictiveAnalysis {
  predictions: string
  predictionType: string
  confidence: string
  timestamp: string
}

export function AIAnalysisDashboard({
  studentData = [],
  attendanceData = [],
  performanceData = [],
  modelResults = [],
}: AIAnalysisDashboardProps) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [studentInsights, setStudentInsights] = useState<StudentInsight[]>([])
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<PredictiveAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState("general")

  const handleGeneralAnalysis = async () => {
    if (!question.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: "Educational system with ML-powered insights",
          studentData: studentData.slice(0, 10), // Limit data size
          attendanceData: attendanceData.slice(0, 20),
          performanceData: performanceData.slice(0, 15),
        }),
      })

      const result = await response.json()
      setAnalysisResult(result)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudentAnalysis = async (studentId: string) => {
    const student = studentData.find((s) => s.id === studentId)
    if (!student) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/student-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentData: student,
          question: `Provide comprehensive insights about this student's performance and attendance patterns.`,
        }),
      })

      const result = await response.json()
      setStudentInsights((prev) => [result, ...prev.slice(0, 4)]) // Keep last 5 insights
    } catch (error) {
      console.error("Student analysis failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePredictiveAnalysis = async (predictionType: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/predictive-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelResults,
          historicalData: {
            attendance: attendanceData,
            performance: performanceData,
            students: studentData,
          },
          predictionType,
        }),
      })

      const result = await response.json()
      setPredictiveAnalysis(result)
    } catch (error) {
      console.error("Predictive analysis failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI-Powered Educational Analysis
          </CardTitle>
          <CardDescription>
            Ask questions about your students, get insights from ML models, and receive predictive analysis
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            General Analysis
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Student Insights
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* General Analysis Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Ask AI About Your Data
              </CardTitle>
              <CardDescription>
                Ask any question about student performance, attendance patterns, or system insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Ask me anything about your students, attendance patterns, performance trends, or system insights..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleGeneralAnalysis} disabled={isLoading || !question.trim()} className="gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Get AI Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Questions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Sample Questions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Which students are at risk of dropping out?",
                    "What are the attendance patterns this month?",
                    "How can I improve student engagement?",
                    "What factors affect student performance most?",
                  ].map((sample) => (
                    <Button
                      key={sample}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuestion(sample)}
                      className="text-xs bg-transparent"
                    >
                      {sample}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Analysis Result */}
              {analysisResult && (
                <FormattedAnalysisDisplay
                  content={analysisResult.analysis}
                  title="AI Analysis Result"
                  timestamp={analysisResult.timestamp}
                  type="analysis"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Insights Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Individual Student Analysis
              </CardTitle>
              <CardDescription>Get detailed insights about specific students based on their data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {studentData.slice(0, 9).map((student) => (
                  <Card key={student.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{student.name || `Student ${student.id}`}</h3>
                        <Badge variant="outline">{student.class || "N/A"}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground mb-3">
                        <p>Roll: {student.rollNumber || "N/A"}</p>
                        <p>Attendance: {student.attendanceRate || "N/A"}%</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStudentAnalysis(student.id)}
                        disabled={isLoading}
                        className="w-full gap-2"
                      >
                        <Target className="w-3 h-3" />
                        Analyze Student
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Student Insights Results */}
              {studentInsights.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Recent Student Insights</h3>
                  {studentInsights.map((insight, index) => (
                    <FormattedAnalysisDisplay
                      key={index}
                      content={insight.insights}
                      title={`Student Analysis - ${insight.studentId}`}
                      timestamp={insight.timestamp}
                      type="insights"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Analysis Tab */}
        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Predictive Analysis
              </CardTitle>
              <CardDescription>Get AI-powered predictions based on your ML models and historical data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { type: "attendance_forecast", label: "Attendance Forecast", icon: BarChart3 },
                  { type: "performance_prediction", label: "Performance Trends", icon: TrendingUp },
                  { type: "risk_assessment", label: "Risk Assessment", icon: AlertTriangle },
                ].map((prediction) => (
                  <Card key={prediction.type} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <prediction.icon className="w-6 h-6 text-primary" />
                        <h3 className="font-medium">{prediction.label}</h3>
                      </div>
                      <Button
                        onClick={() => handlePredictiveAnalysis(prediction.type)}
                        disabled={isLoading}
                        className="w-full gap-2"
                      >
                        <TrendingUp className="w-3 h-3" />
                        Generate Prediction
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Predictive Analysis Result */}
              {predictiveAnalysis && (
                <FormattedAnalysisDisplay
                  content={predictiveAnalysis.predictions}
                  title={`Predictive Analysis - ${predictiveAnalysis.predictionType.replace("_", " ").toUpperCase()}`}
                  timestamp={predictiveAnalysis.timestamp}
                  type="predictions"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Smart recommendations based on your data analysis and ML insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <h3 className="font-medium">High Priority</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Students with attendance below 75% need immediate intervention
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <h3 className="font-medium">Performance Boost</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Implement peer tutoring for struggling students</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <h3 className="font-medium">Engagement</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Use gamification to improve attendance rates</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <h3 className="font-medium">AI Insights</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Schedule parent meetings for at-risk students</p>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
