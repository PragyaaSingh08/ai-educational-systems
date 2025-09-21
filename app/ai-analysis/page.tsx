"use client"

import { Navigation } from "@/components/navigation"
import { AIAnalysisDashboard } from "@/components/ai-analysis-dashboard"
import { useState, useEffect } from "react"
import { studentDB } from "@/lib/student-database"
import { analyticsEngine } from "@/lib/analytics-engine"

export default function AIAnalysisPage() {
  const [studentData, setStudentData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])

  useEffect(() => {
    const students = studentDB.getAllStudents()
    const analytics = analyticsEngine.generateAttendanceAnalytics()

    setStudentData(students)
    setAttendanceData(analytics.attendanceTrends)
    setPerformanceData(analytics.studentPerformance)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">AI-Powered Educational Analysis</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Ask questions, get insights, and receive intelligent recommendations based on your data
          </p>
        </div>
        <AIAnalysisDashboard
          studentData={studentData}
          attendanceData={attendanceData}
          performanceData={performanceData}
        />
      </main>
    </div>
  )
}
