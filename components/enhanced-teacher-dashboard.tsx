"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Users, BarChart3, MessageSquare, TrendingUp } from "lucide-react"
import { TeacherDashboard } from "./teacher-dashboard"
import { AIAnalysisDashboard } from "./ai-analysis-dashboard"
import { AdvancedAnalyticsDashboard } from "./advanced-analytics-dashboard"
import { studentDB } from "@/lib/student-database"
import { analyticsEngine } from "@/lib/analytics-engine"

export function EnhancedTeacherDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [studentData, setStudentData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = () => {
    const students = studentDB.getAllStudents()
    const analytics = analyticsEngine.generateAttendanceAnalytics()

    setStudentData(students)
    setAttendanceData(analytics.attendanceTrends)
    setPerformanceData(analytics.studentPerformance)
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enhanced Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights, student management, and predictive analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Brain className="w-4 h-4" />
            AI Powered
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Student Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Advanced Analytics
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Predictive Insights
          </TabsTrigger>
        </TabsList>

        {/* Student Management Tab */}
        <TabsContent value="overview">
          <TeacherDashboard />
        </TabsContent>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai-analysis">
          <AIAnalysisDashboard
            studentData={studentData}
            attendanceData={attendanceData}
            performanceData={performanceData}
          />
        </TabsContent>

        {/* Predictive Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Predictive Insights Dashboard
              </CardTitle>
              <CardDescription>AI-powered predictions and recommendations based on your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Attendance Forecast</h3>
                      <p className="text-sm text-muted-foreground">Next week prediction</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">87.3%</div>
                  <p className="text-xs text-muted-foreground">Expected attendance rate</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">At-Risk Students</h3>
                      <p className="text-sm text-muted-foreground">Require intervention</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-600 mb-1">3</div>
                  <p className="text-xs text-muted-foreground">Students need attention</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Performance Trend</h3>
                      <p className="text-sm text-muted-foreground">Overall class trend</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">↗ 12%</div>
                  <p className="text-xs text-muted-foreground">Improvement this month</p>
                </Card>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-4">AI Recommendations</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Schedule parent meetings</p>
                      <p className="text-sm text-muted-foreground">
                        For students with attendance below 70% - John Doe, Jane Smith, Mike Johnson
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Brain className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Implement peer tutoring</p>
                      <p className="text-sm text-muted-foreground">
                        Pair high-performing students with those needing support in Mathematics
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Adjust teaching methods</p>
                      <p className="text-sm text-muted-foreground">
                        Consider more interactive sessions for better engagement in afternoon classes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
