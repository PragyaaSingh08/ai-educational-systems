import { type NextRequest, NextResponse } from "next/server"

interface PerformanceData {
  month: string
  average: number
  attendance: number
  assignments: number
}

interface SubjectPerformance {
  subject: string
  performance: number
  trend: "up" | "down" | "stable"
}

interface GradeDistribution {
  grade: string
  count: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const semester = searchParams.get("semester")
    const type = searchParams.get("type") // 'trends', 'subjects', 'grades'

    // Mock performance data
    const performanceData: PerformanceData[] = [
      { month: "Jan", average: 78, attendance: 85, assignments: 82 },
      { month: "Feb", average: 81, attendance: 88, assignments: 85 },
      { month: "Mar", average: 83, attendance: 87, assignments: 88 },
      { month: "Apr", average: 85, attendance: 90, assignments: 87 },
      { month: "May", average: 87, attendance: 89, assignments: 90 },
    ]

    const subjectPerformance: SubjectPerformance[] = [
      { subject: "ML Fundamentals", performance: 85, trend: "up" },
      { subject: "Data Structures", performance: 82, trend: "up" },
      { subject: "Database Systems", performance: 79, trend: "down" },
      { subject: "Algorithms", performance: 88, trend: "up" },
      { subject: "Software Engineering", performance: 84, trend: "stable" },
    ]

    const gradeDistribution: GradeDistribution[] = [
      { grade: "A", count: 45 },
      { grade: "B", count: 38 },
      { grade: "C", count: 22 },
      { grade: "D", count: 8 },
      { grade: "F", count: 3 },
    ]

    let responseData: any = {}

    switch (type) {
      case "trends":
        responseData = { trends: performanceData }
        break
      case "subjects":
        responseData = { subjects: subjectPerformance }
        break
      case "grades":
        responseData = { grades: gradeDistribution }
        break
      default:
        responseData = {
          trends: performanceData,
          subjects: subjectPerformance,
          grades: gradeDistribution,
        }
    }

    return NextResponse.json({
      success: true,
      semester: semester || "Fall 2024",
      ...responseData,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch performance data" }, { status: 500 })
  }
}
